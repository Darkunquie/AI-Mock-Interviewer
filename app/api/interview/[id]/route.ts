import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { interviews, answers, interviewSummaries } from "@/utils/schema";
import { getCurrentUser } from "@/lib/auth";

import { Errors, handleUnexpectedError } from "@/lib/errors";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return Errors.unauthorized();

    const { id: interviewId } = await params;

    // Get interview
    const interview = await db
      .select()
      .from(interviews)
      .where(eq(interviews.mockId, interviewId))
      .limit(1);

    if (!interview.length) return Errors.notFound("Interview");

    const interviewData = interview[0];
    // Verify user owns this interview
    if (interviewData.userId !== user.id) return Errors.forbidden();

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

    const questions = interviewData.questionsJson?.questions ?? [];

    return NextResponse.json({
      interview: { ...interviewData, questions },
      answers: interviewAnswers.map((a) => ({
        ...a,
        feedback: a.feedbackJson ?? null,
      })),
      summary: summary.length
        ? {
            ...summary[0],
            strengths: summary[0].strengthsJson ?? [],
            weaknesses: summary[0].weaknessesJson ?? [],
            recommendedTopics: summary[0].recommendedTopicsJson ?? [],
          }
        : null,
    });
  } catch (error) {
    return handleUnexpectedError(error, "interview/[id]");
  }
}
