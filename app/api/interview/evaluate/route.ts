import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { evaluateAnswerSchema, validateRequest } from "@/lib/validations";
import { Errors, handleZodError, handleUnexpectedError } from "@/lib/errors";
import {
  evaluateAnswer,
  getOwnedInterview,
  parseStoredQuestions,
} from "@/lib/interviews";

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

    const validation = validateRequest(evaluateAnswerSchema, {
      mockId: body.interviewId,
      questionIndex: body.questionIndex,
      questionText: body.questionText,
      userAnswer: body.userAnswer,
      speechMetrics: body.speechMetrics,
    });
    if (!validation.success) return handleZodError(validation.error);

    const { questionIndex, questionText, userAnswer, speechMetrics } =
      validation.data;
    const interviewId = validation.data.mockId;

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

    return NextResponse.json({ success: true, evaluation });
  } catch (error) {
    return handleUnexpectedError(error, "interview/evaluate");
  }
}
