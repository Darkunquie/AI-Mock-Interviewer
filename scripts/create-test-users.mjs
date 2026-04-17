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

// Create test admin
try {
  await pool.query(
    `INSERT INTO users (email, password, name, phone, role, status)
     VALUES ($1, $2, 'Test Admin', '1234567890', 'admin', 'approved')
     ON CONFLICT (email) DO UPDATE SET password = $2, role = 'admin', status = 'approved'`,
    ["testadmin@skillforge.com", hashedPassword]
  );
  console.log("Admin created: testadmin@skillforge.com");
} catch (e) {
  console.error("Admin error:", e.message);
}

// Create test user
const now = new Date();

try {
  await pool.query(
    `INSERT INTO users (email, password, name, phone, role, status, approved_at)
     VALUES ($1, $2, 'Test User', '9876543210', 'user', 'approved', $3)
     ON CONFLICT (email) DO UPDATE SET password = $2, role = 'user', status = 'approved', approved_at = $3`,
    ["testuser@skillforge.com", hashedPassword, now.toISOString()]
  );
  console.log("User created: testuser@skillforge.com");
} catch (e) {
  console.error("User error:", e.message);
}

console.log("\n--- Test Credentials ---");
console.log("Admin:  testadmin@skillforge.com / Test@1234");
console.log("User:   testuser@skillforge.com  / Test@1234");

await pool.end();
