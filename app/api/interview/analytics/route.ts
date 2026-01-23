import { NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { interviews, answers } from "@/utils/schema";
import { getCurrentUser } from "@/lib/auth";
import { format } from "date-fns";
import {
  ROLE_DISPLAY_NAMES,
  INTERVIEW_TYPE_DISPLAY_NAMES,
  InterviewRole,
  InterviewType,
} from "@/types";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all completed interviews with scores
    const userInterviews = await db
      .select({
        id: interviews.id,
        mockId: interviews.mockId,
        role: interviews.role,
        interviewType: interviews.interviewType,
        status: interviews.status,
        totalScore: interviews.totalScore,
        createdAt: interviews.createdAt,
      })
      .from(interviews)
      .where(eq(interviews.userId, user.id))
      .orderBy(desc(interviews.createdAt));

    const completedInterviews = userInterviews.filter(
      (i) => i.status === "completed" && i.totalScore !== null
    );

    if (completedInterviews.length === 0) {
      return NextResponse.json(null);
    }

    // Calculate overview stats
    const totalInterviews = userInterviews.length;
    const completedCount = completedInterviews.length;
    const scores = completedInterviews.map((i) => i.totalScore || 0);
    const averageScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const bestScore = Math.max(...scores);
    const worstScore = Math.min(...scores);

    // Calculate improvement rate (compare last 3 vs first 3)
    let improvementRate = 0;
    if (completedInterviews.length >= 3) {
      const recent = completedInterviews.slice(0, 3);
      const older = completedInterviews.slice(-3);
      const recentAvg = recent.reduce((sum, i) => sum + (i.totalScore || 0), 0) / recent.length;
      const olderAvg = older.reduce((sum, i) => sum + (i.totalScore || 0), 0) / older.length;
      improvementRate = Math.round(recentAvg - olderAvg);
    }

    // Score history (last 10 interviews)
    const scoreHistory = completedInterviews.slice(0, 10).reverse().map((i) => ({
      date: format(new Date(i.createdAt!), "MMM d"),
      score: i.totalScore || 0,
      role: ROLE_DISPLAY_NAMES[i.role as InterviewRole] || i.role,
    }));

    // Score by role
    const roleScores: Record<string, { total: number; count: number }> = {};
    completedInterviews.forEach((i) => {
      const role = ROLE_DISPLAY_NAMES[i.role as InterviewRole] || i.role;
      if (!roleScores[role]) {
        roleScores[role] = { total: 0, count: 0 };
      }
      roleScores[role].total += i.totalScore || 0;
      roleScores[role].count++;
    });

    const scoreByRole = Object.entries(roleScores).map(([role, data]) => ({
      role,
      avgScore: Math.round(data.total / data.count),
      count: data.count,
    }));

    // Score by type
    const typeScores: Record<string, { total: number; count: number }> = {};
    completedInterviews.forEach((i) => {
      const type = INTERVIEW_TYPE_DISPLAY_NAMES[i.interviewType as InterviewType] || i.interviewType;
      if (!typeScores[type]) {
        typeScores[type] = { total: 0, count: 0 };
      }
      typeScores[type].total += i.totalScore || 0;
      typeScores[type].count++;
    });

    const scoreByType = Object.entries(typeScores).map(([type, data]) => ({
      type,
      avgScore: Math.round(data.total / data.count),
      count: data.count,
    }));

    // Skill breakdown - fetch answers for all completed interviews
    const interviewIds = completedInterviews.map((i) => i.id);
    let skillBreakdown = { technical: 0, communication: 0, depth: 0 };

    if (interviewIds.length > 0) {
      // Get average from recent interviews
      let techTotal = 0, commTotal = 0, depthTotal = 0, answerCount = 0;

      for (const intId of interviewIds.slice(0, 5)) {
        const intAnswers = await db
          .select({
            technicalScore: answers.technicalScore,
            communicationScore: answers.communicationScore,
            depthScore: answers.depthScore,
          })
          .from(answers)
          .where(eq(answers.interviewId, intId));

        intAnswers.forEach((a) => {
          if (a.technicalScore) techTotal += a.technicalScore;
          if (a.communicationScore) commTotal += a.communicationScore;
          if (a.depthScore) depthTotal += a.depthScore;
          answerCount++;
        });
      }

      if (answerCount > 0) {
        skillBreakdown = {
          technical: Math.round(techTotal / answerCount),
          communication: Math.round(commTotal / answerCount),
          depth: Math.round(depthTotal / answerCount),
        };
      }
    }

    // Determine trend
    let recentTrend: "improving" | "declining" | "stable" = "stable";
    if (improvementRate > 5) recentTrend = "improving";
    else if (improvementRate < -5) recentTrend = "declining";

    return NextResponse.json({
      overview: {
        totalInterviews,
        completedInterviews: completedCount,
        averageScore,
        bestScore,
        worstScore,
        improvementRate,
      },
      scoreHistory,
      scoreByRole,
      scoreByType,
      skillBreakdown,
      recentTrend,
    });
  } catch (error) {
    console.error("Analytics fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
