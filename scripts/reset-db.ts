import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

// Load env from .env.local
config({ path: ".env.local" });

async function resetDatabase() {
  const sql = neon(process.env.DATABASE_URL!);

  console.log("Dropping existing tables...");

  // Drop tables in correct order (respect foreign keys)
  await sql`DROP TABLE IF EXISTS interview_summaries CASCADE`;
  await sql`DROP TABLE IF EXISTS answers CASCADE`;
  await sql`DROP TABLE IF EXISTS interviews CASCADE`;
  await sql`DROP TABLE IF EXISTS users CASCADE`;

  console.log("Creating new tables...");

  // Create users table
  await sql`
    CREATE TABLE users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      name VARCHAR(255),
      image_url TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  // Create interviews table
  await sql`
    CREATE TABLE interviews (
      id SERIAL PRIMARY KEY,
      mock_id VARCHAR(36) UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      role VARCHAR(100) NOT NULL,
      experience_level VARCHAR(20) NOT NULL,
      interview_type VARCHAR(50) NOT NULL,
      total_score INTEGER DEFAULT 0,
      status VARCHAR(20) DEFAULT 'pending',
      questions_json TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      completed_at TIMESTAMP
    )
  `;

  // Create answers table
  await sql`
    CREATE TABLE answers (
      id SERIAL PRIMARY KEY,
      interview_id INTEGER REFERENCES interviews(id),
      question_index INTEGER NOT NULL,
      question_text TEXT NOT NULL,
      user_answer TEXT,
      feedback_json TEXT,
      technical_score INTEGER,
      communication_score INTEGER,
      depth_score INTEGER,
      ideal_answer TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  // Create interview_summaries table
  await sql`
    CREATE TABLE interview_summaries (
      id SERIAL PRIMARY KEY,
      interview_id INTEGER REFERENCES interviews(id),
      overall_score INTEGER,
      rating VARCHAR(50),
      strengths_json TEXT,
      weaknesses_json TEXT,
      recommended_topics_json TEXT,
      action_plan TEXT,
      summary_text TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  console.log("Database reset complete!");
}

resetDatabase().catch(console.error);
