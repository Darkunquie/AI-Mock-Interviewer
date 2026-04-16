-- SUPERSEDED by 0005_same_vindicator.sql (drizzle-kit canonical).
-- Kept for reference; do NOT apply via drizzle-kit migrate.
-- Persist AI-generated encouragement + readinessLevel on interview_summaries.
-- Previously dropped on insert, so cached summary returns always had them blank.
-- Idempotent: re-running migration leaves schema untouched if already applied.
ALTER TABLE "interview_summaries" ADD COLUMN IF NOT EXISTS "encouragement" text;--> statement-breakpoint
ALTER TABLE "interview_summaries" ADD COLUMN IF NOT EXISTS "readiness_level" varchar(50);
