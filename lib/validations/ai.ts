// Zod schemas for AI (Groq) response validation.
// Defense-in-depth: these schemas reject malformed/hallucinated AI output
// BEFORE it reaches the DB or the client — loose `JSON.parse` alone lets
// bad shapes through (e.g. strings where numbers expected).
//
// Usage pattern in service layer:
//   const raw = await generateCompletion(...);
//   const parsed = QuestionsOutSchema.safeParse(JSON.parse(raw));
//   if (!parsed.success) { /* retry / fallback */ }

import { z } from "zod";

const difficultyEnum = z.enum(["easy", "medium", "hard"]);

export const questionOutSchema = z.object({
  id: z.number().int().nonnegative().optional(),
  text: z.string().min(1).max(5000),
  difficulty: difficultyEnum,
  topic: z.string().max(200),
  expectedTime: z.number().int().positive(),
  keywords: z.array(z.string().max(100)).max(50).optional(),
});

export const questionsOutSchema = z.object({
  questions: z.array(questionOutSchema).min(1).max(100),
});

export const evalOutSchema = z.object({
  technicalScore: z.number().min(0).max(10),
  communicationScore: z.number().min(0).max(10),
  depthScore: z.number().min(0).max(10),
  overallScore: z.number().optional(), // recomputed server-side
  strengths: z.array(z.string()).max(20).default([]),
  weaknesses: z.array(z.string()).max(20).default([]),
  idealAnswer: z.string().max(5000).default(""),
  followUpTip: z.string().max(1000).optional().default(""),
  encouragement: z.string().max(1000).optional().default(""),
});

export const readinessLevelEnum = z.enum([
  "Not Ready",
  "Almost Ready",
  "Ready",
  "Well Prepared",
]);

export const summaryOutSchema = z.object({
  overallScore: z.number().min(0).max(100),
  rating: z.string().max(50),
  performanceSummary: z.string().max(5000),
  strengths: z.array(z.string()).max(20).default([]),
  weaknesses: z.array(z.string()).max(20).default([]),
  recommendedTopics: z.array(z.string()).max(20).default([]),
  actionPlan: z.string().max(5000),
  encouragement: z.string().max(1000).optional(),
  readinessLevel: readinessLevelEnum.optional(),
});

export type QuestionOut = z.infer<typeof questionOutSchema>;
export type QuestionsOut = z.infer<typeof questionsOutSchema>;
export type EvalOut = z.infer<typeof evalOutSchema>;
export type SummaryOut = z.infer<typeof summaryOutSchema>;
