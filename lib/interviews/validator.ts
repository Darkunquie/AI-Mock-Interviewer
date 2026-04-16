// Shared parsing + ownership helpers for interview service.
// Pulls JSON.parse / ownership / status-check logic out of route handlers.

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { interviews } from "@/utils/schema";
import type { Question, AnswerEvaluation } from "@/types";
import { logger } from "@/lib/logger";
import { LOG_PREFIX } from "./constants";

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
  const parsed = JSON.parse(cleaned);

  if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.questions)) {
    throw new Error("Invalid questions format: missing 'questions' array");
  }
  return parsed as { questions: Question[] };
}

export function parseEvaluationJson(jsonString: string): AnswerEvaluation {
  const cleaned = stripCodeFences(jsonString);
  const parsed = JSON.parse(cleaned) as AnswerEvaluation;

  if (
    typeof parsed.technicalScore !== "number" ||
    typeof parsed.communicationScore !== "number" ||
    typeof parsed.depthScore !== "number" ||
    !Array.isArray(parsed.strengths) ||
    !Array.isArray(parsed.weaknesses)
  ) {
    throw new Error("Invalid evaluation format");
  }
  return parsed;
}

export function parseSummaryJson(jsonString: string): Record<string, unknown> {
  const cleaned = stripCodeFences(jsonString);
  return JSON.parse(cleaned) as Record<string, unknown>;
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
