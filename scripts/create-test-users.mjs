import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL);

const password = "Test@1234";
const hashedPassword = await bcrypt.hash(password, 12);

// Create test admin
try {
  await sql`
    INSERT INTO users (email, password, name, phone, role, status, subscription_status)
    VALUES ('testadmin@skillforge.com', ${hashedPassword}, 'Test Admin', '1234567890', 'admin', 'approved', 'active')
    ON CONFLICT (email) DO UPDATE SET password = ${hashedPassword}, role = 'admin', status = 'approved'
  `;
  console.log("Admin created: testadmin@skillforge.com");
} catch (e) {
  console.error("Admin error:", e.message);
}

// Create test user (with 3-day trial)
const now = new Date();
const trialEnd = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

try {
  await sql`
    INSERT INTO users (email, password, name, phone, role, status, approved_at, trial_ends_at, subscription_status)
    VALUES ('testuser@skillforge.com', ${hashedPassword}, 'Test User', '9876543210', 'user', 'approved', ${now.toISOString()}, ${trialEnd.toISOString()}, 'trial')
    ON CONFLICT (email) DO UPDATE SET password = ${hashedPassword}, status = 'approved', approved_at = ${now.toISOString()}, trial_ends_at = ${trialEnd.toISOString()}, subscription_status = 'trial'
  `;
  console.log("User created: testuser@skillforge.com");
} catch (e) {
  console.error("User error:", e.message);
}

console.log("\n--- Test Credentials ---");
console.log("Admin:  testadmin@skillforge.com / Test@1234");
console.log("User:   testuser@skillforge.com  / Test@1234");
console.log("Trial expires:", trialEnd.toISOString());
