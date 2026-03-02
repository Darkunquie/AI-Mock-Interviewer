import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/utils/schema";
import { eq } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { z } from "zod";

const VALID_TRIAL_DAYS = [3, 6, 14] as const;

const extendTrialSchema = z.object({
  trialDays: z.number().refine((v) => VALID_TRIAL_DAYS.includes(v as typeof VALID_TRIAL_DAYS[number]), {
    message: "Trial duration must be 3, 6, or 14 days",
  }),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const userId = Number.parseInt(id, 10);

    if (Number.isNaN(userId)) {
      return NextResponse.json(
        { success: false, error: "Invalid user ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const parsed = extendTrialSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid trial duration. Must be 3, 6, or 14 days." },
        { status: 400 }
      );
    }

    const { trialDays } = parsed.data;

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    if (user.status !== "approved") {
      return NextResponse.json(
        { success: false, error: "User must be approved before extending trial" },
        { status: 400 }
      );
    }

    const now = new Date();
    const trialEnd = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);

    await db
      .update(users)
      .set({
        trialEndsAt: trialEnd,
        subscriptionStatus: "trial",
      })
      .where(eq(users.id, userId));

    return NextResponse.json({
      success: true,
      message: `Trial extended by ${trialDays} days for ${user.email}`,
      trialEndsAt: trialEnd.toISOString(),
    });
  } catch (error) {
    logger.error("Admin extend trial error", error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
