import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/utils/schema";
import { eq, count } from "drizzle-orm";
import { Errors, handleUnexpectedError } from "@/lib/errors";

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) return Errors.forbidden();

    const [total] = await db.select({ count: count() }).from(users);
    const [pending] = await db.select({ count: count() }).from(users).where(eq(users.status, "pending"));
    const [approved] = await db.select({ count: count() }).from(users).where(eq(users.status, "approved"));
    const [rejected] = await db.select({ count: count() }).from(users).where(eq(users.status, "rejected"));

    return NextResponse.json({
      success: true,
      stats: {
        total: total.count,
        pending: pending.count,
        approved: approved.count,
        rejected: rejected.count,
      },
    });
  } catch (error) {
    return handleUnexpectedError(error, "admin/stats");
  }
}
