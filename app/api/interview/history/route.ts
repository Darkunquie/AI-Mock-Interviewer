import { NextRequest, NextResponse } from "next/server";
import { eq, desc, and, like, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { interviews } from "@/utils/schema";
import { getCurrentUser } from "@/lib/auth";
import { Errors, handleUnexpectedError } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return Errors.unauthorized();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const role = searchParams.get("role");
    const type = searchParams.get("type");
    const search = searchParams.get("search");

    // Pagination
    const parsedPage = Number.parseInt(searchParams.get("page") || "1", 10);
    const page = Math.max(1, Number.isNaN(parsedPage) ? 1 : parsedPage);
    const parsedLimit = Number.parseInt(searchParams.get("limit") || "20", 10);
    const limit = Math.min(100, Math.max(1, Number.isNaN(parsedLimit) ? 20 : parsedLimit));
    const offset = (page - 1) * limit;

    // Build conditions
    const conditions = [eq(interviews.userId, user.id)];

    if (status && status !== "all") {
      conditions.push(eq(interviews.status, status));
    }

    if (role && role !== "all") {
      conditions.push(eq(interviews.role, role));
    }

    if (type && type !== "all") {
      conditions.push(eq(interviews.interviewType, type));
    }

    if (search) {
      conditions.push(like(interviews.role, `%${search.toLowerCase()}%`));
    }

    // Get total count for pagination
    const [countResult] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(interviews)
      .where(and(...conditions));
    const total = countResult?.count || 0;

    // Fetch interviews with filters + pagination
    const userInterviews = await db
      .select({
        mockId: interviews.mockId,
        role: interviews.role,
        experienceLevel: interviews.experienceLevel,
        interviewType: interviews.interviewType,
        status: interviews.status,
        totalScore: interviews.totalScore,
        createdAt: interviews.createdAt,
      })
      .from(interviews)
      .where(and(...conditions))
      .orderBy(desc(interviews.createdAt))
      .limit(limit)
      .offset(offset);

    // Stats aggregate: single query instead of pulling every row into Node.
    // Was: fetch all user interviews -> filter/reduce in JS (O(n) memory per req).
    const [statsRow] = await db
      .select({
        totalInterviews: sql<number>`COUNT(*)::int`,
        completedInterviews: sql<number>`COUNT(*) FILTER (WHERE ${interviews.status} = 'completed')::int`,
        averageScore: sql<number>`COALESCE(ROUND(AVG(${interviews.totalScore}) FILTER (WHERE ${interviews.status} = 'completed' AND ${interviews.totalScore} IS NOT NULL)), 0)::int`,
        bestScore: sql<number>`COALESCE(MAX(${interviews.totalScore}) FILTER (WHERE ${interviews.status} = 'completed'), 0)::int`,
      })
      .from(interviews)
      .where(eq(interviews.userId, user.id));

    const totalInterviews = statsRow?.totalInterviews ?? 0;
    const completedInterviews = statsRow?.completedInterviews ?? 0;
    const averageScore = statsRow?.averageScore ?? 0;
    const bestScore = statsRow?.bestScore ?? 0;

    return NextResponse.json({
      success: true,
      interviews: userInterviews,
      stats: {
        totalInterviews,
        completedInterviews,
        averageScore,
        bestScore,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return handleUnexpectedError(error, "interview/history");
  }
}
