-- Persist AI-generated encouragement + readinessLevel on interview_summaries.
-- Previously dropped on insert, so cached summary returns always had them blank.
-- Idempotent: re-running migration leaves schema untouched if already applied.
ALTER TABLE "interview_summaries" ADD COLUMN IF NOT EXISTS "encouragement" text;--> statement-breakpoint
ALTER TABLE "interview_summaries" ADD COLUMN IF NOT EXISTS "readiness_level" varchar(50);
