import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/utils/schema";
import { eq } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { z } from "zod";

const VALID_TRIAL_DAYS = [0, 3, 6, 14] as const;

const approveSchema = z.object({
  trialDays: z.number().refine((v) => VALID_TRIAL_DAYS.includes(v as typeof VALID_TRIAL_DAYS[number]), {
    message: "Trial duration must be 0, 3, 6, or 14 days",
  }).optional().default(3),
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
    const userId = parseInt(id, 10);

    if (isNaN(userId)) {
      return NextResponse.json(
        { success: false, error: "Invalid user ID" },
        { status: 400 }
      );
    }

    // Parse body (may be empty for backward compatibility)
    let body: Record<string, unknown> = {};
    try {
      body = await request.json();
    } catch {
      // No body sent — use defaults
    }

    const parsed = approveSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid trial duration. Must be 0, 3, 6, or 14 days." },
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

    if (user.id === admin.id) {
      return NextResponse.json(
        { success: false, error: "Cannot modify your own account" },
        { status: 400 }
      );
    }

    if (user.status === "approved") {
      return NextResponse.json(
        { success: false, error: "User is already approved" },
        { status: 400 }
      );
    }

    const now = new Date();

    if (trialDays > 0) {
      const trialEnd = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);
      await db
        .update(users)
        .set({
          status: "approved",
          approvedAt: now,
          trialEndsAt: trialEnd,
          subscriptionStatus: "trial",
        })
        .where(eq(users.id, userId));
    } else {
      await db
        .update(users)
        .set({
          status: "approved",
          approvedAt: now,
          trialEndsAt: null,
          subscriptionStatus: "none",
        })
        .where(eq(users.id, userId));
    }

    return NextResponse.json({
      success: true,
      message: trialDays > 0
        ? `User ${user.email} approved with ${trialDays}-day trial`
        : `User ${user.email} approved without trial`,
    });
  } catch (error) {
    logger.error("Admin approve error", error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
