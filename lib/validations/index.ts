import { z } from "zod";

// ==================== AUTH SCHEMAS ====================

export const signUpSchema = z.object({
  email: z
    .string()
    .email("Invalid email format")
    .max(255, "Email too long"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password too long")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name too long"),
  phone: z
    .string()
    .regex(/^\+?[\d\s-]{10,20}$/, "Invalid phone number format")
    .optional()
    .or(z.literal("")),
});

export const signInSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

// ==================== INTERVIEW SCHEMAS ====================

const interviewRoles = [
  "frontend",
  "backend",
  "fullstack",
  "data",
  "devops",
  "mobile",
  "hr",
  // Extended roles
  "data_engineer",
  "data_analyst",
  "data_scientist",
  "ml_engineer",
  "ai_engineer",
  "cloud_engineer",
  "sre",
  "mobile_android",
  "mobile_ios",
  "mobile_cross",
  "security_engineer",
  "qa_engineer",
  "sap_consultant",
  "salesforce_dev",
  "rpa_developer",
  "blockchain_dev",
  // Oracle Technologies
  "oracle_dba",
  "oracle_developer",
  "oracle_fusion",
  "oci_engineer",
  // Microsoft Technologies
  "dotnet_developer",
  "azure_admin",
  "azure_developer",
  "power_bi_developer",
  "dynamics_consultant",
  "sql_server_dba",
  // SAP Expanded
  "sap_abap",
  "sap_fico",
  "sap_mm",
  "sap_hana",
  "sap_bw",
  // Data & Analytics
  "tableau_developer",
  "informatica_developer",
  "snowflake_engineer",
  "databricks_engineer",
  // Infrastructure
  "network_engineer",
  "linux_admin",
  // Design
  "ui_ux_designer",
  // Testing
  "selenium_tester",
  "automation_tester",
  // Marketing & Business
  "digital_marketer",
  "seo_specialist",
  "scrum_master",
  "product_manager",
  "business_analyst",
] as const;

const experienceLevels = ["0-1", "1-3", "3-5", "5+"] as const;
const interviewTypes = ["technical", "hr", "behavioral"] as const;
const interviewModes = ["interview", "practice"] as const;
const durations = ["15", "30"] as const;

export const createInterviewSchema = z.object({
  role: z.enum(interviewRoles, { message: "Invalid role" }),
  experienceLevel: z.enum(experienceLevels, { message: "Invalid experience level" }),
  interviewType: z.enum(interviewTypes, { message: "Invalid interview type" }),
  mode: z.enum(interviewModes).optional().default("interview"),
  duration: z.enum(durations).optional().default("15"),
  techStack: z
    .array(z.string().max(50))
    .max(10, "Maximum 10 tech stack items")
    .optional(),
  topics: z
    .array(z.string().max(100))
    .max(10, "Maximum 10 topics")
    .optional(),
  resumeText: z.string().max(50000, "Resume text too long").optional(),
});

export const evaluateAnswerSchema = z.object({
  mockId: z.string().uuid("Invalid interview ID"),
  questionIndex: z.number().int().min(0).max(100),
  questionText: z.string().min(1, "Question text is required").max(5000),
  userAnswer: z.string().max(50000, "Answer too long").optional().default(""),
});

export const interviewSummarySchema = z.object({
  mockId: z.string().uuid("Invalid interview ID"),
});

// ==================== FLASHCARD SCHEMAS ====================

export const generateFlashCardsSchema = z.object({
  technology: z.string().min(1, "Technology is required").max(100),
  topic: z.string().min(1, "Topic is required").max(100),
  count: z.number().int().min(1).max(20).optional().default(10),
});

// ==================== PROJECT SCHEMAS ====================

export const generateProjectsSchema = z.object({
  technology: z.string().min(1, "Technology is required").max(100),
  domain: z.string().min(1, "Domain is required").max(100),
  count: z.number().int().min(1).max(5).optional().default(3),
});

// ==================== TYPE EXPORTS ====================

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type CreateInterviewInput = z.infer<typeof createInterviewSchema>;
export type EvaluateAnswerInput = z.infer<typeof evaluateAnswerSchema>;
export type GenerateFlashCardsInput = z.infer<typeof generateFlashCardsSchema>;
export type GenerateProjectsInput = z.infer<typeof generateProjectsSchema>;

// ==================== VALIDATION HELPER ====================

export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}
