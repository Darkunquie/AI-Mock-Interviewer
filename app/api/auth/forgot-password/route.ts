import { NextRequest, NextResponse } from "next/server";
import { createPasswordReset } from "@/lib/auth";
import { forgotPasswordSchema, validateRequest } from "@/lib/validations";
import { Errors, handleZodError, handleUnexpectedError } from "@/lib/errors";

/**
 * POST /api/auth/forgot-password  { email }
 * Sends a reset link if the email matches a user. Always returns the same
 * generic success so it can't be used to enumerate accounts.
 */
export async function POST(request: NextRequest) {
  try {
    let body;
    try { body = await request.json(); } catch { return Errors.invalidJson(); }

    const validation = validateRequest(forgotPasswordSchema, body);
    if (!validation.success) return handleZodError(validation.error);

    await createPasswordReset(validation.data.email);

    return NextResponse.json({
      success: true,
      message: "If an account exists for that email, a reset link is on its way.",
    });
  } catch (error) {
    return handleUnexpectedError(error, "auth/forgot-password");
  }
}
