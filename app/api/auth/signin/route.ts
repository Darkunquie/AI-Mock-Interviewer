import { NextRequest, NextResponse } from "next/server";
import { signIn } from "@/lib/auth";
import { signInSchema, validateRequest } from "@/lib/validations";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = validateRequest(signInSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error.issues[0]?.message || "Invalid input",
        },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;

    const result = await signIn(email, password);

    if (!result.success) {
      logger.warn("Signin failed", { email, reason: result.error });
      return NextResponse.json(
        { success: false, error: result.error, pending: result.pending || false },
        { status: 401 }
      );
    }

    logger.info("User signed in", { email });
    return NextResponse.json({
      success: true,
      user: result.user,
    });
  } catch (error) {
    logger.error("Signin error", error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
