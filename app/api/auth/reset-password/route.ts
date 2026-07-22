import { NextRequest, NextResponse } from "next/server";
import { resetPassword } from "@/lib/auth";
import { resetPasswordSchema, validateRequest } from "@/lib/validations";
import { Errors, handleZodError, handleUnexpectedError } from "@/lib/errors";
import { logger } from "@/lib/logger";

/**
 * POST /api/auth/reset-password  { token, password }
 * Consumes a reset token and sets a new password.
 */
export async function POST(request: NextRequest) {
  try {
    let body;
    try { body = await request.json(); } catch { return Errors.invalidJson(); }

    const validation = validateRequest(resetPasswordSchema, body);
    if (!validation.success) return handleZodError(validation.error);

    const ok = await resetPassword(validation.data.token, validation.data.password);
    if (!ok) return Errors.badRequest("This reset link is invalid or has expired.");

    logger.info("Password reset completed");
    return NextResponse.json({ success: true, message: "Password updated. You can now sign in." });
  } catch (error) {
    return handleUnexpectedError(error, "auth/reset-password");
  }
}
