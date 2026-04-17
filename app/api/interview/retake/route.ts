import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { retakeInterviewSchema, validateRequest } from "@/lib/validations";
import { Errors, handleZodError, handleUnexpectedError } from "@/lib/errors";
import { retakeInterview, getOwnedInterview, InvalidAiOutputError } from "@/lib/interviews";
import { deprecated } from "@/lib/v0-deprecation";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return Errors.unauthorized();

    let body;
    try { body = await request.json(); } catch { return Errors.invalidJson(); }

    const validation = validateRequest(retakeInterviewSchema, body);
    if (!validation.success) return handleZodError(validation.error);

    const { interviewId } = validation.data;
    const lookup = await getOwnedInterview(interviewId, user.id);
    if (!lookup.ok) return lookup.reason === "not_found" ? Errors.notFound("Interview") : Errors.forbidden();

    const result = await retakeInterview(user.id, lookup.interview);
    return deprecated(
      NextResponse.json({ success: true, interviewId: result.interviewId, questions: result.questions }),
      `/api/v1/interviews/${interviewId}/retakes`,
    );
  } catch (error) {
    if (error instanceof InvalidAiOutputError) return Errors.aiInvalidOutput();
    return handleUnexpectedError(error, "interview/retake");
  }
}
