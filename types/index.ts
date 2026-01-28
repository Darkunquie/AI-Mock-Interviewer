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

export type InterviewDuration = "15" | "30";

export type InterviewStatus = "pending" | "in_progress" | "completed";

export type Difficulty = "easy" | "medium" | "hard";

export type InterviewMode = "interview" | "practice";

// Tech Stack Options per Role
export const TECH_STACK_OPTIONS: Record<string, string[]> = {
  frontend: [
    "React", "Next.js", "Vue.js", "Angular", "TypeScript", "JavaScript",
    "HTML/CSS", "Tailwind CSS", "Redux", "GraphQL", "Webpack", "Vite",
  ],
  backend: [
    "Node.js", "Express.js", "Python", "Django", "FastAPI", "Java",
    "Spring Boot", "Go", "Ruby on Rails", "PostgreSQL", "MongoDB", "Redis",
  ],
  fullstack: [
    "React", "Next.js", "Node.js", "TypeScript", "Python", "PostgreSQL",
    "MongoDB", "GraphQL", "Docker", "AWS", "REST APIs", "Redis",
  ],
  data: [
    "Python", "Pandas", "NumPy", "SQL", "TensorFlow", "PyTorch",
    "Scikit-learn", "Tableau", "Spark", "R", "Machine Learning", "Statistics",
  ],
  devops: [
    "Docker", "Kubernetes", "AWS", "Azure", "GCP", "Terraform",
    "CI/CD", "Jenkins", "Linux", "Ansible", "Prometheus", "Grafana",
  ],
  mobile: [
    "React Native", "Flutter", "Swift", "Kotlin", "iOS", "Android",
    "Dart", "Expo", "Firebase", "REST APIs", "SQLite", "TypeScript",
  ],
  hr: [],
};

// Practice Topic Options
export const PRACTICE_TOPICS = [
  "Data Structures & Algorithms",
  "System Design",
  "Object-Oriented Programming",
  "Database Design & SQL",
  "REST APIs & Web Services",
  "Design Patterns",
  "Operating Systems",
  "Networking Basics",
  "Security Best Practices",
  "Testing & QA",
  "Git & Version Control",
  "Agile & Scrum",
  "Problem Solving",
  "Code Review & Clean Code",
  "Cloud Computing Basics",
  "Performance Optimization",
];

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

// Duration Configuration
export const DURATION_CONFIG: Record<InterviewDuration, { label: string; questionCount: number }> = {
  "15": { label: "15 Minutes", questionCount: 10 },
  "30": { label: "30 Minutes", questionCount: 20 },
};

// API Request/Response Types
export interface CreateInterviewRequest {
  role: InterviewRole;
  experienceLevel: ExperienceLevel;
  interviewType: InterviewType;
  duration: InterviewDuration;
  techStack?: string[];
  mode?: InterviewMode;
  topics?: string[];
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
