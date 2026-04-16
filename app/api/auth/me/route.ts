import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { Errors, handleUnexpectedError } from "@/lib/errors";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return Errors.unauthorized();
    // Keep top-level `user` for v0 client compat. v1 wraps in `data`.
    return NextResponse.json({ success: true, user });
  } catch (error) {
    return handleUnexpectedError(error, "auth/me");
  }
}
