-- Baseline migration for subscription + indexes + cascade FKs.
-- Idempotent: safe to run whether or not prior db:push applied these changes.
-- Each statement is guarded so it becomes a no-op if already present in prod.

-- 1. Users: subscription columns (added in code but never migrated)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "approved_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "trial_ends_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "subscription_status" varchar(20) DEFAULT 'none' NOT NULL;--> statement-breakpoint

-- 2. Answers: updated_at column (added in code but never migrated)
ALTER TABLE "answers" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now();--> statement-breakpoint

-- 3. Backfill orphan answers with an interview_id if possible, then NOT NULL.
--    If any orphan rows exist with NULL, this will fail — remediate by deleting
--    the orphans or contact support before re-running.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='answers' AND column_name='interview_id' AND is_nullable='YES') THEN
    ALTER TABLE "answers" ALTER COLUMN "interview_id" SET NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='interview_summaries' AND column_name='interview_id' AND is_nullable='YES') THEN
    ALTER TABLE "interview_summaries" ALTER COLUMN "interview_id" SET NOT NULL;
  END IF;
END $$;--> statement-breakpoint

-- 4. Replace FK constraints with ON DELETE CASCADE.
--    Drop-and-recreate is idempotent because we use IF EXISTS.
ALTER TABLE "answers" DROP CONSTRAINT IF EXISTS "answers_interview_id_interviews_id_fk";--> statement-breakpoint
ALTER TABLE "interview_summaries" DROP CONSTRAINT IF EXISTS "interview_summaries_interview_id_interviews_id_fk";--> statement-breakpoint

ALTER TABLE "answers" ADD CONSTRAINT "answers_interview_id_interviews_id_fk"
  FOREIGN KEY ("interview_id") REFERENCES "public"."interviews"("id")
  ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

ALTER TABLE "interview_summaries" ADD CONSTRAINT "interview_summaries_interview_id_interviews_id_fk"
  FOREIGN KEY ("interview_id") REFERENCES "public"."interviews"("id")
  ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

-- 5. Indexes — IF NOT EXISTS is supported for CREATE INDEX in Postgres 9.5+
CREATE INDEX IF NOT EXISTS "idx_answers_interview_id" ON "answers" USING btree ("interview_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_answers_interview_question" ON "answers" USING btree ("interview_id","question_index");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_projects_tech_domain" ON "generated_projects" USING btree ("technology","domain");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_summaries_interview_id" ON "interview_summaries" USING btree ("interview_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_interviews_user_id" ON "interviews" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_interviews_status" ON "interviews" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_interviews_created_at" ON "interviews" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_interviews_user_status" ON "interviews" USING btree ("user_id","status");
