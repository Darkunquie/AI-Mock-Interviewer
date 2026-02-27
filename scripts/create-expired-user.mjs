import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

if (!process.env.DATABASE_URL) {
  console.error("Error: DATABASE_URL environment variable is not set");
  process.exit(1);
}
const sql = neon(process.env.DATABASE_URL);

const password = "Test@1234";
const hashedPassword = await bcrypt.hash(password, 12);

const now = new Date();
const expiredTrialEnd = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000); // expired 1 day ago
const approvedAt = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000); // approved 4 days ago

try {
  await sql`
    INSERT INTO users (email, password, name, phone, role, status, approved_at, trial_ends_at, subscription_status)
    VALUES ('expired@skillforge.com', ${hashedPassword}, 'Expired User', '1111111111', 'user', 'approved', ${approvedAt.toISOString()}, ${expiredTrialEnd.toISOString()}, 'trial')
    ON CONFLICT (email) DO UPDATE SET
      password = ${hashedPassword},
      status = 'approved',
      approved_at = ${approvedAt.toISOString()},
      trial_ends_at = ${expiredTrialEnd.toISOString()},
      subscription_status = 'trial'
  `;
  console.log("Expired user created: expired@skillforge.com");
  console.log("Trial ended:", expiredTrialEnd.toISOString());
} catch (e) {
  console.error("Error:", e.message);
}

console.log("\n--- Expired Trial Credentials ---");
console.log("Email:    expired@skillforge.com");
console.log("Password: Test@1234");
