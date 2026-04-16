// LOCAL DEV ONLY.
// Dumps user PII (email, name) to stdout — NOT safe to run where logs are
// captured/persisted (CI runners, shared servers, log aggregators).
// GDPR/CCPA: treat output as sensitive. Delete terminal scrollback after use.
import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

if (process.env.NODE_ENV === "production") {
  console.error("Refusing to run in production. This script dumps user PII.");
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error("Error: DATABASE_URL environment variable is not set");
  process.exit(1);
}
const sql = neon(process.env.DATABASE_URL);
try {
  const users = await sql`SELECT id, email, name, role, status, subscription_status, trial_ends_at FROM users ORDER BY id`;
  console.log(JSON.stringify(users, null, 2));
  console.log("ADMIN_EMAIL:", process.env.ADMIN_EMAIL || "not set");
} catch (error) {
  console.error("Error querying users:", error.message);
  process.exit(1);
}