import { pgTable, serial, varchar, text, integer, timestamp } from "drizzle-orm/pg-core";

// Users table (basic auth)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  password: varchar("password", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Interviews table
export const interviews = pgTable("interviews", {
  id: serial("id").primaryKey(),
  mockId: varchar("mock_id", { length: 36 }).unique().notNull(), // UUID
  userId: integer("user_id").notNull(), // User ID reference
  role: varchar("role", { length: 100 }).notNull(), // frontend, backend, fullstack, data, hr
  experienceLevel: varchar("experience_level", { length: 20 }).notNull(), // 0-1, 1-3, 3-5, 5+
  interviewType: varchar("interview_type", { length: 50 }).notNull(), // technical, hr, behavioral
  totalScore: integer("total_score").default(0),
  status: varchar("status", { length: 20 }).default("pending"), // pending, in_progress, completed
  questionsJson: text("questions_json"), // JSON string of generated questions
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Answers table
export const answers = pgTable("answers", {
  id: serial("id").primaryKey(),
  interviewId: integer("interview_id").references(() => interviews.id),
  questionIndex: integer("question_index").notNull(),
  questionText: text("question_text").notNull(),
  userAnswer: text("user_answer"),
  feedbackJson: text("feedback_json"), // AI evaluation JSON
  technicalScore: integer("technical_score"),
  communicationScore: integer("communication_score"),
  depthScore: integer("depth_score"),
  idealAnswer: text("ideal_answer"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Interview Summaries table
export const interviewSummaries = pgTable("interview_summaries", {
  id: serial("id").primaryKey(),
  interviewId: integer("interview_id").references(() => interviews.id),
  overallScore: integer("overall_score"),
  rating: varchar("rating", { length: 50 }), // Excellent, Good, Average, Needs Improvement
  strengthsJson: text("strengths_json"), // JSON array
  weaknessesJson: text("weaknesses_json"), // JSON array
  recommendedTopicsJson: text("recommended_topics_json"), // JSON array
  actionPlan: text("action_plan"),
  summaryText: text("summary_text"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Types for TypeScript
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Interview = typeof interviews.$inferSelect;
export type NewInterview = typeof interviews.$inferInsert;
export type Answer = typeof answers.$inferSelect;
export type NewAnswer = typeof answers.$inferInsert;
export type InterviewSummary = typeof interviewSummaries.$inferSelect;
export type NewInterviewSummary = typeof interviewSummaries.$inferInsert;
