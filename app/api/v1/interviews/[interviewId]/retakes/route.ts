// v1: POST /api/v1/interviews/{interviewId}/retakes  (was /api/interview/retake)
// Creates a NEW interview row with same parameters as the source, fresh
// AI-generated questions. Returns the new interviewId.

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { Errors, handleUnexpectedError } from "@/lib/errors";
import {
  retakeInterview,
  getOwnedInterview,
  InvalidAiOutputError,
} from "@/lib/interviews";

export async function POST(
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

    const result = await retakeInterview(user.id, lookup.interview);

    return NextResponse.json(
      {
        success: true,
        data: { interviewId: result.interviewId, questions: result.questions },
        meta: {
          requestId: request.headers.get("x-request-id") || undefined,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof InvalidAiOutputError) return Errors.aiInvalidOutput();
    return handleUnexpectedError(error, "v1/interviews/retakes");
  }
}
