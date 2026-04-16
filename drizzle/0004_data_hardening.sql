-- C1 + C2: JSON columns → jsonb, varchar enum columns → pgEnum types.
-- Idempotent: every change is wrapped in a DO block that skips if already applied.
-- Maintenance window: run during low-traffic period; no downtime required.
--
-- PRE-FLIGHT CHECKS — run these SELECT statements before applying:
--   Malformed JSON guard:
--     SELECT id FROM interviews WHERE tech_stack IS NOT NULL AND left(tech_stack::text,1) NOT IN ('[','n');
--     SELECT id FROM interviews WHERE topics IS NOT NULL AND left(topics::text,1) NOT IN ('[','n');
--     SELECT id FROM interviews WHERE questions_json IS NOT NULL AND left(questions_json::text,1) <> '{';
--     SELECT id FROM answers WHERE feedback_json IS NOT NULL AND left(feedback_json::text,1) <> '{';
--     SELECT id FROM generated_projects WHERE left(projects_json::text,1) <> '[';
--   Enum value guard:
--     SELECT DISTINCT role FROM users;               -- expect: user, admin
--     SELECT DISTINCT status FROM users;             -- expect: pending, approved, rejected
--     SELECT DISTINCT subscription_status FROM users;-- expect: none, trial, active, expired
--     SELECT DISTINCT interview_type FROM interviews;-- expect: technical, hr, behavioral
--     SELECT DISTINCT mode FROM interviews;          -- expect: interview, practice
--     SELECT DISTINCT status FROM interviews;        -- expect: pending, in_progress, completed
--
-- ROLLBACK (if needed):
--   ALTER TABLE users ALTER COLUMN role TYPE varchar(20) USING role::text;
--   -- (repeat for each altered column, then DROP TYPE type_name CASCADE)

-- =============================================================================
-- C2: Create pgEnum types
-- =============================================================================

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('user', 'admin');
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint

DO $$ BEGIN
  CREATE TYPE user_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint

DO $$ BEGIN
  CREATE TYPE subscription_status AS ENUM ('none', 'trial', 'active', 'expired');
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint

DO $$ BEGIN
  CREATE TYPE interview_type AS ENUM ('technical', 'hr', 'behavioral');
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint

DO $$ BEGIN
  CREATE TYPE interview_mode AS ENUM ('interview', 'practice');
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint

DO $$ BEGIN
  CREATE TYPE interview_status AS ENUM ('pending', 'in_progress', 'completed');
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint

-- =============================================================================
-- C2: Migrate varchar enum columns → pgEnum (skip if already converted)
-- =============================================================================

DO $$ BEGIN
  IF (SELECT data_type FROM information_schema.columns
      WHERE table_name='users' AND column_name='role') = 'character varying' THEN
    ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
    ALTER TABLE "users" ALTER COLUMN "role" TYPE user_role USING role::user_role;
    ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'user'::user_role;
  END IF;
END $$;--> statement-breakpoint

DO $$ BEGIN
  IF (SELECT data_type FROM information_schema.columns
      WHERE table_name='users' AND column_name='status') = 'character varying' THEN
    ALTER TABLE "users" ALTER COLUMN "status" DROP DEFAULT;
    ALTER TABLE "users" ALTER COLUMN "status" TYPE user_status USING status::user_status;
    ALTER TABLE "users" ALTER COLUMN "status" SET DEFAULT 'pending'::user_status;
  END IF;
END $$;--> statement-breakpoint

DO $$ BEGIN
  IF (SELECT data_type FROM information_schema.columns
      WHERE table_name='users' AND column_name='subscription_status') = 'character varying' THEN
    ALTER TABLE "users" ALTER COLUMN "subscription_status" DROP DEFAULT;
    ALTER TABLE "users" ALTER COLUMN "subscription_status" TYPE subscription_status USING subscription_status::subscription_status;
    ALTER TABLE "users" ALTER COLUMN "subscription_status" SET DEFAULT 'none'::subscription_status;
  END IF;
END $$;--> statement-breakpoint

DO $$ BEGIN
  IF (SELECT data_type FROM information_schema.columns
      WHERE table_name='interviews' AND column_name='interview_type') = 'character varying' THEN
    ALTER TABLE "interviews" ALTER COLUMN "interview_type" TYPE interview_type USING interview_type::interview_type;
  END IF;
END $$;--> statement-breakpoint

