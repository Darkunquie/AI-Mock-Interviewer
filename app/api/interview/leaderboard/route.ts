import { NextRequest, NextResponse } from "next/server";
import { eq, and, desc, sql, gte } from "drizzle-orm";
import { db } from "@/lib/db";
import { interviews, users } from "@/utils/schema";
import { getCurrentUser } from "@/lib/auth";
import {
  ROLE_DISPLAY_NAMES,
  InterviewRole,
} from "@/types";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");
    const period = searchParams.get("period") || "all";

    // Build time filter
    let timeFilter = undefined;
    if (period === "week") {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      timeFilter = gte(interviews.completedAt, weekAgo);
    } else if (period === "month") {
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);
      timeFilter = gte(interviews.completedAt, monthAgo);
    }

    // Build where conditions
    const conditions = [
      eq(interviews.status, "completed"),
      eq(users.status, "approved"),
    ];
    if (timeFilter) conditions.push(timeFilter);
    if (role) conditions.push(eq(interviews.role, role));

    // Get leaderboard data
    const results = await db
      .select({
        userId: interviews.userId,
        userName: users.name,
        userImage: users.imageUrl,
        avgScore: sql<number>`ROUND(AVG(${interviews.totalScore}))`,
        bestScore: sql<number>`MAX(${interviews.totalScore})`,
        totalInterviews: sql<number>`COUNT(*)::int`,
      })
      .from(interviews)
      .innerJoin(users, eq(interviews.userId, users.id))
      .where(and(...conditions))
      .groupBy(interviews.userId, users.id, users.name, users.imageUrl)
      .orderBy(desc(sql`AVG(${interviews.totalScore})`))
      .limit(50);

    // Get primary role for each user (most frequent role)
    const userIds = results.map((r) => r.userId);
    const roleData: Record<number, string> = {};

    if (userIds.length > 0) {
      const roleCounts = await db
        .select({
          userId: interviews.userId,
          role: interviews.role,
          count: sql<number>`COUNT(*)::int`,
        })
        .from(interviews)
        .where(
          and(
            eq(interviews.status, "completed"),
            sql`${interviews.userId} = ANY(ARRAY[${sql.raw(userIds.join(","))}])`
          )
        )
        .groupBy(interviews.userId, interviews.role);

      // Find most frequent role per user
      const userRoleCounts: Record<number, { role: string; count: number }> = {};
      roleCounts.forEach((rc) => {
        if (!userRoleCounts[rc.userId] || rc.count > userRoleCounts[rc.userId].count) {
          userRoleCounts[rc.userId] = { role: rc.role, count: rc.count };
        }
      });
      Object.entries(userRoleCounts).forEach(([uid, data]) => {
        roleData[Number(uid)] = ROLE_DISPLAY_NAMES[data.role as InterviewRole] || data.role;
      });
    }

    // Build leaderboard with ranks
    const leaderboard = results.map((r, index) => ({
      rank: index + 1,
      userId: r.userId,
      name: r.userName || "Anonymous",
      imageUrl: r.userImage,
      averageScore: Number(r.avgScore) || 0,
      bestScore: Number(r.bestScore) || 0,
      totalInterviews: Number(r.totalInterviews) || 0,
      primaryRole: roleData[r.userId] || "General",
    }));

    // Find current user's rank
    const currentUserEntry = leaderboard.find((l) => l.userId === user.id);
    let currentUserRank = currentUserEntry?.rank || null;

    // If user not in top 50, check their actual rank
    if (!currentUserRank) {
      const userRankResult = await db
        .select({
          avgScore: sql<number>`ROUND(AVG(${interviews.totalScore}))`,
        })
        .from(interviews)
        .where(
          and(
            eq(interviews.userId, user.id),
            eq(interviews.status, "completed"),
            ...(timeFilter ? [timeFilter] : []),
            ...(role ? [eq(interviews.role, role)] : []),
          )
        );

      if (userRankResult.length > 0 && userRankResult[0].avgScore) {
        const userAvg = Number(userRankResult[0].avgScore);
        // Count users with higher average
        const higherCount = leaderboard.filter((l) => l.averageScore > userAvg).length;
        currentUserRank = higherCount + 1;
      }
    }

    return NextResponse.json({
      leaderboard,
      currentUserRank,
      currentUserId: user.id,
      totalUsers: leaderboard.length,
    });
  } catch (error) {
    console.error("Leaderboard fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}
