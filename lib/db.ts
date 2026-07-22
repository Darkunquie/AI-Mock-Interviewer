import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@/utils/schema";
import { logger } from "./logger";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const parsedPoolMax = Number.parseInt(process.env.DB_POOL_MAX || "5", 10);
const poolMax = Number.isNaN(parsedPoolMax) || parsedPoolMax <= 0 ? 5 : parsedPoolMax;

// node-postgres (TCP) driver — the proven production path. `keepAlive` keeps the
// socket warm so an idle serverless DB is less likely to drop the connection,
// and a slightly longer connect timeout gives a cold compute time to wake.
// TLS: when DATABASE_SSL=true we verify the server certificate by default
// (rejectUnauthorized: true) so the DB link can't be silently MITM'd. Neon's
// certs chain to a public CA in Node's default trust store, so no custom CA is
// needed. Escape hatch: set DATABASE_SSL_INSECURE=true ONLY if a proxy/self-
// signed cert makes verification impossible — it disables MITM protection.
const sslConfig =
  process.env.DATABASE_SSL === "true"
    ? { rejectUnauthorized: process.env.DATABASE_SSL_INSECURE !== "true" }
    : false;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: sslConfig,
  max: poolMax,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
  keepAlive: true,
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
