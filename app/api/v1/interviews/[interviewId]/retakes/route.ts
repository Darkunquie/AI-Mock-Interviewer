// v1: POST /api/v1/interviews/{interviewId}/retakes  (was /api/interview/retake)
// Creates a NEW interview row with same parameters as the source, fresh
// AI-generated questions. Returns the new interviewId.

import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { db } from "@/lib/db";
import { interviews } from "@/utils/schema";
import { DURATION_CONFIG, InterviewDuration } from "@/types";
import { getCurrentUser } from "@/lib/auth";
import { Errors, handleUnexpectedError } from "@/lib/errors";
import {
  generateQuestions,
  getOwnedInterview,
  parseStringArray,
  InvalidAiOutputError,
} from "@/lib/interviews";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ interviewId: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) return Errors.unauthorized();

    const { interviewId } = await params;

    const lookup = await getOwnedInterview(interviewId, user.id);
    if (!lookup.ok) {
      return lookup.reason === "not_found"
        ? Errors.notFound("Interview")
        : Errors.forbidden();
    }
    const original = lookup.interview;

    const duration = (original.duration || "15") as InterviewDuration;
    const mode = original.mode || "interview";
    const techStack = parseStringArray(original.techStack);
    const topics = parseStringArray(original.topics);
    const questionCount = DURATION_CONFIG[duration]?.questionCount || 10;

    let questions;
    try {
      const result = await generateQuestions({
        role: original.role,
        experience: original.experienceLevel,
        interviewType: original.interviewType,
        questionCount,
        techStack: techStack.length > 0 ? techStack : undefined,
        mode,
        topics: topics.length > 0 ? topics : undefined,
      });
      questions = result.questions;
    } catch (err) {
      if (err instanceof InvalidAiOutputError) return Errors.aiInvalidOutput();
      throw err;
    }

    const newId = uuidv4();
    await db.insert(interviews).values({
      mockId: newId,
      userId: user.id,
      role: original.role,
      experienceLevel: original.experienceLevel,
      interviewType: original.interviewType,
      duration,
      mode,
      techStack: techStack.length > 0 ? techStack : null,
      topics: topics.length > 0 ? topics : null,
      status: "pending",
      questionsJson: { questions },
    });

    return NextResponse.json(
      {
        success: true,
        data: { interviewId: newId, questions },
        meta: {
          requestId: request.headers.get("x-request-id") || undefined,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return handleUnexpectedError(error, "v1/interviews/retakes");
  }
}
