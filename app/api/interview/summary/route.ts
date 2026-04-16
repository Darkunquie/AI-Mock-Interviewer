import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { interviewSummarySchema, validateRequest } from "@/lib/validations";
import {
  Errors,
  ErrorCodes,
  createErrorResponse,
  handleZodError,
  handleUnexpectedError,
} from "@/lib/errors";
import {
  generateSummary,
  getOwnedInterview,
  NoAnswersError,
} from "@/lib/interviews";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return Errors.unauthorized();

    let body;
    try {
      body = await request.json();
    } catch {
      return Errors.invalidJson();
    }

    const validation = validateRequest(interviewSummarySchema, {
      mockId: body.interviewId,
    });
    if (!validation.success) return handleZodError(validation.error);

    const interviewId = validation.data.mockId;

    const lookup = await getOwnedInterview(interviewId, user.id);
    if (!lookup.ok) {
      return lookup.reason === "not_found"
        ? Errors.notFound("Interview")
        : Errors.forbidden();
    }

    try {
      const summary = await generateSummary(lookup.interview);
      return NextResponse.json({ success: true, summary });
    } catch (err) {
      if (err instanceof NoAnswersError) {
        return createErrorResponse(ErrorCodes.IV_NO_ANSWERS, "No answers found", 400);
      }
      throw err;
    }
  } catch (error) {
    return handleUnexpectedError(error, "interview/summary");
  }
}
