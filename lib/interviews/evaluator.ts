// Answer evaluator — called by interview/evaluate route.
// Groq call, fallback, score clamping, speech-metric injection, keyword validation.

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { answers, interviews } from "@/utils/schema";
import { generateCompletion } from "@/lib/groq";
import { getAnswerEvaluatorPrompt } from "@/utils/prompts";
import { validateKeywords } from "@/lib/utils";
import type { AnswerEvaluation } from "@/types";
import { logger } from "@/lib/logger";
import {
  EVALUATION_SYSTEM_MESSAGE,
  LOG_PREFIX,
  computeAnswerOverall,
} from "./constants";
import { parseEvaluationJson } from "./validator";
import type { InterviewRow } from "./validator";

export interface SpeechMetrics {
  fillerWordCount: number;
  fillerWords: Record<string, number>;
  wordsPerMinute: number;
  speakingTime: number;
}

export interface EvaluateAnswerInput {
  interview: InterviewRow;
  questionIndex: number;
  questionText: string;
  userAnswer: string;
  speechMetrics?: SpeechMetrics;
  questionKeywords?: string[];
}

function fallbackEvaluation(): AnswerEvaluation {
  return {
    technicalScore: 5,
    communicationScore: 5,
    depthScore: 5,
    overallScore: 50,
    strengths: ["Attempted to answer the question"],
    weaknesses: ["Could provide more detailed response"],
    idealAnswer:
      "A comprehensive answer would include specific examples and technical details relevant to the question.",
    followUpTip: "Try to provide concrete examples from your experience.",
    encouragement: "Good effort! Keep practicing to improve.",
  };
}

function clampScore(n: number): number {
  return Math.max(0, Math.min(10, n));
}

function injectSpeechMetrics(evaluation: AnswerEvaluation, metrics: SpeechMetrics): void {
  evaluation.fillerWordCount = metrics.fillerWordCount;
  evaluation.fillerWords = metrics.fillerWords;
  evaluation.wordsPerMinute = metrics.wordsPerMinute;
  evaluation.speakingTime = metrics.speakingTime;

  if (metrics.fillerWordCount > 5) {
    evaluation.weaknesses.push(
      `Used ${metrics.fillerWordCount} filler words - try to reduce these for clearer communication`,
    );
  } else if (metrics.fillerWordCount === 0) {
    evaluation.strengths.push("Excellent - no filler words used!");
  } else if (metrics.fillerWordCount <= 2) {
    evaluation.strengths.push("Great communication - minimal filler words");
  }

  if (metrics.wordsPerMinute < 120) {
    evaluation.weaknesses.push(
      `Speaking pace (${metrics.wordsPerMinute} WPM) is too slow - try to speak a bit faster`,
    );
  } else if (metrics.wordsPerMinute > 180) {
    evaluation.weaknesses.push(
      `Speaking pace (${metrics.wordsPerMinute} WPM) is too fast - slow down for clarity`,
    );
  } else if (metrics.wordsPerMinute >= 140 && metrics.wordsPerMinute <= 160) {
    evaluation.strengths.push("Perfect speaking pace!");
  }
}

function injectKeywordValidation(
  evaluation: AnswerEvaluation,
  keywords: string[],
  userAnswer: string,
): void {
  const result = validateKeywords(keywords, userAnswer);
  evaluation.keywordScore = result.score;
  evaluation.keywordsCovered = result.covered;
  evaluation.keywordsMissed = result.missed;
  evaluation.keywordValidationPassed = result.passed;

  if (!result.passed && result.missed.length > 0) {
    evaluation.weaknesses.push(
      `Missing key concepts: ${result.missed.slice(0, 3).join(", ")}`,
    );
  }
  if (result.passed && result.covered.length > 0) {
    evaluation.strengths.push(
      `Covered important concepts: ${result.covered.slice(0, 3).join(", ")}`,
    );
  }
}

/**
 * Evaluate a single answer end-to-end:
 * 1. Flip interview pending → in_progress (if needed)
 * 2. Call Groq (fallback on error)
 * 3. Clamp scores, recompute overall, inject speech + keywords
 * 4. Upsert the answer row
 */
export async function evaluateAnswer(
  input: EvaluateAnswerInput,
): Promise<AnswerEvaluation> {
  const { interview, questionIndex, questionText, userAnswer, speechMetrics, questionKeywords } =
    input;

  // Status transition
  if (interview.status === "pending") {
    await db
      .update(interviews)
      .set({ status: "in_progress" })
      .where(eq(interviews.mockId, interview.mockId));
  }

  let evaluation: AnswerEvaluation;

  try {
    const raw = await generateCompletion([
      { role: "system", content: EVALUATION_SYSTEM_MESSAGE },
      {
        role: "user",
        content: getAnswerEvaluatorPrompt({
          question: questionText,
          answer: userAnswer,
          role: interview.role,
          experience: interview.experienceLevel,
        }),
      },
    ]);
    evaluation = parseEvaluationJson(raw);

    evaluation.technicalScore = clampScore(evaluation.technicalScore);
    evaluation.communicationScore = clampScore(evaluation.communicationScore);
    evaluation.depthScore = clampScore(evaluation.depthScore);
    evaluation.overallScore = computeAnswerOverall(
      evaluation.technicalScore,
      evaluation.communicationScore,
      evaluation.depthScore,
    );

    logger.info(`${LOG_PREFIX} Evaluation complete`, {
      interviewId: interview.mockId,
      questionIndex,
      tech: evaluation.technicalScore,
      comm: evaluation.communicationScore,
      depth: evaluation.depthScore,
      overall: evaluation.overallScore,
    });
  } catch (aiError) {
    logger.error(
      `${LOG_PREFIX} AI evaluation error — using fallback`,
      aiError instanceof Error ? aiError : new Error(String(aiError)),
      { interviewId: interview.mockId, questionIndex },
    );
    evaluation = fallbackEvaluation();
  }

  if (speechMetrics) {
    injectSpeechMetrics(evaluation, speechMetrics);
  }
  if (questionKeywords && questionKeywords.length > 0) {
    injectKeywordValidation(evaluation, questionKeywords, userAnswer);
  }

  await upsertAnswer(interview.id, questionIndex, questionText, userAnswer, evaluation);

  return evaluation;
}

async function upsertAnswer(
  interviewDbId: number,
  questionIndex: number,
  questionText: string,
  userAnswer: string,
  evaluation: AnswerEvaluation,
): Promise<void> {
  const row = {
    questionText,
    userAnswer,
    feedbackJson: JSON.stringify(evaluation),
    technicalScore: evaluation.technicalScore,
    communicationScore: evaluation.communicationScore,
    depthScore: evaluation.depthScore,
    idealAnswer: evaluation.idealAnswer,
  };

  // Atomic upsert — relies on unique index idx_answers_interview_question
  // on (interview_id, question_index). Prevents race on concurrent writes.
  await db
    .insert(answers)
    .values({
      interviewId: interviewDbId,
      questionIndex,
      ...row,
    })
    .onConflictDoUpdate({
      target: [answers.interviewId, answers.questionIndex],
      set: row,
    });
}
