// v1: POST /api/v1/interviews/{interviewId}/answers  (was /api/interview/evaluate)
// Submit an answer + receive evaluation. Route path carries interviewId —
// body only needs questionIndex/questionText/userAnswer/speechMetrics.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { speechMetricsSchema, validateRequest } from "@/lib/validations";
import { Errors, handleZodError, handleUnexpectedError } from "@/lib/errors";
import {
  evaluateAnswer,
  getOwnedInterview,
  parseStoredQuestions,
} from "@/lib/interviews";

const v1AnswerSchema = z.object({
  questionIndex: z.number().int().min(0).max(100),
  questionText: z.string().min(1).max(5000),
  userAnswer: z.string().max(50000).optional().default(""),
  speechMetrics: speechMetricsSchema,
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ interviewId: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) return Errors.unauthorized();

    const { interviewId } = await params;

    let body;
    try {
      body = await request.json();
    } catch {
      return Errors.invalidJson();
    }

    const validation = validateRequest(v1AnswerSchema, body);
    if (!validation.success) return handleZodError(validation.error);
    const { questionIndex, questionText, userAnswer, speechMetrics } = validation.data;

    const lookup = await getOwnedInterview(interviewId, user.id);
    if (!lookup.ok) {
      return lookup.reason === "not_found"
        ? Errors.notFound("Interview")
        : Errors.forbidden();
    }

    const storedQuestions = parseStoredQuestions(lookup.interview.questionsJson);
    const questionKeywords = storedQuestions[questionIndex]?.keywords;

    const evaluation = await evaluateAnswer({
      interview: lookup.interview,
      questionIndex,
      questionText,
      userAnswer,
      speechMetrics,
      questionKeywords,
    });

    return NextResponse.json({
      success: true,
      data: { evaluation },
      meta: {
        requestId: request.headers.get("x-request-id") || undefined,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    return handleUnexpectedError(error, "v1/interviews/answers");
  }
}
