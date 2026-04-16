-- Baseline migration for subscription + indexes + cascade FKs.
-- Idempotent: safe to run whether or not prior db:push applied these changes.
-- Each statement is guarded so it becomes a no-op if already present in prod.

-- 1. Users: subscription columns (added in code but never migrated)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "approved_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "trial_ends_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "subscription_status" varchar(20) DEFAULT 'none' NOT NULL;--> statement-breakpoint

-- 2. Answers: updated_at column (added in code but never migrated)
--    DEFAULT now() only fires on INSERT. Schema also uses Drizzle
--    `$onUpdate(() => new Date())` which runs at ORM layer — raw SQL
--    updates or other clients bypass it. Install DB-level trigger below
--    as defense-in-depth so updated_at is always current.
ALTER TABLE "answers" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now();--> statement-breakpoint

-- Shared trigger function — reusable for any table with updated_at column.
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updated_at" = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;--> statement-breakpoint

-- Attach trigger to answers.updated_at. Drop-then-create so re-running
-- migration stays idempotent without CREATE TRIGGER IF NOT EXISTS (pg 14+ only).
DROP TRIGGER IF EXISTS "answers_set_updated_at" ON "answers";--> statement-breakpoint
CREATE TRIGGER "answers_set_updated_at"
BEFORE UPDATE ON "answers"
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();--> statement-breakpoint

-- 3. Enforce interview_id NOT NULL on answers + interview_summaries.
--    Orphan rows (interview_id IS NULL) are deleted first — they have no
--    parent interview and cannot be surfaced anywhere in the app. This
--    makes the migration succeed regardless of historical data state.
--    Data-loss note: if you need to preserve orphans, abort this migration
--    and back up the rows via `SELECT ... WHERE interview_id IS NULL` first.
DELETE FROM "answers" WHERE "interview_id" IS NULL;--> statement-breakpoint
DELETE FROM "interview_summaries" WHERE "interview_id" IS NULL;--> statement-breakpoint
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

-- ADD CONSTRAINT has no IF NOT EXISTS in Postgres. Wrap in DO block
-- with pg_constraint check so re-running is safe even if the DROP
-- CONSTRAINT above was a no-op and the FK still exists.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'answers_interview_id_interviews_id_fk'
  ) THEN
    ALTER TABLE "answers" ADD CONSTRAINT "answers_interview_id_interviews_id_fk"
      FOREIGN KEY ("interview_id") REFERENCES "public"."interviews"("id")
      ON DELETE cascade ON UPDATE no action;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'interview_summaries_interview_id_interviews_id_fk'
  ) THEN
    ALTER TABLE "interview_summaries" ADD CONSTRAINT "interview_summaries_interview_id_interviews_id_fk"
      FOREIGN KEY ("interview_id") REFERENCES "public"."interviews"("id")
      ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;--> statement-breakpoint

-- 5. Indexes — IF NOT EXISTS is supported for CREATE INDEX in Postgres 9.5+
--    Unique indexes require no duplicates. Dedupe prior to creation so the
--    migration is safe on historical data. Retention rule = keep row with
--    largest "id" (serial PK — chronological in practice and stable across
--    VACUUM/CLUSTER, unlike ctid). NULL-safe via IS NOT DISTINCT FROM so
--    rows with NULL key columns still dedupe correctly.
--
--    Data-loss note: these DELETEs drop older duplicate rows. Back them up
--    first if any duplicate represents distinct user-visible state.

-- answers: keep latest row per (interview_id, question_index)
DELETE FROM "answers" a
USING "answers" b
WHERE a."interview_id" IS NOT DISTINCT FROM b."interview_id"
  AND a."question_index" IS NOT DISTINCT FROM b."question_index"
  AND a."id" < b."id";--> statement-breakpoint

-- generated_projects: keep latest row per (technology, domain)
DELETE FROM "generated_projects" a
USING "generated_projects" b
WHERE a."technology" IS NOT DISTINCT FROM b."technology"
  AND a."domain" IS NOT DISTINCT FROM b."domain"
  AND a."id" < b."id";--> statement-breakpoint

-- interview_summaries: keep latest row per interview_id
DELETE FROM "interview_summaries" a
USING "interview_summaries" b
WHERE a."interview_id" IS NOT DISTINCT FROM b."interview_id"
  AND a."id" < b."id";--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "idx_answers_interview_id" ON "answers" USING btree ("interview_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_answers_interview_question" ON "answers" USING btree ("interview_id","question_index");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_projects_tech_domain" ON "generated_projects" USING btree ("technology","domain");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_summaries_interview_id" ON "interview_summaries" USING btree ("interview_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_interviews_user_id" ON "interviews" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_interviews_status" ON "interviews" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_interviews_created_at" ON "interviews" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_interviews_user_status" ON "interviews" USING btree ("user_id","status");--> statement-breakpoint

-- 6. Add FK interviews.user_id -> users.id (ON DELETE CASCADE).
--    Prevents orphan interviews when a user is deleted directly in DB.
--    Cascade: deleting a user removes their interviews + (via FK chain)
--    answers + summaries. Aligns with GDPR right-to-be-forgotten.
--
--    Orphan cleanup: delete any interview rows whose user_id no longer
--    exists in users. Without this, ADD CONSTRAINT fails.
DELETE FROM "interviews"
WHERE "user_id" NOT IN (SELECT "id" FROM "users");--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'interviews_user_id_users_id_fk'
  ) THEN
    ALTER TABLE "interviews" ADD CONSTRAINT "interviews_user_id_users_id_fk"
      FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
      ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
