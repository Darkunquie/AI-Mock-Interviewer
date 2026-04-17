import { NextRequest, NextResponse } from "next/server";
import { eq, and, desc, sql, gte, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { interviews, users } from "@/utils/schema";
import { getCurrentUser } from "@/lib/auth";
import { Errors, handleUnexpectedError } from "@/lib/errors";
import { cacheGet, cacheSet } from "@/lib/cache";
import {
  ROLE_DISPLAY_NAMES,
  InterviewRole,
} from "@/types";

interface LeaderboardEntry {
  rank: number;
  userId: number | null;
  name: string;
  imageUrl: string | null;
  averageScore: number;
  bestScore: number;
  totalInterviews: number;
  primaryRole: string;
}

interface CachedLeaderboard {
  leaderboard: LeaderboardEntry[];
  totalUsers: number;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return Errors.unauthorized();

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

    // Cache leaderboard for 5 min (user-independent data)
    const cacheKey = `lb:${role || "all"}:${period}`;
    let cached = await cacheGet<CachedLeaderboard>(cacheKey);

    if (!cached) {
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
      const userIds = results.map((r) => r.userId).filter((id): id is number => id !== null);
      const roleData: Record<number, string> = {};

      if (userIds.length > 0) {
        const roleCounts = await db
          .select({
            userId: sql<number>`${interviews.userId}`,
            role: interviews.role,
            count: sql<number>`COUNT(*)::int`,
          })
          .from(interviews)
          .where(
            and(
              eq(interviews.status, "completed"),
              inArray(sql<number>`${interviews.userId}`, userIds)
            )
          )
          .groupBy(interviews.userId, interviews.role);

        const userRoleCounts: Record<number, { role: string; count: number }> = {};
        roleCounts.forEach((rc) => {
          if (rc.userId === null) return;
          if (!userRoleCounts[rc.userId] || rc.count > userRoleCounts[rc.userId].count) {
            userRoleCounts[rc.userId] = { role: rc.role, count: rc.count };
          }
        });
        Object.entries(userRoleCounts).forEach(([uid, data]) => {
          roleData[Number(uid)] = ROLE_DISPLAY_NAMES[data.role as InterviewRole] || data.role;
        });
      }

      const leaderboard = results.map((r, index) => ({
        rank: index + 1,
        userId: r.userId,
        name: r.userName || "Anonymous",
        imageUrl: r.userImage,
        averageScore: Number(r.avgScore) || 0,
        bestScore: Number(r.bestScore) || 0,
        totalInterviews: Number(r.totalInterviews) || 0,
        primaryRole: (r.userId != null ? roleData[r.userId] : null) || "General",
      }));

      const [totalCountResult] = await db
        .select({ count: sql<number>`COUNT(DISTINCT ${interviews.userId})::int` })
        .from(interviews)
        .innerJoin(users, eq(interviews.userId, users.id))
        .where(and(...conditions));

      cached = {
        leaderboard,
        totalUsers: totalCountResult?.count ?? leaderboard.length,
      };
      await cacheSet(cacheKey, cached, 300); // 5 min
    }

    // Compute current user's rank against cached data
    const currentUserEntry = cached.leaderboard.find((l) => l.userId === user.id);
    let currentUserRank = currentUserEntry?.rank || null;

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

      if (userRankResult.length > 0 && userRankResult[0].avgScore != null) {
        const userAvg = Number(userRankResult[0].avgScore);

        const higherAvgUsers = db
          .select({ uid: interviews.userId })
          .from(interviews)
          .innerJoin(users, eq(interviews.userId, users.id))
          .where(and(...conditions))
          .groupBy(interviews.userId)
          .having(sql`ROUND(AVG(${interviews.totalScore})) > ${userAvg}`)
          .as("higher_avg_users");

        const [higherCountResult] = await db
          .select({ count: sql<number>`COUNT(*)::int` })
          .from(higherAvgUsers);

        currentUserRank = (higherCountResult?.count ?? 0) + 1;
      }
    }

    return NextResponse.json({
      leaderboard: cached.leaderboard,
      currentUserRank,
      currentUserId: user.id,
      totalUsers: cached.totalUsers,
    });
  } catch (error) {
    return handleUnexpectedError(error, "interview/leaderboard");
  }
}
