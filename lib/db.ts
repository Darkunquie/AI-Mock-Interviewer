import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import * as schema from "@/utils/schema";
import { logger } from "./logger";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Neon's serverless driver talks to the database over a WebSocket, which
// reconnects transparently and tolerates Neon's auto-suspend/wake. This avoids
// the "Connection terminated unexpectedly" / stale-pool 500s that the plain `pg`
// TCP pool hit whenever the free-tier compute suspended after idle.
// In Node we must supply a WebSocket implementation.
neonConfig.webSocketConstructor = ws;

const parsedPoolMax = Number.parseInt(process.env.DB_POOL_MAX || "5", 10);
const poolMax = Number.isNaN(parsedPoolMax) || parsedPoolMax <= 0 ? 5 : parsedPoolMax;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: poolMax,
  // Recycle idle connections well before Neon would drop them.
  idleTimeoutMillis: 20_000,
  // Generous window so a cold Neon compute has time to wake.
  connectionTimeoutMillis: 20_000,
});

pool.on("error", (err: unknown) => {
  // A dropped idle connection is expected with a suspending serverless DB; the
  // driver reconnects on the next query, so just log it.
  logger.warn("Neon pool error (will reconnect)", {
    error: err instanceof Error ? err.message : String(err),
  });
});

export const db = drizzle(pool, { schema });

export default db;
