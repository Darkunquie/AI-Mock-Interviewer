// v1: POST /api/v1/interviews  (was /api/interview/create)
//      GET  /api/v1/interviews  (was /api/interview/history)
//
// Thin controllers — all business logic lives in lib/interviews/*.

import { NextRequest, NextResponse } from "next/server";
import { eq, desc, and, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { interviews } from "@/utils/schema";
import { getCurrentUser } from "@/lib/auth";
import { createInterviewSchema, validateRequest } from "@/lib/validations";
import { Errors, handleZodError, handleUnexpectedError } from "@/lib/errors";
import { createInterview, InvalidAiOutputError } from "@/lib/interviews";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return Errors.unauthorized();

    let body;
    try {
      body = await request.json();
    } catch {
      return Errors.invalidJson();
    }

    const validation = validateRequest(createInterviewSchema, body);
    if (!validation.success) return handleZodError(validation.error);

    const result = await createInterview(user.id, validation.data);

    return NextResponse.json(
      {
        success: true,
        data: { interviewId: result.interviewId, questions: result.questions },
        meta: {
          requestId: request.headers.get("x-request-id") || undefined,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof InvalidAiOutputError) return Errors.aiInvalidOutput();
    return handleUnexpectedError(error, "v1/interviews/create");
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return Errors.unauthorized();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const role = searchParams.get("role");
    const type = searchParams.get("type");
    const search = searchParams.get("search");

    const parsedPage = Number.parseInt(searchParams.get("page") || "1", 10);
    const page = Math.max(1, Number.isNaN(parsedPage) ? 1 : parsedPage);
    const parsedLimit = Number.parseInt(searchParams.get("limit") || "20", 10);
    const limit = Math.min(100, Math.max(1, Number.isNaN(parsedLimit) ? 20 : parsedLimit));
    const offset = (page - 1) * limit;

    const VALID_STATUSES = ["pending", "in_progress", "completed"] as const;
    const VALID_TYPES = ["technical", "hr", "behavioral"] as const;

    const conditions = [eq(interviews.userId, user.id)];
    if (status && status !== "all" && VALID_STATUSES.includes(status as typeof VALID_STATUSES[number])) {
      conditions.push(eq(interviews.status, status as typeof VALID_STATUSES[number]));
    }
    if (role && role !== "all") conditions.push(eq(interviews.role, role));
    if (type && type !== "all" && VALID_TYPES.includes(type as typeof VALID_TYPES[number])) {
      conditions.push(eq(interviews.interviewType, type as typeof VALID_TYPES[number]));
    }
    if (search) {
      const escapedSearch = search.replaceAll(/[%_\\]/g, String.raw`\$&`);
      conditions.push(sql`${interviews.role} ILIKE ${'%' + escapedSearch + '%'} ESCAPE '\\'`);
    }

    const [countResult] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(interviews)
      .where(and(...conditions));
    const total = countResult?.count || 0;

    const rows = await db
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

    // v1 emits interviewId only (no deprecated mockId alias)
    const items = rows.map((r) => ({
      interviewId: r.mockId,
      role: r.role,
      experienceLevel: r.experienceLevel,
      interviewType: r.interviewType,
      status: r.status,
      totalScore: r.totalScore,
      createdAt: r.createdAt,
    }));

    const [statsRow] = await db
      .select({
        totalInterviews: sql<number>`COUNT(*)::int`,
        completedInterviews: sql<number>`COUNT(*) FILTER (WHERE ${interviews.status} = 'completed')::int`,
        averageScore: sql<number>`COALESCE(ROUND(AVG(${interviews.totalScore}) FILTER (WHERE ${interviews.status} = 'completed' AND ${interviews.totalScore} IS NOT NULL)), 0)::int`,
        bestScore: sql<number>`COALESCE(MAX(${interviews.totalScore}) FILTER (WHERE ${interviews.status} = 'completed'), 0)::int`,
      })
      .from(interviews)
      .where(eq(interviews.userId, user.id));

    return NextResponse.json({
      success: true,
      data: {
        interviews: items,
        stats: {
          totalInterviews: statsRow?.totalInterviews ?? 0,
          completedInterviews: statsRow?.completedInterviews ?? 0,
          averageScore: statsRow?.averageScore ?? 0,
          bestScore: statsRow?.bestScore ?? 0,
        },
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      meta: {
        requestId: req.headers.get("x-request-id") || undefined,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    return handleUnexpectedError(error, "v1/interviews/list");
  }
}
