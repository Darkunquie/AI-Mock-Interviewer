CREATE TABLE "answers" (
	"id" serial PRIMARY KEY NOT NULL,
	"interview_id" integer,
	"question_index" integer NOT NULL,
	"question_text" text NOT NULL,
	"user_answer" text,
	"feedback_json" text,
	"technical_score" integer,
	"communication_score" integer,
	"depth_score" integer,
	"ideal_answer" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "generated_projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"technology" varchar(255) NOT NULL,
	"domain" varchar(255) NOT NULL,
	"projects_json" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "interview_summaries" (
	"id" serial PRIMARY KEY NOT NULL,
	"interview_id" integer,
	"overall_score" integer,
	"rating" varchar(50),
	"strengths_json" text,
	"weaknesses_json" text,
	"recommended_topics_json" text,
	"action_plan" text,
	"summary_text" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "interviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"mock_id" varchar(36) NOT NULL,
	"user_id" integer NOT NULL,
	"role" varchar(100) NOT NULL,
	"experience_level" varchar(20) NOT NULL,
	"interview_type" varchar(50) NOT NULL,
	"duration" varchar(10) DEFAULT '15',
	"mode" varchar(20) DEFAULT 'interview',
	"tech_stack" text,
	"topics" text,
	"total_score" integer DEFAULT 0,
	"status" varchar(20) DEFAULT 'pending',
	"questions_json" text,
	"created_at" timestamp DEFAULT now(),
	"completed_at" timestamp,
	CONSTRAINT "interviews_mock_id_unique" UNIQUE("mock_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" varchar(255) NOT NULL,
	"name" varchar(255),
	"phone" varchar(20),
	"image_url" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "answers" ADD CONSTRAINT "answers_interview_id_interviews_id_fk" FOREIGN KEY ("interview_id") REFERENCES "public"."interviews"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_summaries" ADD CONSTRAINT "interview_summaries_interview_id_interviews_id_fk" FOREIGN KEY ("interview_id") REFERENCES "public"."interviews"("id") ON DELETE no action ON UPDATE no action;