-- Data cleanup: trim whitespace and NULL out values that don't match enum definitions.
-- This prevents enum cast failures on rows with case mismatches, extra spaces, or unknown values.
UPDATE "interviews" SET "interview_type" = LOWER(TRIM("interview_type")) WHERE "interview_type" IS NOT NULL;--> statement-breakpoint
UPDATE "interviews" SET "interview_type" = NULL WHERE "interview_type" NOT IN ('technical', 'hr', 'behavioral');--> statement-breakpoint
UPDATE "interviews" SET "mode" = LOWER(TRIM("mode")) WHERE "mode" IS NOT NULL;--> statement-breakpoint
UPDATE "interviews" SET "mode" = NULL WHERE "mode" NOT IN ('interview', 'practice');--> statement-breakpoint
UPDATE "interviews" SET "status" = LOWER(TRIM("status")) WHERE "status" IS NOT NULL;--> statement-breakpoint
UPDATE "interviews" SET "status" = NULL WHERE "status" NOT IN ('pending', 'in_progress', 'completed');--> statement-breakpoint
UPDATE "users" SET "role" = LOWER(TRIM("role")) WHERE "role" IS NOT NULL;--> statement-breakpoint
UPDATE "users" SET "role" = NULL WHERE "role" NOT IN ('user', 'admin');--> statement-breakpoint
UPDATE "users" SET "status" = LOWER(TRIM("status")) WHERE "status" IS NOT NULL;--> statement-breakpoint
UPDATE "users" SET "status" = NULL WHERE "status" NOT IN ('pending', 'approved', 'rejected');--> statement-breakpoint
UPDATE "users" SET "subscription_status" = LOWER(TRIM("subscription_status")) WHERE "subscription_status" IS NOT NULL;--> statement-breakpoint
UPDATE "users" SET "subscription_status" = NULL WHERE "subscription_status" NOT IN ('none', 'trial', 'active', 'expired');--> statement-breakpoint
CREATE TYPE "public"."interview_mode" AS ENUM('interview', 'practice');--> statement-breakpoint
CREATE TYPE "public"."interview_status" AS ENUM('pending', 'in_progress', 'completed');--> statement-breakpoint
CREATE TYPE "public"."interview_type" AS ENUM('technical', 'hr', 'behavioral');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('none', 'trial', 'active', 'expired');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
-- JSON cleanup: NULL out empty strings that cannot cast to jsonb.
UPDATE "answers" SET "feedback_json" = NULL WHERE "feedback_json" = '';--> statement-breakpoint
UPDATE "generated_projects" SET "projects_json" = NULL WHERE "projects_json" = '';--> statement-breakpoint
UPDATE "interview_summaries" SET "strengths_json" = NULL WHERE "strengths_json" = '';--> statement-breakpoint
UPDATE "interview_summaries" SET "weaknesses_json" = NULL WHERE "weaknesses_json" = '';--> statement-breakpoint
UPDATE "interview_summaries" SET "recommended_topics_json" = NULL WHERE "recommended_topics_json" = '';--> statement-breakpoint
UPDATE "interviews" SET "tech_stack" = NULL WHERE "tech_stack" = '';--> statement-breakpoint
UPDATE "interviews" SET "topics" = NULL WHERE "topics" = '';--> statement-breakpoint
UPDATE "interviews" SET "questions_json" = NULL WHERE "questions_json" = '';--> statement-breakpoint
ALTER TABLE "answers" ALTER COLUMN "feedback_json" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "generated_projects" ALTER COLUMN "projects_json" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "interview_summaries" ALTER COLUMN "strengths_json" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "interview_summaries" ALTER COLUMN "weaknesses_json" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "interview_summaries" ALTER COLUMN "recommended_topics_json" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "interviews" ALTER COLUMN "interview_type" SET DATA TYPE "public"."interview_type" USING "interview_type"::"public"."interview_type";--> statement-breakpoint
ALTER TABLE "interviews" ALTER COLUMN "mode" SET DATA TYPE "public"."interview_mode" USING "mode"::"public"."interview_mode";--> statement-breakpoint
ALTER TABLE "interviews" ALTER COLUMN "mode" SET DEFAULT 'interview'::"public"."interview_mode";--> statement-breakpoint
ALTER TABLE "interviews" ALTER COLUMN "tech_stack" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "interviews" ALTER COLUMN "topics" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "interviews" ALTER COLUMN "status" SET DATA TYPE "public"."interview_status" USING "status"::"public"."interview_status";--> statement-breakpoint
ALTER TABLE "interviews" ALTER COLUMN "status" SET DEFAULT 'pending'::"public"."interview_status";--> statement-breakpoint
ALTER TABLE "interviews" ALTER COLUMN "questions_json" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE "public"."user_role" USING "role"::"public"."user_role";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'user'::"public"."user_role";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "status" SET DATA TYPE "public"."user_status" USING "status"::"public"."user_status";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "status" SET DEFAULT 'pending'::"public"."user_status";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "subscription_status" SET DATA TYPE "public"."subscription_status" USING "subscription_status"::"public"."subscription_status";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "subscription_status" SET DEFAULT 'none'::"public"."subscription_status";--> statement-breakpoint
ALTER TABLE "interview_summaries" ADD COLUMN "encouragement" text;--> statement-breakpoint
ALTER TABLE "interview_summaries" ADD COLUMN "readiness_level" varchar(50);