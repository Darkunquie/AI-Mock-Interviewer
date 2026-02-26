import { NextRequest, NextResponse } from "next/server";
import { signUp } from "@/lib/auth";
import { signUpSchema, validateRequest } from "@/lib/validations";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = validateRequest(signUpSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error.issues[0]?.message || "Invalid input",
          details: validation.error.issues.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    const { email, password, name, phone } = validation.data;

    const result = await signUp(email, password, name, phone);

    if (!result.success) {
      logger.warn("Signup failed", { email, reason: result.error });
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
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
    return NextResponse.json({
      success: true,
      user: result.user,
    });
  } catch (error) {
    logger.error("Signup error", error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
