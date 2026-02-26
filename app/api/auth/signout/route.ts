import { NextResponse } from "next/server";
import { signOut } from "@/lib/auth";
import { logger } from "@/lib/logger";

export async function POST() {
  try {
    await signOut();

    return NextResponse.json({
      success: true,
      message: "Signed out successfully",
    });
  } catch (error) {
    logger.error("Signout error", error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
