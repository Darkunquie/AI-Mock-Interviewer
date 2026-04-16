import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/utils/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { Errors, ErrorCodes, createErrorResponse, handleUnexpectedError } from "@/lib/errors";
import { invalidateSubscriptionCache } from "@/lib/subscription";

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
    if (!admin) return Errors.forbidden();

    const { id } = await params;
    const userId = Number.parseInt(id, 10);
    if (Number.isNaN(userId)) return Errors.badRequest("Invalid user ID");

    let body;
    try {
      body = await request.json();
    } catch {
      return Errors.invalidJson();
    }
    const parsed = extendTrialSchema.safeParse(body);
    if (!parsed.success) {
      return Errors.badRequest("Invalid trial duration. Must be 3, 6, or 14 days.");
    }

    const { trialDays } = parsed.data;

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) return Errors.userNotFound();

    if (user.status !== "approved") {
      return createErrorResponse(
        ErrorCodes.SUB_INVALID_STATE,
        "User must be approved before extending trial",
        400
      );
    }

    const now = new Date();
    const baseDate = user.trialEndsAt && new Date(user.trialEndsAt) > now ? new Date(user.trialEndsAt) : now;
    const trialEnd = new Date(baseDate.getTime() + trialDays * 24 * 60 * 60 * 1000);

    await db
      .update(users)
      .set({
        trialEndsAt: trialEnd,
        subscriptionStatus: "trial",
      })
      .where(eq(users.id, userId));

    await invalidateSubscriptionCache(userId);

    return NextResponse.json({
      success: true,
      message: `Trial extended by ${trialDays} days for ${user.email}`,
      trialEndsAt: trialEnd.toISOString(),
    });
  } catch (error) {
    return handleUnexpectedError(error, "admin/users/extend-trial");
  }
}
