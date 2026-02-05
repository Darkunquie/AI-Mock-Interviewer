import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { interviews, answers, interviewSummaries } from "@/utils/schema";
import { generateCompletion } from "@/lib/groq";
import { getSummaryGeneratorPrompt } from "@/utils/prompts";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { interviewId } = await request.json();

    if (!interviewId) {
      return NextResponse.json({ error: "Interview ID required" }, { status: 400 });
    }

    // Get interview
    const interview = await db
      .select()
      .from(interviews)
      .where(eq(interviews.mockId, interviewId))
      .limit(1);

    if (!interview.length) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 });
    }

    const interviewData = interview[0];

    if (interviewData.userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get all answers
    const interviewAnswers = await db
      .select()
      .from(answers)
      .where(eq(answers.interviewId, interviewData.id))
      .orderBy(answers.questionIndex);

    if (interviewAnswers.length === 0) {
      return NextResponse.json({ error: "No answers found" }, { status: 400 });
    }

    // Get total number of questions
    const questionsData = JSON.parse(interviewData.questionsJson as string);
    const totalQuestions = questionsData.questions?.length || 0;

    // Prepare answers for summary generation
    const answersData = interviewAnswers.map((a) => ({
      question: a.questionText,
      answer: a.userAnswer || "",
      technicalScore: a.technicalScore || 0,
      communicationScore: a.communicationScore || 0,
      depthScore: a.depthScore || 0,
    }));

    // Calculate accurate scores accounting for unanswered questions
    const totalAnsweredScore = answersData.reduce((sum, a) =>
      sum + (a.technicalScore * 0.4 + a.communicationScore * 0.3 + a.depthScore * 0.3), 0
    );

    // Accurate overall score: (sum of answered scores + 0 for unanswered) / total questions
    const accurateOverallScore = totalQuestions > 0
      ? Math.round((totalAnsweredScore / totalQuestions) * 10)
      : 0;

    // Generate summary using AI
    const prompt = getSummaryGeneratorPrompt({
      answers: answersData,
      role: interviewData.role,
    });

    let summaryData;
    try {
      const summaryJson = await generateCompletion([
        { role: "system", content: "You are a career coach providing interview feedback. Always respond with valid JSON only." },
        { role: "user", content: prompt },
      ]);

      summaryData = JSON.parse(summaryJson);
      // Override AI score with accurate calculation
      summaryData.overallScore = accurateOverallScore;
    } catch (aiError) {
      console.error("AI summary error:", aiError);

      // Fallback summary with accurate score
      const answeredCount = interviewAnswers.length;
      const unansweredCount = totalQuestions - answeredCount;

      summaryData = {
        overallScore: accurateOverallScore,
        rating: accurateOverallScore >= 70 ? "Good" : accurateOverallScore >= 50 ? "Average" : "Needs Improvement",
        performanceSummary: unansweredCount > 0
          ? `You answered ${answeredCount} out of ${totalQuestions} questions. ${unansweredCount} unanswered question(s) were scored as 0.`
          : "You completed the interview. Review your answers to identify areas for improvement.",
        strengths: ["Completed the interview", "Showed willingness to answer"],
        weaknesses: unansweredCount > 0
          ? [`${unansweredCount} question(s) left unanswered`, "Review technical concepts", "Practice providing more detailed answers"]
          : ["Review technical concepts", "Practice providing more detailed answers"],
        recommendedTopics: ["Interview preparation", "Technical fundamentals", "Communication skills"],
        actionPlan: "Practice more mock interviews and review common questions for your target role.",
        encouragement: "Every interview is a learning opportunity. Keep practicing!",
        readinessLevel: accurateOverallScore >= 70 ? "Almost Ready" : "Not Ready",
      };
    }

    // Use the accurate calculated score
    const totalScore = accurateOverallScore;

    // Determine accurate rating based on score
    let accurateRating: string;
    if (totalScore >= 90) {
      accurateRating = "Excellent";
    } else if (totalScore >= 80) {
      accurateRating = "Very Good";
    } else if (totalScore >= 70) {
      accurateRating = "Good";
    } else if (totalScore >= 60) {
      accurateRating = "Above Average";
    } else if (totalScore >= 50) {
      accurateRating = "Average";
    } else if (totalScore >= 40) {
      accurateRating = "Below Average";
    } else {
      accurateRating = "Needs Improvement";
    }

    // Override rating with accurate calculation
    summaryData.rating = accurateRating;

    // Save summary to database
    await db.insert(interviewSummaries).values({
      interviewId: interviewData.id,
      overallScore: totalScore,
      rating: accurateRating,
      strengthsJson: JSON.stringify(summaryData.strengths || []),
      weaknessesJson: JSON.stringify(summaryData.weaknesses || []),
      recommendedTopicsJson: JSON.stringify(summaryData.recommendedTopics || []),
      actionPlan: summaryData.actionPlan,
      summaryText: summaryData.performanceSummary,
    });

    // Update interview as completed
    await db
      .update(interviews)
      .set({
        status: "completed",
        totalScore,
        completedAt: new Date(),
      })
      .where(eq(interviews.mockId, interviewId));

    return NextResponse.json({
      success: true,
      summary: summaryData,
    });
  } catch (error) {
    console.error("Generate summary error:", error);
    return NextResponse.json(
      { error: "Failed to generate summary" },
      { status: 500 }
    );
  }
}
