// Interview Types
export type InterviewRole =
  | "frontend"
  | "backend"
  | "fullstack"
  | "data"
  | "devops"
  | "mobile"
  | "hr";

export type ExperienceLevel = "0-1" | "1-3" | "3-5" | "5+";

export type InterviewType = "technical" | "hr" | "behavioral";

export type InterviewStatus = "pending" | "in_progress" | "completed";

export type Difficulty = "easy" | "medium" | "hard";

// Question Types
export interface Question {
  id: number;
  text: string;
  difficulty: Difficulty;
  topic: string;
  expectedTime: number; // seconds
}

export interface GeneratedQuestions {
  questions: Question[];
}

// Evaluation Types
export interface AnswerEvaluation {
  technicalScore: number;
  communicationScore: number;
  depthScore: number;
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  idealAnswer: string;
  followUpTip: string;
  encouragement: string;
}

// Summary Types
export interface InterviewSummaryData {
  overallScore: number;
  rating: string;
  performanceSummary: string;
  strengths: string[];
  weaknesses: string[];
  recommendedTopics: string[];
  actionPlan: string;
  encouragement: string;
  readinessLevel: "Not Ready" | "Almost Ready" | "Ready" | "Well Prepared";
}

// Interview Session State
export interface InterviewSession {
  interviewId: string;
  currentQuestionIndex: number;
  questions: Question[];
  answers: AnswerWithFeedback[];
  status: InterviewStatus;
}

export interface AnswerWithFeedback {
  questionIndex: number;
  questionText: string;
  userAnswer: string;
  evaluation: AnswerEvaluation | null;
}

// API Request/Response Types
export interface CreateInterviewRequest {
  role: InterviewRole;
  experienceLevel: ExperienceLevel;
  interviewType: InterviewType;
}

export interface CreateInterviewResponse {
  success: boolean;
  interviewId: string;
  questions: Question[];
}

export interface EvaluateAnswerRequest {
  interviewId: string;
  questionIndex: number;
  questionText: string;
  userAnswer: string;
}

export interface EvaluateAnswerResponse {
  success: boolean;
  evaluation: AnswerEvaluation;
}

// Role Display Names
export const ROLE_DISPLAY_NAMES: Record<InterviewRole, string> = {
  frontend: "Frontend Developer",
  backend: "Backend Developer",
  fullstack: "Full Stack Developer",
  data: "Data Scientist / Analyst",
  devops: "DevOps Engineer",
  mobile: "Mobile Developer",
  hr: "HR / General",
};

export const EXPERIENCE_DISPLAY_NAMES: Record<ExperienceLevel, string> = {
  "0-1": "Fresher (0-1 years)",
  "1-3": "Junior (1-3 years)",
  "3-5": "Mid-Level (3-5 years)",
  "5+": "Senior (5+ years)",
};

export const INTERVIEW_TYPE_DISPLAY_NAMES: Record<InterviewType, string> = {
  technical: "Technical Interview",
  hr: "HR Interview",
  behavioral: "Behavioral Interview",
};
