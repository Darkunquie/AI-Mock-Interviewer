import { NextResponse } from "next/server";
import { requireAdmin, invalidateUserStatusCache } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/utils/schema";
import { eq, ne, and } from "drizzle-orm";
import { Errors, ErrorCodes, createErrorResponse, handleUnexpectedError } from "@/lib/errors";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    if (!admin) return Errors.forbidden();

    const { id } = await params;
    const userId = Number.parseInt(id, 10);
    if (Number.isNaN(userId)) return Errors.badRequest("Invalid user ID");

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

    const result = await db
      .update(users)
      .set({ status: "approved" as const, approvedAt: new Date() })
      .where(and(eq(users.id, userId), ne(users.status, "approved")))
      .returning({ id: users.id });

    await invalidateUserStatusCache(userId);

    if (result.length === 0) {
      return createErrorResponse(
        ErrorCodes.ADMIN_ALREADY_APPROVED,
        "User is already approved",
        400
      );
    }

    return NextResponse.json({
      success: true,
      message: `User ${user.email} approved`,
    });
  } catch (error) {
    return handleUnexpectedError(error, "admin/users/approve");
  }
}
