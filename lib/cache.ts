import Redis from "ioredis";
import crypto from "crypto";
import { logger } from "./logger";

// Single lazily-created Redis client shared across the process.
// Using a module-level singleton avoids connection churn under load.
// When running under pm2 cluster mode, each worker has its own connection.
let client: Redis | null = null;

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

  redis.on("error", (err) => {
    // Log once per error kind but don't throw — callers must handle misses.
    logger.error("Redis client error", err instanceof Error ? err : new Error(String(err)));
  });

  redis.on("connect", () => {
    logger.info("Redis connected", { url: url.replace(/:[^:@]+@/, ":****@") });
  });

  return redis;
}

/**
 * Returns the shared Redis client. Creates it on first use.
 * Callers should handle connection errors (fail-open or fail-closed per context).
 */
export function getRedis(): Redis {
  if (!client) {
    client = createClient();
  }
  return client;
}

/**
 * Safe GET — returns null on any Redis error. Never throws.
 */
export async function cacheGet<T = unknown>(key: string): Promise<T | null> {
  try {
    const raw = await getRedis().get(key);
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
  try {
    await getRedis().set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch (err) {
    logger.warn("Redis SET failed", { key, error: err instanceof Error ? err.message : String(err) });
  }
}

/**
 * Safe DEL — used for cache invalidation. Never throws.
 */
export async function cacheDel(...keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  try {
    await getRedis().del(...keys);
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
