import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { db } from "@/lib/db";
import { interviews } from "@/utils/schema";
import { CreateInterviewRequest, DURATION_CONFIG, Question } from "@/types";
import { getCurrentUser } from "@/lib/auth";
import { createInterviewSchema, validateRequest } from "@/lib/validations";
import { Errors, handleZodError, handleUnexpectedError } from "@/lib/errors";
import { generateQuestions, InvalidAiOutputError } from "@/lib/interviews";
import { deprecated } from "@/lib/v0-deprecation";

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

    // Custom questions (PDF upload) bypass AI generation
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

    const mockId = uuidv4();
    await db.insert(interviews).values({
      mockId,
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

    return deprecated(
      NextResponse.json({
        success: true,
        interviewId: mockId,
        questions,
      }),
      "/api/v1/interviews",
    );
  } catch (error) {
    return handleUnexpectedError(error, "interview/create");
  }
}
