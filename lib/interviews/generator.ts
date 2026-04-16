// Question generator — called by create + retake routes.
// Handles Groq call, fallback-on-failure, and JSON parsing.

import { generateCompletion } from "@/lib/groq";
import { getQuestionGeneratorPrompt, type QuestionGeneratorInput } from "@/utils/prompts";
import { logger } from "@/lib/logger";
import type { Question } from "@/types";
import {
  QUESTION_SYSTEM_MESSAGE,
  LOG_PREFIX,
  buildFallbackQuestions,
} from "./constants";
import { parseQuestionsJson } from "./validator";

export interface GenerateQuestionsInput extends QuestionGeneratorInput {}

export interface GenerateQuestionsResult {
  questions: Question[];
  usedFallback: boolean;
}

/**
 * Generate interview questions. On Groq failure, returns a fallback set
 * rather than throwing — caller decides whether that's acceptable.
 * On malformed AI JSON, throws `InvalidAiOutputError` so caller maps to 502.
 */
export async function generateQuestions(
  input: GenerateQuestionsInput,
): Promise<GenerateQuestionsResult> {
  const prompt = getQuestionGeneratorPrompt(input);

  let questionsJson: string;
  let usedFallback = false;

  try {
    questionsJson = await generateCompletion([
      { role: "system", content: QUESTION_SYSTEM_MESSAGE },
      { role: "user", content: prompt },
    ]);
  } catch (aiError) {
    logger.error(
      `${LOG_PREFIX} Groq question-generation failed, using fallback`,
      aiError instanceof Error ? aiError : new Error(String(aiError)),
      { role: input.role, interviewType: input.interviewType },
    );
    const fallback = buildFallbackQuestions(input.role, input.questionCount);
    return { questions: fallback, usedFallback: true };
  }

  try {
    const parsed = parseQuestionsJson(questionsJson);
    return { questions: parsed.questions, usedFallback };
  } catch (parseErr) {
    logger.error(
      `${LOG_PREFIX} AI question JSON parse failed`,
      parseErr instanceof Error ? parseErr : new Error(String(parseErr)),
    );
    throw new InvalidAiOutputError("Question generator returned invalid JSON");
  }
}

export class InvalidAiOutputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidAiOutputError";
  }
}
