// v1: GET /api/v1/interviews/{interviewId}  (was /api/interview/[id])

import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { interviews, answers, interviewSummaries } from "@/utils/schema";
import { getCurrentUser } from "@/lib/auth";
import { Errors, handleUnexpectedError } from "@/lib/errors";
import { getOwnedInterview, parseStoredQuestions } from "@/lib/interviews";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ interviewId: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) return Errors.unauthorized();

    const { interviewId } = await params;
    const lookup = await getOwnedInterview(interviewId, user.id);
    if (!lookup.ok) {
      return lookup.reason === "not_found"
        ? Errors.notFound("Interview")
        : Errors.forbidden();
    }
    const interview = lookup.interview;

    const [interviewAnswers, summaryRows] = await Promise.all([
      db
        .select()
        .from(answers)
        .where(eq(answers.interviewId, interview.id))
        .orderBy(answers.questionIndex),
      db
        .select()
        .from(interviewSummaries)
        .where(eq(interviewSummaries.interviewId, interview.id))
        .limit(1),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        interviewId: interview.mockId,
        role: interview.role,
        experienceLevel: interview.experienceLevel,
        interviewType: interview.interviewType,
        duration: interview.duration,
        mode: interview.mode,
        status: interview.status,
        totalScore: interview.totalScore,
        createdAt: interview.createdAt,
        completedAt: interview.completedAt,
        questions: parseStoredQuestions(interview.questionsJson),
        answers: interviewAnswers,
        summary: summaryRows[0] ?? null,
      },
      meta: {
        requestId: request.headers.get("x-request-id") || undefined,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    return handleUnexpectedError(error, "v1/interviews/get");
  }
}
