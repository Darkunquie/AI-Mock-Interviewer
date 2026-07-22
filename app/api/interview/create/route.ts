import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createInterviewSchema, validateRequest } from "@/lib/validations";
import { Errors, handleZodError, handleUnexpectedError } from "@/lib/errors";
import { createInterview, InvalidAiOutputError } from "@/lib/interviews";
import { deprecated } from "@/lib/v0-deprecation";
import { checkAiQuota } from "@/lib/quota";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return Errors.unauthorized();

    const quota = await checkAiQuota(user.id);
    if (!quota.allowed) {
      return Errors.quotaExceeded(quota.disabled ? "AI features are temporarily disabled." : undefined);
    }

    let body;
    try { body = await request.json(); } catch { return Errors.invalidJson(); }

    const validation = validateRequest(createInterviewSchema, body);
    if (!validation.success) return handleZodError(validation.error);

    const result = await createInterview(user.id, validation.data);
    return deprecated(
      NextResponse.json({ success: true, interviewId: result.interviewId, questions: result.questions }),
      "/api/v1/interviews",
    );
  } catch (error) {
    if (error instanceof InvalidAiOutputError) return Errors.aiInvalidOutput();
    return handleUnexpectedError(error, "interview/create");
  }
}
