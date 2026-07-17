import Redis from "ioredis";
import crypto from "crypto";
import { logger } from "./logger";

// Single lazily-created Redis client shared across the process.
// Using a module-level singleton avoids connection churn under load.
// When running under pm2 cluster mode, each worker has its own connection.
let client: Redis | null = null;
let initialized = false;

function createClient(): Redis {
  const url = process.env.REDIS_URL || "redis://localhost:6379";
  const redis = new Redis(url, {
    // Fail fast rather than block the event loop on an outage.
    maxRetriesPerRequest: 2,
    lazyConnect: false,
    enableOfflineQueue: false,
    // Suppress noisy reconnect storms — ioredis will back off exponentially.
    retryStrategy: (times) => Math.min(times * 200, 2000),
  });

  // Throttle the error log: ioredis emits on every reconnect attempt, which
  // floods the console when Redis is absent (common in local dev). Log the
  // first error, then at most once per minute.
  let lastErrorLoggedAt = 0;
  redis.on("error", (err) => {
    // Connection failure is non-fatal — cache fails open, callers handle misses.
    // Log at warn (not error) so it never triggers the Next.js dev error overlay.
    const now = performance.now();
    if (now - lastErrorLoggedAt > 60_000 || lastErrorLoggedAt === 0) {
      lastErrorLoggedAt = now;
      logger.warn("Redis client error", {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  });

  redis.on("connect", () => {
    logger.info("Redis connected", { url: url.replace(/:[^:@]+@/, ":****@") });
  });

  return redis;
}

/**
 * Returns the shared Redis client, or null when Redis is not configured.
 *
 * Redis is optional: cache and rate-limiting fail open without it. To avoid
 * flooding the console with connection errors in local dev, we only connect
 * when REDIS_URL is explicitly set. Callers must handle a null return.
 */
export function getRedis(): Redis | null {
  if (!initialized) {
    initialized = true;
    if (process.env.REDIS_URL) {
      client = createClient();
    } else {
      logger.info("Redis not configured (REDIS_URL unset) — cache disabled");
    }
  }
  return client;
}

/**
 * Safe GET — returns null on any Redis error. Never throws.
 */
export async function cacheGet<T = unknown>(key: string): Promise<T | null> {
  const redis = getRedis();
  if (!redis) return null;
  try {
    const raw = await redis.get(key);
    if (raw === null) return null;
    return JSON.parse(raw) as T;
  } catch (err) {
    logger.warn("Redis GET failed", { key, error: err instanceof Error ? err.message : String(err) });
    return null;
  }
}

/**
 * Safe SET with TTL — logs and swallows errors. Never throws.
 * Use when cache write is best-effort (e.g. after a successful DB write).
 */
export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  if (ttlSeconds <= 0) {
    logger.warn("cacheSet called with invalid TTL", { key, ttlSeconds });
    return;
  }
  const redis = getRedis();
  if (!redis) return;
  try {
    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch (err) {
    logger.warn("Redis SET failed", { key, error: err instanceof Error ? err.message : String(err) });
  }
}

/**
 * Safe DEL — used for cache invalidation. Never throws.
 */
export async function cacheDel(...keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  const redis = getRedis();
  if (!redis) return;
  try {
    await redis.del(...keys);
  } catch (err) {
    logger.warn("Redis DEL failed", { keys, error: err instanceof Error ? err.message : String(err) });
  }
}

/**
 * Canonical cache-key hash for AI-generation dedupe.
 *
 * Normalizes input to maximize cross-user cache hits:
 *  - Drops null/undefined/empty-string fields
 *  - Lowercases strings
 *  - Sorts array contents alphabetically
 *  - Stable JSON (keys in sorted order)
 *
 * Returns SHA-1 hex digest.
 */
function normalizeValue(v: unknown): unknown {
  if (v === null || v === undefined || v === "") return undefined;
  if (v instanceof Date) return v.toISOString().toLowerCase();
  if (Array.isArray(v)) {
    const arr = v
      .map(normalizeValue)
      .filter((x) => x !== undefined);
    return arr.length
      ? [...arr].sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)))
      : undefined;
  }
  if (typeof v === "object") {
    const obj: Record<string, unknown> = {};
    for (const k of Object.keys(v as Record<string, unknown>).sort((a, b) => a.localeCompare(b))) {
      const normalized = normalizeValue((v as Record<string, unknown>)[k]);
      if (normalized !== undefined) obj[k] = normalized;
    }
    return Object.keys(obj).length ? obj : undefined;
  }
  if (typeof v === "string") return v.toLowerCase();
  return v;
}

export function canonicalKey(params: Record<string, unknown>): string {
  const normalized = normalizeValue(params) as Record<string, unknown>;

  return crypto
    .createHash("sha1")
    .update(JSON.stringify(normalized ?? {}))
    .digest("hex");
}
