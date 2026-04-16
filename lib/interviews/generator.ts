// Question generator — called by create + retake routes.
// Handles Groq call, fallback-on-failure, and JSON parsing.

import { generateCompletion } from "@/lib/groq";
import { getQuestionGeneratorPrompt, type QuestionGeneratorInput } from "@/utils/prompts";
import { cacheGet, cacheSet, canonicalKey } from "@/lib/cache";
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
  cacheHit: boolean;
}

// Question-generation cache tier — TARGET_ARCHITECTURE §5.
// Same role/experience/type/tech/topic combo hits dedupe across all users.
const QUESTION_CACHE_TTL = 24 * 60 * 60; // 24h
const QUESTION_CACHE_PREFIX = "iv:q:";

function questionCacheKey(input: GenerateQuestionsInput): string {
  return (
    QUESTION_CACHE_PREFIX +
    canonicalKey({
      role: input.role,
      experience: input.experience,
      interviewType: input.interviewType,
      mode: input.mode,
      questionCount: input.questionCount,
      techStack: input.techStack,
      topics: input.topics,
      targetCompany: input.targetCompany,
      techDeepDive: input.techDeepDive,
    })
  );
}

/**
 * Generate interview questions. On Groq failure, returns a fallback set
 * rather than throwing — caller decides whether that's acceptable.
 * On malformed AI JSON, throws `InvalidAiOutputError` so caller maps to 502.
 *
 * Cache-aside: same param combo across users hits the 24h `iv:q:*` tier.
 * Fallback results are NOT cached — next user should get a real attempt.
 */
export async function generateQuestions(
  input: GenerateQuestionsInput,
): Promise<GenerateQuestionsResult> {
  const cacheKey = questionCacheKey(input);
  const cached = await cacheGet<Question[]>(cacheKey);
  if (cached && Array.isArray(cached) && cached.length > 0) {
    logger.info(`${LOG_PREFIX} question cache hit`, { cacheKey });
    return { questions: cached, usedFallback: false, cacheHit: true };
  }

  const prompt = getQuestionGeneratorPrompt(input);

  let questionsJson: string;

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
    return { questions: fallback, usedFallback: true, cacheHit: false };
  }

  try {
    const parsed = parseQuestionsJson(questionsJson);
    // Best-effort cache write — never blocks the response on failure.
    await cacheSet(cacheKey, parsed.questions, QUESTION_CACHE_TTL);
    return { questions: parsed.questions, usedFallback: false, cacheHit: false };
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
