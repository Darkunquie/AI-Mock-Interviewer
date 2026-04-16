import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { db } from "@/lib/db";
import { interviews } from "@/utils/schema";
import { DURATION_CONFIG, InterviewDuration } from "@/types";
import { getCurrentUser } from "@/lib/auth";
import { retakeInterviewSchema, validateRequest } from "@/lib/validations";
import { Errors, handleZodError, handleUnexpectedError } from "@/lib/errors";
import {
  generateQuestions,
  getOwnedInterview,
  parseStringArray,
  InvalidAiOutputError,
} from "@/lib/interviews";
import { deprecated } from "@/lib/v0-deprecation";

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

    const validation = validateRequest(retakeInterviewSchema, body);
    if (!validation.success) return handleZodError(validation.error);

    const { interviewId } = validation.data;

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

    const mockId = uuidv4();
    await db.insert(interviews).values({
      mockId,
      userId: user.id,
      role: original.role,
      experienceLevel: original.experienceLevel,
      interviewType: original.interviewType,
      duration,
      mode,
      techStack: techStack.length > 0 ? JSON.stringify(techStack) : null,
      topics: topics.length > 0 ? JSON.stringify(topics) : null,
      status: "pending",
      questionsJson: JSON.stringify({ questions }),
    });

    return deprecated(
      NextResponse.json({
        success: true,
        interviewId: mockId,
        questions,
      }),
      `/api/v1/interviews/${interviewId}/retakes`,
    );
  } catch (error) {
    return handleUnexpectedError(error, "interview/retake");
  }
}
