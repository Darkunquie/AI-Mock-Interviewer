import { NextRequest, NextResponse } from "next/server";
import { signIn } from "@/lib/auth";
import { signInSchema, validateRequest } from "@/lib/validations";
import { logger } from "@/lib/logger";
import { handleZodError, handleUnexpectedError, createErrorResponse, ErrorCodes } from "@/lib/errors";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = validateRequest(signInSchema, body);
    if (!validation.success) return handleZodError(validation.error);

    const { email, password } = validation.data;
    const result = await signIn(email, password);

    if (!result.success) {
      logger.warn("Signin failed", { email, reason: result.error });
      // Preserve `pending` at top level for v0 client redirect logic.
      const res = createErrorResponse(
        result.pending
          ? ErrorCodes.AUTH_PENDING_APPROVAL
          : ErrorCodes.AUTH_INVALID_CREDENTIALS,
        result.error || "Invalid email or password",
        result.pending ? 403 : 401
      );
      // Attach top-level `pending` for backwards compat
      const body = await res.json();
      return NextResponse.json(
        { ...body, pending: result.pending || false },
        { status: res.status }
      );
    }

    logger.info("User signed in", { email });
    return NextResponse.json({
      success: true,
      user: result.user,
    });
  } catch (error) {
    return handleUnexpectedError(error, "auth/signin");
  }
}
