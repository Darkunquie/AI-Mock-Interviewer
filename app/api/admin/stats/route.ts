import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/utils/schema";
import { eq, and, gt, lt, count } from "drizzle-orm";
import { Errors, handleUnexpectedError } from "@/lib/errors";

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) return Errors.forbidden();

    const [total] = await db.select({ count: count() }).from(users);
    const [pending] = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.status, "pending"));
    const [approved] = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.status, "approved"));
    const [rejected] = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.status, "rejected"));

    // Trial analytics
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const [activeTrial] = await db
      .select({ count: count() })
      .from(users)
      .where(
        and(
          eq(users.status, "approved"),
          eq(users.subscriptionStatus, "trial"),
          gt(users.trialEndsAt, now)
        )
      );

    const [expiredTrial] = await db
      .select({ count: count() })
      .from(users)
      .where(
        and(
          eq(users.status, "approved"),
          eq(users.subscriptionStatus, "expired")
        )
      );

    const [noTrial] = await db
      .select({ count: count() })
      .from(users)
      .where(
        and(
          eq(users.status, "approved"),
          eq(users.subscriptionStatus, "none")
        )
      );

    const [expiringSoon] = await db
      .select({ count: count() })
      .from(users)
      .where(
        and(
          eq(users.status, "approved"),
          eq(users.subscriptionStatus, "trial"),
          gt(users.trialEndsAt, now),
          lt(users.trialEndsAt, tomorrow)
        )
      );

    return NextResponse.json({
      success: true,
      stats: {
        total: total.count,
        pending: pending.count,
        approved: approved.count,
        rejected: rejected.count,
      },
      trialStats: {
        activeTrial: activeTrial.count,
        expiredTrial: expiredTrial.count,
        noTrial: noTrial.count,
        expiringWithin24h: expiringSoon.count,
      },
    });
  } catch (error) {
    return handleUnexpectedError(error, "admin/stats");
  }
}
