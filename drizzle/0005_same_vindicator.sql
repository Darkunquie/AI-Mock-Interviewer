CREATE TYPE "public"."interview_mode" AS ENUM('interview', 'practice');--> statement-breakpoint
CREATE TYPE "public"."interview_status" AS ENUM('pending', 'in_progress', 'completed');--> statement-breakpoint
CREATE TYPE "public"."interview_type" AS ENUM('technical', 'hr', 'behavioral');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('none', 'trial', 'active', 'expired');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
ALTER TABLE "answers" ALTER COLUMN "feedback_json" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "generated_projects" ALTER COLUMN "projects_json" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "interview_summaries" ALTER COLUMN "strengths_json" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "interview_summaries" ALTER COLUMN "weaknesses_json" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "interview_summaries" ALTER COLUMN "recommended_topics_json" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "interviews" ALTER COLUMN "interview_type" SET DATA TYPE "public"."interview_type" USING "interview_type"::"public"."interview_type";--> statement-breakpoint
ALTER TABLE "interviews" ALTER COLUMN "mode" SET DEFAULT 'interview'::"public"."interview_mode";--> statement-breakpoint
ALTER TABLE "interviews" ALTER COLUMN "mode" SET DATA TYPE "public"."interview_mode" USING "mode"::"public"."interview_mode";--> statement-breakpoint
ALTER TABLE "interviews" ALTER COLUMN "tech_stack" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "interviews" ALTER COLUMN "topics" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "interviews" ALTER COLUMN "status" SET DEFAULT 'pending'::"public"."interview_status";--> statement-breakpoint
ALTER TABLE "interviews" ALTER COLUMN "status" SET DATA TYPE "public"."interview_status" USING "status"::"public"."interview_status";--> statement-breakpoint
ALTER TABLE "interviews" ALTER COLUMN "questions_json" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'user'::"public"."user_role";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE "public"."user_role" USING "role"::"public"."user_role";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "status" SET DEFAULT 'pending'::"public"."user_status";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "status" SET DATA TYPE "public"."user_status" USING "status"::"public"."user_status";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "subscription_status" SET DEFAULT 'none'::"public"."subscription_status";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "subscription_status" SET DATA TYPE "public"."subscription_status" USING "subscription_status"::"public"."subscription_status";--> statement-breakpoint
ALTER TABLE "interview_summaries" ADD COLUMN "encouragement" text;--> statement-breakpoint
ALTER TABLE "interview_summaries" ADD COLUMN "readiness_level" varchar(50);