// Interview Types
export type InterviewRole =
  | "frontend"
  | "backend"
  | "fullstack"
  | "data"
  | "devops"
  | "mobile"
  | "hr"
  // Extended roles based on 191 IT courses
  | "data_engineer"
  | "data_analyst"
  | "data_scientist"
  | "ml_engineer"
  | "ai_engineer"
  | "cloud_engineer"
  | "sre"
  | "mobile_android"
  | "mobile_ios"
  | "mobile_cross"
  | "security_engineer"
  | "qa_engineer"
  | "sap_consultant"
  | "salesforce_dev"
  | "rpa_developer"
  | "blockchain_dev";

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
  // Extended roles tech stacks
  data_engineer: [
    "Python", "SQL", "Apache Spark", "Kafka", "Airflow", "Snowflake",
    "Databricks", "AWS Glue", "BigQuery", "Redshift", "ETL/ELT", "Hadoop",
  ],
  data_analyst: [
    "SQL", "Python", "Tableau", "Power BI", "Excel", "Looker",
    "Statistics", "Data Visualization", "R", "Pandas", "Data Modeling",
  ],
  data_scientist: [
    "Python", "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch",
    "Scikit-learn", "NLP", "Computer Vision", "Statistics", "SQL", "Pandas",
  ],
  ml_engineer: [
    "Python", "TensorFlow", "PyTorch", "MLOps", "Kubernetes", "Docker",
    "AWS SageMaker", "Kubeflow", "Feature Engineering", "Model Deployment",
  ],
  ai_engineer: [
    "Python", "LangChain", "OpenAI API", "RAG", "Vector Databases", "LLMs",
    "Prompt Engineering", "Hugging Face", "FastAPI", "Embeddings", "Fine-tuning",
  ],
  cloud_engineer: [
    "AWS", "Azure", "GCP", "Terraform", "CloudFormation", "Kubernetes",
    "Serverless", "VPC", "IAM", "Cloud Security", "Cost Optimization",
  ],
  sre: [
    "Kubernetes", "Docker", "Prometheus", "Grafana", "Terraform", "Python",
    "Go", "Incident Management", "SLO/SLI", "Chaos Engineering", "Linux",
  ],
  mobile_android: [
    "Kotlin", "Java", "Android SDK", "Jetpack Compose", "MVVM", "Room",
    "Retrofit", "Coroutines", "Dagger/Hilt", "Firebase", "Play Store",
  ],
  mobile_ios: [
    "Swift", "SwiftUI", "UIKit", "Xcode", "Core Data", "Combine",
    "MVVM", "CocoaPods", "SPM", "App Store", "Push Notifications",
  ],
  mobile_cross: [
    "React Native", "Flutter", "Dart", "TypeScript", "Expo", "Firebase",
    "State Management", "Native Modules", "App Performance", "CI/CD",
  ],
  security_engineer: [
    "Penetration Testing", "OWASP", "Burp Suite", "Cryptography", "IAM",
    "SIEM", "SOC", "Incident Response", "Network Security", "Cloud Security",
  ],
  qa_engineer: [
    "Selenium", "Cypress", "Playwright", "Jest", "API Testing", "Postman",
    "JMeter", "Performance Testing", "Test Automation", "CI/CD", "Agile",
  ],
  sap_consultant: [
    "SAP FICO", "SAP MM", "SAP SD", "SAP ABAP", "SAP HANA", "SAP S/4HANA",
    "SAP Integration", "SAP Fiori", "SAP BTP", "Business Process",
  ],
  salesforce_dev: [
    "Apex", "Lightning Web Components", "SOQL", "Salesforce Admin", "Flows",
    "Integration", "Salesforce DX", "Visualforce", "Communities", "CPQ",
  ],
  rpa_developer: [
    "UiPath", "Automation Anywhere", "Blue Prism", "Power Automate", "Python",
    "Process Mining", "Bot Development", "OCR", "API Integration",
  ],
  blockchain_dev: [
    "Solidity", "Ethereum", "Web3.js", "Smart Contracts", "Hardhat", "Truffle",
    "DeFi", "NFTs", "Rust", "Blockchain Security", "Consensus Mechanisms",
  ],
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
  keywords?: string[]; // Keywords for validation (optional for backward compatibility)
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
  keywordScore?: number; // Keyword coverage score (0-10)
  keywordsCovered?: string[]; // Keywords found in answer
  keywordsMissed?: string[]; // Keywords not found
  keywordValidationPassed?: boolean; // Did answer meet minimum threshold?
  // Speech metrics
  fillerWordCount?: number;
  fillerWords?: Record<string, number>;
  wordsPerMinute?: number;
  speakingTime?: number;
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
  // Extended roles
  data_engineer: "Data Engineer",
  data_analyst: "Data Analyst",
  data_scientist: "Data Scientist",
  ml_engineer: "ML Engineer",
  ai_engineer: "AI/LLM Engineer",
  cloud_engineer: "Cloud Engineer",
  sre: "Site Reliability Engineer",
  mobile_android: "Android Developer",
  mobile_ios: "iOS Developer",
  mobile_cross: "Cross-Platform Mobile Dev",
  security_engineer: "Security Engineer",
  qa_engineer: "QA/Test Engineer",
  sap_consultant: "SAP Consultant",
  salesforce_dev: "Salesforce Developer",
  rpa_developer: "RPA Developer",
  blockchain_dev: "Blockchain Developer",
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

// PDF Upload Types
export interface PdfParseResponse {
  success: boolean;
  questions: Question[];
  totalExtracted: number;
  error?: string;
}

export interface CreateInterviewFromPdfRequest {
  role: InterviewRole;
  experienceLevel: ExperienceLevel;
  customQuestions: Question[];
}
