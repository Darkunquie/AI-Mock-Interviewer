import pg from "pg";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

if (!process.env.DATABASE_URL) {
  console.error("Error: DATABASE_URL environment variable is not set");
  process.exit(1);
}

if (process.env.NODE_ENV === "production") {
  console.error("Error: This script should not be run in production");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const password = "Test@1234";
const hashedPassword = await bcrypt.hash(password, 12);

const now = new Date();
const approvedAt = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000);

try {
  await pool.query(
    `INSERT INTO users (email, password, name, phone, role, status, approved_at)
     VALUES ($1, $2, 'Test Expired User', '1111111111', 'user', 'approved', $3)
     ON CONFLICT (email) DO UPDATE SET password = $2, status = 'approved', approved_at = $3`,
    ["expired@skillforge.com", hashedPassword, approvedAt.toISOString()]
  );
  console.log("Test user created: expired@skillforge.com");
} catch (e) {
  console.error("Error:", e.message);
  process.exit(1);
}

console.log("\n--- Test Credentials ---");
console.log("Email:    expired@skillforge.com");
console.log("Password: Test@1234");

await pool.end();
