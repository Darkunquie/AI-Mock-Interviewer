import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@/utils/schema";
import { logger } from "./logger";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const parsedPoolMax = Number.parseInt(process.env.DB_POOL_MAX || "5", 10);
const poolMax = Number.isNaN(parsedPoolMax) || parsedPoolMax <= 0 ? 5 : parsedPoolMax;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : false,
  max: poolMax,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on("error", (err) => {
  logger.error("PostgreSQL pool error", err);
});

// Verify DB is reachable at startup
pool.query("SELECT 1").catch((err) => {
  logger.error("PostgreSQL unreachable at startup", err);
});

export const db = drizzle(pool, { schema });

export default db;
