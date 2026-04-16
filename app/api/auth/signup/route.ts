import { NextRequest, NextResponse } from "next/server";
import { signUp } from "@/lib/auth";
import { signUpSchema, validateRequest } from "@/lib/validations";
import { logger } from "@/lib/logger";
import { Errors, handleZodError, handleUnexpectedError } from "@/lib/errors";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = validateRequest(signUpSchema, body);
    if (!validation.success) return handleZodError(validation.error);

    const { email, password, name, phone } = validation.data;
    const result = await signUp(email, password, name, phone);

    if (!result.success) {
      logger.warn("Signup failed", { email, reason: result.error });
      // Most common cause = email already registered → 409
      if (result.error?.toLowerCase().includes("already registered")) {
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
