// Interview service constants + fallback question bank.
// Shared by create + retake to eliminate the 2x duplication in route handlers.

import type { Question, Difficulty } from "@/types";

export const LOG_PREFIX = "[Interviews]";

type FallbackTemplate = {
  text: (role: string) => string;
  difficulty: Difficulty;
  topic: string;
  expectedTime: number;
};

const FALLBACK_TEMPLATES: FallbackTemplate[] = [
  { text: (r) => `Tell me about yourself and your experience with ${r} development.`, difficulty: "easy", topic: "introduction", expectedTime: 60 },
  { text: (r) => `What are the key skills required for a ${r} role?`, difficulty: "medium", topic: "technical", expectedTime: 90 },
  { text: () => `Describe a challenging project you worked on and how you overcame obstacles.`, difficulty: "medium", topic: "experience", expectedTime: 90 },
  { text: () => `How do you stay updated with the latest technologies in your field?`, difficulty: "medium", topic: "learning", expectedTime: 90 },
  { text: () => `Where do you see yourself in 5 years?`, difficulty: "easy", topic: "career", expectedTime: 60 },
  { text: () => `What is your approach to debugging complex issues?`, difficulty: "medium", topic: "problem-solving", expectedTime: 90 },
  { text: (r) => `Explain a concept in ${r} that you find particularly interesting.`, difficulty: "medium", topic: "technical", expectedTime: 90 },
  { text: () => `How do you handle tight deadlines and pressure?`, difficulty: "medium", topic: "soft-skills", expectedTime: 90 },
  { text: () => `What tools and technologies are you most proficient in?`, difficulty: "easy", topic: "technical", expectedTime: 60 },
  { text: () => `Describe your ideal work environment and team culture.`, difficulty: "easy", topic: "culture", expectedTime: 60 },
  { text: () => `How do you prioritize tasks when working on multiple projects?`, difficulty: "medium", topic: "management", expectedTime: 90 },
  { text: () => `Tell me about a time you had to learn a new technology quickly.`, difficulty: "medium", topic: "adaptability", expectedTime: 90 },
  { text: () => `What is your approach to code reviews and collaboration?`, difficulty: "medium", topic: "teamwork", expectedTime: 90 },
  { text: () => `Describe a situation where you disagreed with a team member. How did you resolve it?`, difficulty: "hard", topic: "conflict-resolution", expectedTime: 120 },
  { text: () => `What architectural decisions have you made and what was the outcome?`, difficulty: "hard", topic: "architecture", expectedTime: 120 },
  { text: () => `How do you ensure the quality and reliability of your code?`, difficulty: "medium", topic: "quality", expectedTime: 90 },
  { text: () => `What is the most complex system you have designed or contributed to?`, difficulty: "hard", topic: "system-design", expectedTime: 120 },
  { text: () => `How do you approach performance optimization?`, difficulty: "hard", topic: "performance", expectedTime: 120 },
  { text: () => `What motivates you to keep growing in your career?`, difficulty: "easy", topic: "motivation", expectedTime: 60 },
  { text: () => `If you could improve one thing about your current skill set, what would it be?`, difficulty: "medium", topic: "self-awareness", expectedTime: 90 },
];

export function buildFallbackQuestions(role: string, count: number): Question[] {
  return FALLBACK_TEMPLATES.slice(0, count).map((t, i) => ({
    id: i + 1,
    text: t.text(role),
    difficulty: t.difficulty,
    topic: t.topic,
    expectedTime: t.expectedTime,
  }));
}

// AI system messages
export const QUESTION_SYSTEM_MESSAGE =
  "You are an expert technical interviewer. Always respond with valid JSON only.";

export const EVALUATION_SYSTEM_MESSAGE =
  "You are an expert interviewer evaluating candidates. Always respond with valid JSON only.";

export const SUMMARY_SYSTEM_MESSAGE =
  "You are a career coach providing interview feedback. Always respond with valid JSON only.";

// Score aggregation weights (must match summary scoring)
export const SCORE_WEIGHTS = {
  technical: 0.4,
  communication: 0.3,
  depth: 0.3,
} as const;

export function computeAnswerOverall(
  technical: number,
  communication: number,
  depth: number,
): number {
  return Math.round(
    (technical * SCORE_WEIGHTS.technical +
      communication * SCORE_WEIGHTS.communication +
      depth * SCORE_WEIGHTS.depth) *
      10,
  );
}

export function ratingFromScore(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 80) return "Very Good";
  if (score >= 70) return "Good";
  if (score >= 60) return "Above Average";
  if (score >= 50) return "Average";
  if (score >= 40) return "Below Average";
  return "Needs Improvement";
}
