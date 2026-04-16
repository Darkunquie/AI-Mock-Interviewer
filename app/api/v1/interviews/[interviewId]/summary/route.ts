// v1: POST /api/v1/interviews/{interviewId}/summary  (was /api/interview/summary)

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  Errors,
  ErrorCodes,
  createErrorResponse,
  handleUnexpectedError,
} from "@/lib/errors";
import {
  generateSummary,
  getOwnedInterview,
  NoAnswersError,
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

    try {
      const summary = await generateSummary(lookup.interview);
      return NextResponse.json({
        success: true,
        data: { summary },
        meta: {
          requestId: request.headers.get("x-request-id") || undefined,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (err) {
      if (err instanceof NoAnswersError) {
        return createErrorResponse(ErrorCodes.IV_NO_ANSWERS, "No answers found", 400);
      }
      throw err;
    }
  } catch (error) {
    return handleUnexpectedError(error, "v1/interviews/summary");
  }
}
