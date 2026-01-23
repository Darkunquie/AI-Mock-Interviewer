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

    // Prepare answers for summary generation
    const answersData = interviewAnswers.map((a) => ({
      question: a.questionText,
      answer: a.userAnswer || "",
      technicalScore: a.technicalScore || 0,
      communicationScore: a.communicationScore || 0,
      depthScore: a.depthScore || 0,
    }));

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
    } catch (aiError) {
      console.error("AI summary error:", aiError);

      // Calculate average scores
      const avgTechnical = answersData.reduce((sum, a) => sum + a.technicalScore, 0) / answersData.length;
      const avgCommunication = answersData.reduce((sum, a) => sum + a.communicationScore, 0) / answersData.length;
      const avgDepth = answersData.reduce((sum, a) => sum + a.depthScore, 0) / answersData.length;
      const overallScore = Math.round((avgTechnical * 0.4 + avgCommunication * 0.3 + avgDepth * 0.3) * 10);

      // Fallback summary
      summaryData = {
        overallScore,
        rating: overallScore >= 70 ? "Good" : overallScore >= 50 ? "Average" : "Needs Improvement",
        performanceSummary: "You completed the interview. Review your answers to identify areas for improvement.",
        strengths: ["Completed all questions", "Showed willingness to answer"],
        weaknesses: ["Review technical concepts", "Practice providing more detailed answers"],
        recommendedTopics: ["Interview preparation", "Technical fundamentals", "Communication skills"],
        actionPlan: "Practice more mock interviews and review common questions for your target role.",
        encouragement: "Every interview is a learning opportunity. Keep practicing!",
        readinessLevel: overallScore >= 70 ? "Almost Ready" : "Not Ready",
      };
    }

    // Calculate final score
    const totalScore = summaryData.overallScore ||
      Math.round(answersData.reduce((sum, a) =>
        sum + (a.technicalScore * 0.4 + a.communicationScore * 0.3 + a.depthScore * 0.3), 0
      ) / answersData.length * 10);

    // Save summary to database
    await db.insert(interviewSummaries).values({
      interviewId: interviewData.id,
      overallScore: totalScore,
      rating: summaryData.rating,
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
