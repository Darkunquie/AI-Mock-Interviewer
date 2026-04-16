// v1: POST /api/v1/interviews  (was /api/interview/create)
//      GET  /api/v1/interviews  (was /api/interview/history)
//
// Thin controllers — all business logic lives in lib/interviews/*.

import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { eq, desc, and, like, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { interviews } from "@/utils/schema";
import { CreateInterviewRequest, DURATION_CONFIG, Question } from "@/types";
import { getCurrentUser } from "@/lib/auth";
import { createInterviewSchema, validateRequest } from "@/lib/validations";
import { Errors, handleZodError, handleUnexpectedError } from "@/lib/errors";
import { generateQuestions, InvalidAiOutputError } from "@/lib/interviews";

interface TechDeepDiveConfig {
  technology: string;
  subtopics: string[];
  targetCompany?: string;
}

interface ExtendedCreateInterviewRequest extends CreateInterviewRequest {
  resumeText?: string;
  customQuestions?: Question[];
  techDeepDive?: TechDeepDiveConfig;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return Errors.unauthorized();

    let body: ExtendedCreateInterviewRequest;
    try {
      body = await request.json();
    } catch {
      return Errors.invalidJson();
    }

    const validation = validateRequest(createInterviewSchema, {
      role: body.role,
      experienceLevel: body.experienceLevel,
      interviewType: body.interviewType,
      mode: body.mode,
      duration: body.duration,
      techStack: body.techStack,
      topics: body.topics,
      resumeText: body.resumeText,
      customQuestions: body.customQuestions,
      techDeepDive: body.techDeepDive,
    });
    if (!validation.success) return handleZodError(validation.error);

    const {
      role,
      experienceLevel,
      interviewType,
      mode,
      duration,
      techStack,
      topics,
      customQuestions,
      techDeepDive,
    } = validation.data;

    const interviewDuration =
      duration && DURATION_CONFIG[duration] ? duration : "15";
    const questionCount = DURATION_CONFIG[interviewDuration].questionCount;
    const interviewMode = mode || "interview";

    let questions: Question[];
    if (customQuestions && customQuestions.length > 0) {
      questions = customQuestions;
    } else {
      try {
        const result = await generateQuestions({
          role,
          experience: experienceLevel,
          interviewType,
          questionCount,
          techStack: techStack && techStack.length > 0 ? techStack : undefined,
          mode: interviewMode,
          topics: topics && topics.length > 0 ? topics : undefined,
          techDeepDive: techDeepDive || undefined,
        });
        questions = result.questions;
      } catch (err) {
        if (err instanceof InvalidAiOutputError) return Errors.aiInvalidOutput();
        throw err;
      }
    }

    const interviewId = uuidv4();
    await db.insert(interviews).values({
      mockId: interviewId,
      userId: user.id,
      role,
      experienceLevel,
      interviewType,
      duration: interviewDuration,
      mode: interviewMode,
      techStack: techStack && techStack.length > 0 ? techStack : null,
      topics: topics && topics.length > 0 ? topics : null,
      status: "pending",
      questionsJson: { questions },
    });

    return NextResponse.json(
      {
        success: true,
        data: { interviewId, questions },
        meta: {
          requestId: request.headers.get("x-request-id") || undefined,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 201 },
    );
  } catch (error) {
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

    const conditions = [eq(interviews.userId, user.id)];
    if (status && status !== "all") conditions.push(eq(interviews.status, status as "pending" | "in_progress" | "completed"));
    if (role && role !== "all") conditions.push(eq(interviews.role, role));
    if (type && type !== "all") conditions.push(eq(interviews.interviewType, type as "technical" | "hr" | "behavioral"));
    if (search) conditions.push(like(interviews.role, `%${search.toLowerCase()}%`));

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
