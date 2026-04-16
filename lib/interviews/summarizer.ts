// Summary generator — called by interview/summary route.
// Handles score aggregation, AI call with fallback, idempotency against
// existing summary rows, and status transition to "completed".

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { interviews, answers, interviewSummaries } from "@/utils/schema";
import { generateCompletion } from "@/lib/groq";
import { getSummaryGeneratorPrompt } from "@/utils/prompts";
import { logger } from "@/lib/logger";
import {
  SUMMARY_SYSTEM_MESSAGE,
  LOG_PREFIX,
  SCORE_WEIGHTS,
  ratingFromScore,
} from "./constants";
import { parseSummaryJson, parseStoredQuestions } from "./validator";
import type { InterviewRow } from "./validator";

export interface SummaryResult {
  overallScore: number;
  rating: string;
  strengths: string[];
  weaknesses: string[];
  recommendedTopics: string[];
  actionPlan: string;
  performanceSummary: string;
  encouragement?: string;
  readinessLevel?: string;
  idempotent: boolean; // true = returned cached row, no Groq call
}

type AnswerRow = typeof answers.$inferSelect;

function aggregateScores(answerRows: AnswerRow[], totalQuestions: number): number {
  const sum = answerRows.reduce(
    (acc, a) =>
      acc +
      ((a.technicalScore || 0) * SCORE_WEIGHTS.technical +
        (a.communicationScore || 0) * SCORE_WEIGHTS.communication +
        (a.depthScore || 0) * SCORE_WEIGHTS.depth),
    0,
  );
  return totalQuestions > 0 ? Math.round((sum / totalQuestions) * 10) : 0;
}

function fallbackSummary(
  answeredCount: number,
  totalQuestions: number,
  overallScore: number,
): Omit<SummaryResult, "idempotent"> {
  const unanswered = totalQuestions - answeredCount;
  return {
    overallScore,
    rating: ratingFromScore(overallScore),
    performanceSummary:
      unanswered > 0
        ? `You answered ${answeredCount} out of ${totalQuestions} questions. ${unanswered} unanswered question(s) were scored as 0.`
        : "You completed the interview. Review your answers to identify areas for improvement.",
    strengths: ["Completed the interview", "Showed willingness to answer"],
    weaknesses:
      unanswered > 0
        ? [
            `${unanswered} question(s) left unanswered`,
            "Review technical concepts",
            "Practice providing more detailed answers",
          ]
        : ["Review technical concepts", "Practice providing more detailed answers"],
    recommendedTopics: [
      "Interview preparation",
      "Technical fundamentals",
      "Communication skills",
    ],
    actionPlan:
      "Practice more mock interviews and review common questions for your target role.",
    encouragement: "Every interview is a learning opportunity. Keep practicing!",
    readinessLevel: overallScore >= 70 ? "Almost Ready" : "Not Ready",
  };
}

/**
 * Generate an interview summary.
 * Idempotent: if a summary row already exists for this interview, returns
 * that existing row WITHOUT calling Groq (saves tokens on repeat clicks).
 */
export async function generateSummary(interview: InterviewRow): Promise<SummaryResult> {
  // Idempotency check — return existing summary if present
  const existing = await db
    .select()
    .from(interviewSummaries)
    .where(eq(interviewSummaries.interviewId, interview.id))
    .limit(1);

  if (existing.length > 0) {
    const row = existing[0];
    logger.info(`${LOG_PREFIX} Summary idempotent hit`, {
      interviewId: interview.mockId,
    });
    return {
      overallScore: row.overallScore ?? 0,
      rating: row.rating ?? "",
      strengths: safeParseArray(row.strengthsJson),
      weaknesses: safeParseArray(row.weaknessesJson),
      recommendedTopics: safeParseArray(row.recommendedTopicsJson),
      actionPlan: row.actionPlan ?? "",
      performanceSummary: row.summaryText ?? "",
      idempotent: true,
    };
  }

  // Gather answers + question count
  const answerRows = await db
    .select()
    .from(answers)
    .where(eq(answers.interviewId, interview.id))
    .orderBy(answers.questionIndex);

  if (answerRows.length === 0) {
    throw new NoAnswersError("No answers found for this interview");
  }

  const totalQuestions = parseStoredQuestions(interview.questionsJson).length;
  const overallScore = aggregateScores(answerRows, totalQuestions);
  const rating = ratingFromScore(overallScore);

  // Try Groq
  let summaryData: Omit<SummaryResult, "idempotent">;
  try {
    const prompt = getSummaryGeneratorPrompt({
      answers: answerRows.map((a) => ({
        question: a.questionText,
        answer: a.userAnswer || "",
        technicalScore: a.technicalScore || 0,
        communicationScore: a.communicationScore || 0,
        depthScore: a.depthScore || 0,
      })),
      role: interview.role,
    });

    const raw = await generateCompletion([
      { role: "system", content: SUMMARY_SYSTEM_MESSAGE },
      { role: "user", content: prompt },
    ]);
    const parsed = parseSummaryJson(raw);

    summaryData = {
      overallScore,
      rating,
      strengths: Array.isArray(parsed.strengths) ? (parsed.strengths as string[]) : [],
      weaknesses: Array.isArray(parsed.weaknesses) ? (parsed.weaknesses as string[]) : [],
      recommendedTopics: Array.isArray(parsed.recommendedTopics)
        ? (parsed.recommendedTopics as string[])
        : [],
      actionPlan: typeof parsed.actionPlan === "string" ? parsed.actionPlan : "",
      performanceSummary:
        typeof parsed.performanceSummary === "string" ? parsed.performanceSummary : "",
      encouragement:
        typeof parsed.encouragement === "string" ? parsed.encouragement : undefined,
      readinessLevel:
        typeof parsed.readinessLevel === "string" ? parsed.readinessLevel : undefined,
    };
  } catch (err) {
    logger.error(
      `${LOG_PREFIX} AI summary error — using fallback`,
      err instanceof Error ? err : new Error(String(err)),
      { interviewId: interview.mockId },
    );
    summaryData = fallbackSummary(answerRows.length, totalQuestions, overallScore);
  }

  // Persist: insert summary, flip interview to completed.
  // Upsert against unique index on interview_id for idempotency under concurrent requests.
  await db
    .insert(interviewSummaries)
    .values({
      interviewId: interview.id,
      overallScore: summaryData.overallScore,
      rating: summaryData.rating,
      strengthsJson: JSON.stringify(summaryData.strengths),
      weaknessesJson: JSON.stringify(summaryData.weaknesses),
      recommendedTopicsJson: JSON.stringify(summaryData.recommendedTopics),
      actionPlan: summaryData.actionPlan,
      summaryText: summaryData.performanceSummary,
    })
    .onConflictDoUpdate({
      target: interviewSummaries.interviewId,
      set: {
        overallScore: summaryData.overallScore,
        rating: summaryData.rating,
        strengthsJson: JSON.stringify(summaryData.strengths),
        weaknessesJson: JSON.stringify(summaryData.weaknesses),
        recommendedTopicsJson: JSON.stringify(summaryData.recommendedTopics),
        actionPlan: summaryData.actionPlan,
        summaryText: summaryData.performanceSummary,
      },
    });

  await db
    .update(interviews)
    .set({
      status: "completed",
      totalScore: summaryData.overallScore,
      completedAt: new Date(),
    })
    .where(eq(interviews.mockId, interview.mockId));

  return { ...summaryData, idempotent: false };
}

function safeParseArray(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export class NoAnswersError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NoAnswersError";
  }
}
