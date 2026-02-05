import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { interviews, answers } from "@/utils/schema";
import { generateCompletion } from "@/lib/groq";
import { getAnswerEvaluatorPrompt } from "@/utils/prompts";
import { EvaluateAnswerRequest, AnswerEvaluation, Question } from "@/types";
import { getCurrentUser } from "@/lib/auth";
import { validateKeywords } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: EvaluateAnswerRequest & {
      speechMetrics?: {
        fillerWordCount: number;
        fillerWords: Record<string, number>;
        wordsPerMinute: number;
        speakingTime: number;
      };
    } = await request.json();
    const { interviewId, questionIndex, questionText, userAnswer, speechMetrics } = body;

    // Validate input
    if (!interviewId || questionIndex === undefined || !questionText || !userAnswer) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get interview details
    const interview = await db
      .select()
      .from(interviews)
      .where(eq(interviews.mockId, interviewId))
      .limit(1);

    if (!interview.length) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 });
    }

    const interviewData = interview[0];

    // Verify user owns this interview
    if (interviewData.userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get keywords from the question (if available from PDF upload)
    let questionKeywords: string[] | undefined;
    try {
      const questionsData = JSON.parse(interviewData.questionsJson as string) as { questions: Question[] };
      const currentQuestion = questionsData.questions[questionIndex];
      questionKeywords = currentQuestion?.keywords;
    } catch {
      // No keywords available (might be AI-generated interview)
      questionKeywords = undefined;
    }

    // Update interview status to in_progress if pending
    if (interviewData.status === "pending") {
      await db
        .update(interviews)
        .set({ status: "in_progress" })
        .where(eq(interviews.mockId, interviewId));
    }

    // Generate evaluation using AI
    const prompt = getAnswerEvaluatorPrompt({
      question: questionText,
      answer: userAnswer,
      role: interviewData.role,
      experience: interviewData.experienceLevel,
    });

    let evaluationJson: string;
    let evaluation: AnswerEvaluation;

    try {
      evaluationJson = await generateCompletion([
        { role: "system", content: "You are an expert interviewer evaluating candidates. Always respond with valid JSON only." },
        { role: "user", content: prompt },
      ]);

      evaluation = JSON.parse(evaluationJson);

      // Validate evaluation structure
      if (
        typeof evaluation.technicalScore !== "number" ||
        typeof evaluation.communicationScore !== "number" ||
        typeof evaluation.depthScore !== "number"
      ) {
        throw new Error("Invalid evaluation format");
      }

      // Clamp component scores to valid range (0-10)
      evaluation.technicalScore = Math.max(0, Math.min(10, evaluation.technicalScore));
      evaluation.communicationScore = Math.max(0, Math.min(10, evaluation.communicationScore));
      evaluation.depthScore = Math.max(0, Math.min(10, evaluation.depthScore));

      // ALWAYS calculate overall score from component scores (don't trust AI calculation)
      // Component scores are 0-10, overall score is 0-100 (percentage)
      evaluation.overallScore = Math.round(
        (evaluation.technicalScore * 0.4 +
          evaluation.communicationScore * 0.3 +
          evaluation.depthScore * 0.3) *
          10
      );

      console.log("[Evaluation] Scores - Tech:", evaluation.technicalScore,
                  "Comm:", evaluation.communicationScore,
                  "Depth:", evaluation.depthScore,
                  "Overall:", evaluation.overallScore + "%");

      // Add speech metrics to evaluation
      if (speechMetrics) {
        evaluation.fillerWordCount = speechMetrics.fillerWordCount;
        evaluation.fillerWords = speechMetrics.fillerWords;
        evaluation.wordsPerMinute = speechMetrics.wordsPerMinute;
        evaluation.speakingTime = speechMetrics.speakingTime;

        // Add feedback about speech metrics
        if (speechMetrics.fillerWordCount > 5) {
          evaluation.weaknesses.push(
            `Used ${speechMetrics.fillerWordCount} filler words - try to reduce these for clearer communication`
          );
        } else if (speechMetrics.fillerWordCount === 0) {
          evaluation.strengths.push("Excellent - no filler words used!");
        } else if (speechMetrics.fillerWordCount <= 2) {
          evaluation.strengths.push("Great communication - minimal filler words");
        }

        if (speechMetrics.wordsPerMinute < 120) {
          evaluation.weaknesses.push(
            `Speaking pace (${speechMetrics.wordsPerMinute} WPM) is too slow - try to speak a bit faster`
          );
        } else if (speechMetrics.wordsPerMinute > 180) {
          evaluation.weaknesses.push(
            `Speaking pace (${speechMetrics.wordsPerMinute} WPM) is too fast - slow down for clarity`
          );
        } else if (speechMetrics.wordsPerMinute >= 140 && speechMetrics.wordsPerMinute <= 160) {
          evaluation.strengths.push("Perfect speaking pace!");
        }

        console.log("[Speech Metrics] Filler words:", speechMetrics.fillerWordCount,
                    "WPM:", speechMetrics.wordsPerMinute);
      }
    } catch (aiError) {
      console.error("AI evaluation error:", aiError);
      // Fallback evaluation
      evaluation = {
        technicalScore: 5,
        communicationScore: 5,
        depthScore: 5,
        overallScore: 50,
        strengths: ["Attempted to answer the question"],
        weaknesses: ["Could provide more detailed response"],
        idealAnswer: "A comprehensive answer would include specific examples and technical details relevant to the question.",
        followUpTip: "Try to provide concrete examples from your experience.",
        encouragement: "Good effort! Keep practicing to improve.",
      };
    }

    // Validate keywords if available (for PDF-uploaded questions)
    if (questionKeywords && questionKeywords.length > 0) {
      const keywordValidation = validateKeywords(questionKeywords, userAnswer);

      evaluation.keywordScore = keywordValidation.score;
      evaluation.keywordsCovered = keywordValidation.covered;
      evaluation.keywordsMissed = keywordValidation.missed;
      evaluation.keywordValidationPassed = keywordValidation.passed;

      // Add keyword feedback to weaknesses if validation failed
      if (!keywordValidation.passed && keywordValidation.missed.length > 0) {
        evaluation.weaknesses.push(
          `Missing key concepts: ${keywordValidation.missed.slice(0, 3).join(", ")}`
        );
      }

      // Add to strengths if good coverage
      if (keywordValidation.passed && keywordValidation.covered.length > 0) {
        evaluation.strengths.push(
          `Covered important concepts: ${keywordValidation.covered.slice(0, 3).join(", ")}`
        );
      }
    }

    // Save answer to database
    await db.insert(answers).values({
      interviewId: interviewData.id,
      questionIndex,
      questionText,
      userAnswer,
      feedbackJson: JSON.stringify(evaluation),
      technicalScore: evaluation.technicalScore,
      communicationScore: evaluation.communicationScore,
      depthScore: evaluation.depthScore,
      idealAnswer: evaluation.idealAnswer,
    });

    return NextResponse.json({
      success: true,
      evaluation,
    });
  } catch (error) {
    console.error("Evaluate answer error:", error);
    return NextResponse.json(
      { error: "Failed to evaluate answer" },
      { status: 500 }
    );
  }
}
