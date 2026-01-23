import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { interviews, answers, interviewSummaries } from "@/utils/schema";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: interviewId } = await params;

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

    // Verify user owns this interview
    if (interviewData.userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get answers for this interview
    const interviewAnswers = await db
      .select()
      .from(answers)
      .where(eq(answers.interviewId, interviewData.id))
      .orderBy(answers.questionIndex);

    // Get summary if exists
    const summary = await db
      .select()
      .from(interviewSummaries)
      .where(eq(interviewSummaries.interviewId, interviewData.id))
      .limit(1);

    // Parse questions JSON
    let questions = [];
    try {
      const parsed = JSON.parse(interviewData.questionsJson || "{}");
      questions = parsed.questions || [];
    } catch (e) {
      console.error("Error parsing questions:", e);
    }

    return NextResponse.json({
      interview: {
        ...interviewData,
        questions,
      },
      answers: interviewAnswers.map((a) => ({
        ...a,
        feedback: a.feedbackJson ? JSON.parse(a.feedbackJson) : null,
      })),
      summary: summary.length
        ? {
            ...summary[0],
            strengths: summary[0].strengthsJson
              ? JSON.parse(summary[0].strengthsJson)
              : [],
            weaknesses: summary[0].weaknessesJson
              ? JSON.parse(summary[0].weaknessesJson)
              : [],
            recommendedTopics: summary[0].recommendedTopicsJson
              ? JSON.parse(summary[0].recommendedTopicsJson)
              : [],
          }
        : null,
    });
  } catch (error) {
    console.error("Get interview error:", error);
    return NextResponse.json(
      { error: "Failed to get interview" },
      { status: 500 }
    );
  }
}
