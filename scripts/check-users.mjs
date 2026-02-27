import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

if (!process.env.DATABASE_URL) {
  console.error("Error: DATABASE_URL environment variable is not set");
  process.exit(1);
}
const sql = neon(process.env.DATABASE_URL);
const users = await sql`SELECT id, email, name, role, status, subscription_status, trial_ends_at FROM users ORDER BY id`;
console.log(JSON.stringify(users, null, 2));
console.log("ADMIN_EMAIL:", process.env.ADMIN_EMAIL || "not set");
