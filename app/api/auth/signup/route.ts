import { NextRequest, NextResponse } from "next/server";
import { signUp } from "@/lib/auth";
import { signUpSchema, validateRequest } from "@/lib/validations";
import { logger } from "@/lib/logger";
import { Errors, handleZodError, handleUnexpectedError } from "@/lib/errors";

export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return Errors.badRequest("Invalid JSON body");
    }
    const validation = validateRequest(signUpSchema, body);
    if (!validation.success) return handleZodError(validation.error);

    const { email, password, name, phone } = validation.data;
    const result = await signUp(email, password, name, phone);

    if (!result.success) {
      logger.warn("Signup failed", { email, reason: result.error });
      if (result.code === "EMAIL_EXISTS") {
        // SECURITY NOTE: returning 409 reveals whether an email is registered (user enumeration).
        // Accepted trade-off for this app — UX clarity outweighs the disclosure risk.
        // If hardening is needed, return 200 with a generic "check your email" response instead.
        return Errors.emailExists();
      }
      return Errors.badRequest(result.error || "Failed to create account");
    }

    if (result.pending) {
      logger.info("New user signup (pending)", { email });
      return NextResponse.json({
        success: true,
        pending: true,
        message: "Account created. Awaiting admin approval.",
      });
    }

    logger.info("New user signup (auto-approved)", { email });
    return NextResponse.json({ success: true, user: result.user });
  } catch (error) {
    return handleUnexpectedError(error, "auth/signup");
  }
}
