import { NextRequest, NextResponse } from "next/server";
import { eq, desc, and, like } from "drizzle-orm";
import { db } from "@/lib/db";
import { interviews } from "@/utils/schema";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const role = searchParams.get("role");
    const type = searchParams.get("type");
    const search = searchParams.get("search");

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

    // Fetch interviews with filters
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
      .orderBy(desc(interviews.createdAt));

    // Calculate stats
    const allUserInterviews = await db
      .select({
        status: interviews.status,
        totalScore: interviews.totalScore,
      })
      .from(interviews)
      .where(eq(interviews.userId, user.id));

    const totalInterviews = allUserInterviews.length;
    const completedInterviews = allUserInterviews.filter(
      (i) => i.status === "completed"
    ).length;

    const completedWithScores = allUserInterviews.filter(
      (i) => i.status === "completed" && i.totalScore !== null
    );

    const averageScore =
      completedWithScores.length > 0
        ? Math.round(
            completedWithScores.reduce((sum, i) => sum + (i.totalScore || 0), 0) /
              completedWithScores.length
          )
        : 0;

    const bestScore =
      completedWithScores.length > 0
        ? Math.max(...completedWithScores.map((i) => i.totalScore || 0))
        : 0;

    return NextResponse.json({
      interviews: userInterviews,
      stats: {
        totalInterviews,
        completedInterviews,
        averageScore,
        bestScore,
      },
    });
  } catch (error) {
    console.error("History fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch history" },
      { status: 500 }
    );
  }
}
