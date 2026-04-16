import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { evaluateAnswerSchema, validateRequest } from "@/lib/validations";
import { Errors, handleZodError, handleUnexpectedError } from "@/lib/errors";
import { evaluateAnswer, getOwnedInterview, parseStoredQuestions } from "@/lib/interviews";
import { deprecated } from "@/lib/v0-deprecation";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return Errors.unauthorized();

    let body;
    try { body = await request.json(); } catch { return Errors.invalidJson(); }

    const validation = validateRequest(evaluateAnswerSchema, body);
    if (!validation.success) return handleZodError(validation.error);

    const { interviewId, questionIndex, questionText, userAnswer, speechMetrics } = validation.data;

    const lookup = await getOwnedInterview(interviewId, user.id);
    if (!lookup.ok) return lookup.reason === "not_found" ? Errors.notFound("Interview") : Errors.forbidden();

    const storedQuestions = parseStoredQuestions(lookup.interview.questionsJson);
    if (storedQuestions.length > 0 && (questionIndex < 0 || questionIndex >= storedQuestions.length)) {
      return Errors.badRequest("Question index out of bounds");
    }

    const evaluation = await evaluateAnswer({
      interview: lookup.interview, questionIndex, questionText, userAnswer, speechMetrics,
      questionKeywords: storedQuestions[questionIndex]?.keywords,
    });

    return deprecated(
      NextResponse.json({ success: true, evaluation }),
      `/api/v1/interviews/${interviewId}/answers`,
    );
  } catch (error) {
    return handleUnexpectedError(error, "interview/evaluate");
  }
}
