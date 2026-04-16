import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/utils/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { Errors, ErrorCodes, createErrorResponse, handleUnexpectedError } from "@/lib/errors";
import { invalidateSubscriptionCache } from "@/lib/subscription";

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
    if (!admin) return Errors.forbidden();

    const { id } = await params;
    const userId = Number.parseInt(id, 10);
    if (Number.isNaN(userId)) return Errors.badRequest("Invalid user ID");

    // Parse body (may be empty for backward compat).
    let body: Record<string, unknown> = {};
    try {
      const text = await request.text();
      if (text.trim()) body = JSON.parse(text);
    } catch {
      return Errors.invalidJson();
    }

    const parsed = approveSchema.safeParse(body);
    if (!parsed.success) {
      return Errors.badRequest("Invalid trial duration. Must be 0, 3, 6, or 14 days.");
    }

    const { trialDays } = parsed.data;

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) return Errors.userNotFound();

    if (user.id === admin.id) {
      return createErrorResponse(
        ErrorCodes.ADMIN_SELF_MODIFY,
        "Cannot modify your own account",
        400
      );
    }

    if (user.status === "approved") {
      return createErrorResponse(
        ErrorCodes.ADMIN_ALREADY_APPROVED,
        "User is already approved",
        400
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

    await invalidateSubscriptionCache(userId);

    return NextResponse.json({
      success: true,
      message: trialDays > 0
        ? `User ${user.email} approved with ${trialDays}-day trial`
        : `User ${user.email} approved without trial`,
    });
  } catch (error) {
    return handleUnexpectedError(error, "admin/users/approve");
  }
}
