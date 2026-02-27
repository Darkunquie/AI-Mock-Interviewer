import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getSubscriptionDetails } from "@/lib/subscription";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const details = await getSubscriptionDetails(user.id);

    if (!details) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      ...details,
    });
  } catch (error) {
    logger.error(
      "Subscription status error",
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
