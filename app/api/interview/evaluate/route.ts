import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { interviews, answers } from "@/utils/schema";
import { generateCompletion } from "@/lib/groq";
import { getAnswerEvaluatorPrompt } from "@/utils/prompts";
import { EvaluateAnswerRequest, AnswerEvaluation } from "@/types";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: EvaluateAnswerRequest = await request.json();
    const { interviewId, questionIndex, questionText, userAnswer } = body;

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

      // Calculate overall score if not provided
      if (!evaluation.overallScore) {
        evaluation.overallScore = Math.round(
          (evaluation.technicalScore * 0.4 +
            evaluation.communicationScore * 0.3 +
            evaluation.depthScore * 0.3) *
            10
        );
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