DO $$ BEGIN
  IF (SELECT data_type FROM information_schema.columns
      WHERE table_name='interviews' AND column_name='mode') = 'character varying' THEN
    ALTER TABLE "interviews" ALTER COLUMN "mode" DROP DEFAULT;
    ALTER TABLE "interviews" ALTER COLUMN "mode" TYPE interview_mode USING mode::interview_mode;
    ALTER TABLE "interviews" ALTER COLUMN "mode" SET DEFAULT 'interview'::interview_mode;
  END IF;
END $$;--> statement-breakpoint

DO $$ BEGIN
  IF (SELECT data_type FROM information_schema.columns
      WHERE table_name='interviews' AND column_name='status') = 'character varying' THEN
    ALTER TABLE "interviews" ALTER COLUMN "status" DROP DEFAULT;
    ALTER TABLE "interviews" ALTER COLUMN "status" TYPE interview_status USING status::interview_status;
    ALTER TABLE "interviews" ALTER COLUMN "status" SET DEFAULT 'pending'::interview_status;
  END IF;
END $$;--> statement-breakpoint

-- =============================================================================
-- C1: Convert text JSON columns → jsonb (skip if already converted)
-- =============================================================================

DO $$ BEGIN
  IF (SELECT data_type FROM information_schema.columns
      WHERE table_name='interviews' AND column_name='tech_stack') = 'text' THEN
    ALTER TABLE "interviews"
      ALTER COLUMN "tech_stack" TYPE jsonb
      USING CASE WHEN tech_stack IS NULL THEN NULL ELSE tech_stack::jsonb END;
  END IF;
END $$;--> statement-breakpoint

DO $$ BEGIN
  IF (SELECT data_type FROM information_schema.columns
      WHERE table_name='interviews' AND column_name='topics') = 'text' THEN
    ALTER TABLE "interviews"
      ALTER COLUMN "topics" TYPE jsonb
      USING CASE WHEN topics IS NULL THEN NULL ELSE topics::jsonb END;
  END IF;
END $$;--> statement-breakpoint

DO $$ BEGIN
  IF (SELECT data_type FROM information_schema.columns
      WHERE table_name='interviews' AND column_name='questions_json') = 'text' THEN
    ALTER TABLE "interviews"
      ALTER COLUMN "questions_json" TYPE jsonb
      USING CASE WHEN questions_json IS NULL THEN NULL ELSE questions_json::jsonb END;
  END IF;
END $$;--> statement-breakpoint

DO $$ BEGIN
  IF (SELECT data_type FROM information_schema.columns
      WHERE table_name='answers' AND column_name='feedback_json') = 'text' THEN
    ALTER TABLE "answers"
      ALTER COLUMN "feedback_json" TYPE jsonb
      USING CASE WHEN feedback_json IS NULL THEN NULL ELSE feedback_json::jsonb END;
  END IF;
END $$;--> statement-breakpoint

DO $$ BEGIN
  IF (SELECT data_type FROM information_schema.columns
      WHERE table_name='interview_summaries' AND column_name='strengths_json') = 'text' THEN
    ALTER TABLE "interview_summaries"
      ALTER COLUMN "strengths_json" TYPE jsonb
      USING CASE WHEN strengths_json IS NULL THEN NULL ELSE strengths_json::jsonb END;
  END IF;
END $$;--> statement-breakpoint

DO $$ BEGIN
  IF (SELECT data_type FROM information_schema.columns
      WHERE table_name='interview_summaries' AND column_name='weaknesses_json') = 'text' THEN
    ALTER TABLE "interview_summaries"
      ALTER COLUMN "weaknesses_json" TYPE jsonb
      USING CASE WHEN weaknesses_json IS NULL THEN NULL ELSE weaknesses_json::jsonb END;
  END IF;
END $$;--> statement-breakpoint

DO $$ BEGIN
  IF (SELECT data_type FROM information_schema.columns
      WHERE table_name='interview_summaries' AND column_name='recommended_topics_json') = 'text' THEN
    ALTER TABLE "interview_summaries"
      ALTER COLUMN "recommended_topics_json" TYPE jsonb
      USING CASE WHEN recommended_topics_json IS NULL THEN NULL ELSE recommended_topics_json::jsonb END;
  END IF;
END $$;--> statement-breakpoint

DO $$ BEGIN
  IF (SELECT data_type FROM information_schema.columns
      WHERE table_name='generated_projects' AND column_name='projects_json') = 'text' THEN
    ALTER TABLE "generated_projects"
      ALTER COLUMN "projects_json" TYPE jsonb
      USING projects_json::jsonb;
  END IF;
END $$;
