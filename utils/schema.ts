import {
  pgTable,
  pgEnum,
  serial,
  varchar,
  text,
  integer,
  timestamp,
  index,
  uniqueIndex,
  jsonb,
  boolean,
} from "drizzle-orm/pg-core";
import type { Question } from "@/types";
import type { ProjectSpecification } from "@/types/project";

// =============================================================================
// pgEnum type declarations (C2 — DB-level enforcement of valid enum values)
// =============================================================================

export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);
export const userStatusEnum = pgEnum("user_status", ["pending", "approved", "rejected"]);
export const interviewTypeEnum = pgEnum("interview_type", ["technical", "hr", "behavioral"]);
export const interviewModeEnum = pgEnum("interview_mode", ["interview", "practice"]);
export const interviewStatusEnum = pgEnum("interview_status", ["pending", "in_progress", "completed"]);

// =============================================================================
// Tables
// =============================================================================

// Users table (basic auth)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  password: varchar("password", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  imageUrl: text("image_url"),
  role: userRoleEnum("role").default("user").notNull(),
  status: userStatusEnum("status").default("pending").notNull(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  approvedAt: timestamp("approved_at"),
});

// Single-use email-verification tokens. We store only the SHA-256 hash of the
// token; the raw token lives only in the emailed link. On verify we set the
// user's status to approved + email_verified true (email-verify replaces the
// manual admin-approval gate).
export const emailVerifications = pgTable("email_verifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  tokenHash: varchar("token_hash", { length: 64 }).unique().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  consumedAt: timestamp("consumed_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => [
  index("idx_email_verifications_user").on(t.userId),
]);

// Single-use password-reset tokens (hash stored, raw emailed). Short TTL.
export const passwordResets = pgTable("password_resets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  tokenHash: varchar("token_hash", { length: 64 }).unique().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  consumedAt: timestamp("consumed_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => [
  index("idx_password_resets_user").on(t.userId),
]);

// Interviews table
export const interviews = pgTable("interviews", {
  id: serial("id").primaryKey(),
  mockId: varchar("mock_id", { length: 36 }).unique().notNull(), // UUID
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "set null" }),
  role: varchar("role", { length: 100 }).notNull(),
  experienceLevel: varchar("experience_level", { length: 20 }).notNull(),
  interviewType: interviewTypeEnum("interview_type").notNull(),
  duration: varchar("duration", { length: 10 }).default("15"),
  mode: interviewModeEnum("mode").default("interview"),
  techStack: jsonb("tech_stack").$type<string[]>(),
  topics: jsonb("topics").$type<string[]>(),
  totalScore: integer("total_score").default(0),
  status: interviewStatusEnum("status").default("pending"),
  questionsJson: jsonb("questions_json").$type<{ questions: Question[] }>(),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
}, (t) => [
  index("idx_interviews_user_id").on(t.userId),
  index("idx_interviews_status").on(t.status),
  index("idx_interviews_created_at").on(t.createdAt),
  index("idx_interviews_user_status").on(t.userId, t.status),
]);

// Answers table
export const answers = pgTable("answers", {
  id: serial("id").primaryKey(),
  interviewId: integer("interview_id").references(() => interviews.id, { onDelete: "cascade" }).notNull(),
  questionIndex: integer("question_index").notNull(),
  questionText: text("question_text").notNull(),
  userAnswer: text("user_answer"),
  feedbackJson: jsonb("feedback_json").$type<Record<string, unknown>>(),
  technicalScore: integer("technical_score"),
  communicationScore: integer("communication_score"),
  depthScore: integer("depth_score"),
  idealAnswer: text("ideal_answer"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
}, (t) => [
  index("idx_answers_interview_id").on(t.interviewId),
  uniqueIndex("idx_answers_interview_question").on(t.interviewId, t.questionIndex),
]);

// Interview Summaries table
export const interviewSummaries = pgTable("interview_summaries", {
  id: serial("id").primaryKey(),
  interviewId: integer("interview_id").references(() => interviews.id, { onDelete: "cascade" }).notNull(),
  overallScore: integer("overall_score"),
  rating: varchar("rating", { length: 50 }),
  strengthsJson: jsonb("strengths_json").$type<string[]>(),
  weaknessesJson: jsonb("weaknesses_json").$type<string[]>(),
  recommendedTopicsJson: jsonb("recommended_topics_json").$type<string[]>(),
  actionPlan: text("action_plan"),
  summaryText: text("summary_text"),
  encouragement: text("encouragement"),
  readinessLevel: varchar("readiness_level", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => [
  uniqueIndex("idx_summaries_interview_id").on(t.interviewId),
]);

// Generated Projects table
export const generatedProjects = pgTable("generated_projects", {
  id: serial("id").primaryKey(),
  technology: varchar("technology", { length: 255 }).notNull(),
  domain: varchar("domain", { length: 255 }).notNull(),
  projectsJson: jsonb("projects_json").$type<ProjectSpecification[]>().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => [
  uniqueIndex("idx_projects_tech_domain").on(t.technology, t.domain),
]);

// =============================================================================
// TypeScript types
// =============================================================================

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Interview = typeof interviews.$inferSelect;
export type NewInterview = typeof interviews.$inferInsert;
export type Answer = typeof answers.$inferSelect;
export type NewAnswer = typeof answers.$inferInsert;
export type InterviewSummary = typeof interviewSummaries.$inferSelect;
export type NewInterviewSummary = typeof interviewSummaries.$inferInsert;
export type GeneratedProject = typeof generatedProjects.$inferSelect;
export type NewGeneratedProject = typeof generatedProjects.$inferInsert;
export type EmailVerification = typeof emailVerifications.$inferSelect;
export type NewEmailVerification = typeof emailVerifications.$inferInsert;
export type PasswordReset = typeof passwordResets.$inferSelect;
export type NewPasswordReset = typeof passwordResets.$inferInsert;
