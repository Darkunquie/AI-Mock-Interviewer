import { NextRequest, NextResponse } from "next/server";
import { verifyEmailToken, generateToken, setAuthCookie } from "@/lib/auth";
import { verifyEmailSchema, validateRequest } from "@/lib/validations";
import { Errors, handleZodError, handleUnexpectedError } from "@/lib/errors";
import { logger } from "@/lib/logger";

/**
 * POST /api/auth/verify-email  { token }
 * Consumes an email-verification token, approves the account, and auto-logs in.
 */
export async function POST(request: NextRequest) {
  try {
    let body;
    try { body = await request.json(); } catch { return Errors.invalidJson(); }

    const validation = validateRequest(verifyEmailSchema, body);
    if (!validation.success) return handleZodError(validation.error);

    const user = await verifyEmailToken(validation.data.token);
    if (!user) return Errors.badRequest("This verification link is invalid or has expired.");

    // Auto-login on successful verification.
    await setAuthCookie(generateToken(user));
    logger.info("Email verified", { email: user.email });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    return handleUnexpectedError(error, "auth/verify-email");
  }
}
