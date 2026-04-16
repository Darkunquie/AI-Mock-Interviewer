// Shared parsing + ownership helpers for interview service.
// Pulls JSON.parse / ownership / status-check logic out of route handlers.
// AI responses are validated via Zod schemas from lib/validations/ai.ts
// so malformed/hallucinated output is rejected before reaching DB or client.

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { interviews } from "@/utils/schema";
import type { Question, AnswerEvaluation } from "@/types";
import { logger } from "@/lib/logger";
import { LOG_PREFIX } from "./constants";
import {
  questionsOutSchema,
  evalOutSchema,
  summaryOutSchema,
  type SummaryOut,
} from "@/lib/validations/ai";

export type InterviewRow = typeof interviews.$inferSelect;

export function stripCodeFences(raw: string): string {
  let s = raw.trim();
  if (s.startsWith("```json")) s = s.slice(7);
  else if (s.startsWith("```")) s = s.slice(3);
  if (s.endsWith("```")) s = s.slice(0, -3);
  return s.trim();
}

export function parseQuestionsJson(jsonString: string): { questions: Question[] } {
  const cleaned = stripCodeFences(jsonString);
  const raw = JSON.parse(cleaned);
  const parsed = questionsOutSchema.safeParse(raw);
  if (!parsed.success) {
    logger.warn(`${LOG_PREFIX} questions schema rejected AI output`, {
      issues: parsed.error.issues.slice(0, 3),
    });
    throw new Error("Invalid questions format: schema validation failed");
  }
  // id is server-assigned if missing
  const questions: Question[] = parsed.data.questions.map((q, i) => ({
    id: q.id ?? i + 1,
    text: q.text,
    difficulty: q.difficulty,
    topic: q.topic,
    expectedTime: q.expectedTime,
    keywords: q.keywords,
  }));
  return { questions };
}

export function parseEvaluationJson(jsonString: string): AnswerEvaluation {
  const cleaned = stripCodeFences(jsonString);
  const raw = JSON.parse(cleaned);
  const parsed = evalOutSchema.safeParse(raw);
  if (!parsed.success) {
    logger.warn(`${LOG_PREFIX} evaluation schema rejected AI output`, {
      issues: parsed.error.issues.slice(0, 3),
    });
    throw new Error("Invalid evaluation format: schema validation failed");
  }
  return {
    technicalScore: parsed.data.technicalScore,
    communicationScore: parsed.data.communicationScore,
    depthScore: parsed.data.depthScore,
    overallScore: parsed.data.overallScore ?? 0,
    strengths: parsed.data.strengths,
    weaknesses: parsed.data.weaknesses,
    idealAnswer: parsed.data.idealAnswer,
    followUpTip: parsed.data.followUpTip,
    encouragement: parsed.data.encouragement,
  };
}

export function parseSummaryJson(jsonString: string): Partial<SummaryOut> {
  const cleaned = stripCodeFences(jsonString);
  const raw = JSON.parse(cleaned);
  const parsed = summaryOutSchema.safeParse(raw);
  if (!parsed.success) {
    logger.warn(`${LOG_PREFIX} summary schema rejected AI output`, {
      issues: parsed.error.issues.slice(0, 3),
    });
    throw new Error("Invalid summary format: schema validation failed");
  }
  return parsed.data;
}

export type InterviewLookup =
  | { ok: true; interview: InterviewRow }
  | { ok: false; reason: "not_found" | "forbidden" };

/**
 * Fetch an interview by mockId and assert ownership.
 * Discriminated via `ok` so callers narrow cleanly.
 */
export async function getOwnedInterview(
  mockId: string,
  userId: number,
): Promise<InterviewLookup> {
  const rows = await db
    .select()
    .from(interviews)
    .where(eq(interviews.mockId, mockId))
    .limit(1);

  if (!rows.length) return { ok: false, reason: "not_found" };
  const interview = rows[0];
  if (interview.userId !== userId) return { ok: false, reason: "forbidden" };
  return { ok: true, interview };
}

export function parseStoredQuestions(raw: string | null): Question[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as { questions?: Question[] };
    return Array.isArray(parsed.questions) ? parsed.questions : [];
  } catch (err) {
    logger.warn(`${LOG_PREFIX} Failed to parse stored questionsJson`, {
      error: err instanceof Error ? err.message : String(err),
    });
    return [];
  }
}

export function parseStringArray(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
