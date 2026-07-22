import { getRedis } from "./cache";
import { logger } from "./logger";

/**
 * Sliding-Window-Counter rate limiter using a single EVAL for atomicity.
 *
 * Why Sliding Window Counter (over Fixed Window / Sliding Window Log):
 *  - Near-exact accuracy (weighted avg of previous + current window)
 *  - Low memory: 2 keys per client (vs O(n) for sliding log)
 *  - Cluster-safe under pm2 (all workers hit Redis, not process memory)
 *  - See RESEARCH_REPORT.md §5 for full rationale
 *
 * Redis is single-threaded; Lua runs atomically — no TOCTOU race.
 *
 * Fail-open on Redis outage: if EVAL throws, we log loudly and allow the
 * request. Better to serve traffic for a few minutes than lock out all users
 * during a cache outage. This is the OPPOSITE of the subscription guard
 * (which fails closed) because the trust model is different: rate limits are
 * anti-abuse, subscriptions are authz.
 */

// Return shape: [allowed, usedInWindow, remaining]
// allowed = 1 or 0; usedInWindow = integer count; remaining = limit - used
const SLIDING_WINDOW_COUNTER_LUA = `
local base_key = KEYS[1]
local limit = tonumber(ARGV[1])
local window_seconds = tonumber(ARGV[2])
local now_seconds = tonumber(ARGV[3])

local current_window = math.floor(now_seconds / window_seconds)
local previous_window = current_window - 1
local elapsed_ratio = (now_seconds % window_seconds) / window_seconds

local current_key = base_key .. ':' .. current_window
local previous_key = base_key .. ':' .. previous_window

local current_count = tonumber(redis.call('GET', current_key) or 0)
local previous_count = tonumber(redis.call('GET', previous_key) or 0)

-- Weighted estimate: the portion of previous window still "in scope"
-- plus everything from current window so far.
local estimated = previous_count * (1 - elapsed_ratio) + current_count

if estimated < limit then
  local new_count = redis.call('INCR', current_key)
  -- Keep current key alive for 2x window length so previous_key lookups work.
  redis.call('EXPIRE', current_key, math.ceil(window_seconds * 2))
  local used = math.floor(estimated) + 1
  return {1, used, math.max(0, limit - used)}
else
  return {0, math.floor(estimated), 0}
end
`;

/**
 * In-process fixed-window fallback used when Redis is unavailable AND the caller
 * asked to fail closed (failMode="fallback"). Per pm2 worker, so it's weaker than
 * the shared Redis limiter (an attacker spread across N workers gets N× the
 * limit) — but N× is vastly better than the ∞ that fail-open gives on auth
 * routes during a Redis outage. Intended for signin/signup only.
 */
type MemBucket = { count: number; resetAt: number };
const memBuckets = new Map<string, MemBucket>();

function memoryRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();

  // Opportunistic sweep so the map can't grow unbounded under a spoofed-key flood.
  if (memBuckets.size > 5000) {
    for (const [k, b] of memBuckets) {
      if (b.resetAt <= now) memBuckets.delete(k);
    }
  }

  let bucket = memBuckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + windowMs };
    memBuckets.set(key, bucket);
  }
  bucket.count += 1;

  return {
    allowed: bucket.count <= limit,
    count: bucket.count,
    remaining: Math.max(0, limit - bucket.count),
    resetEpochSeconds: Math.ceil(bucket.resetAt / 1000),
    degraded: true,
  };
}

/** How a bucket behaves when Redis is unreachable. */
export type FailMode = "open" | "fallback";

export interface RateLimitResult {
  allowed: boolean;
  /** Number of requests attributed to this bucket in the current window. */
  count: number;
  /** How many more requests this key may make before the window rolls. */
  remaining: number;
  /** Unix seconds at which the current window resets. */
  resetEpochSeconds: number;
  /** True if Redis was unreachable and the limiter failed open. */
  degraded?: boolean;
}

/**
 * Check a rate-limit bucket. Atomic across all workers sharing the same Redis.
 *
 * @param key Bucket key (already namespaced, e.g. `rl:1.2.3.4:/api/auth/signin`).
 * @param limit Max requests per window.
 * @param windowMs Window size in milliseconds.
 * @param failMode On Redis outage: "open" (allow — default, anti-abuse routes)
 *   or "fallback" (use the per-worker in-memory limiter — auth routes).
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  failMode: FailMode = "open"
): Promise<RateLimitResult> {
  // Guard against misconfiguration. windowMs <= 0 divides by zero in the
  // Lua script; limit <= 0 would block every request silently. NaN/Infinity
  // rejected too. Throws (programmer error), not fail-open.
  if (
    !Number.isFinite(limit) || limit <= 0 ||
    !Number.isFinite(windowMs) || windowMs <= 0
  ) {
    throw new Error(`Invalid rate limit params: limit=${limit}, windowMs=${windowMs}`);
  }
  const windowSeconds = Math.ceil(windowMs / 1000);
  const nowSeconds = Math.floor(Date.now() / 1000);
  const resetEpochSeconds = (Math.floor(nowSeconds / windowSeconds) + 1) * windowSeconds;

  const redis = getRedis();
  if (!redis) {
    // Redis not configured. Auth routes fall back to the in-memory limiter;
    // everything else fails open (rate limiting disabled).
    if (failMode === "fallback") return memoryRateLimit(key, limit, windowMs);
    return {
      allowed: true,
      count: 0,
      remaining: limit,
      resetEpochSeconds,
      degraded: true,
    };
  }

  try {
    const result = (await redis.eval(
      SLIDING_WINDOW_COUNTER_LUA,
      1,
      key,
      String(limit),
      String(windowSeconds),
      String(nowSeconds)
    )) as [number, number, number];

    const [allowedFlag, count, remaining] = result;
    return {
      allowed: allowedFlag === 1,
      count,
      remaining,
      resetEpochSeconds,
    };
  } catch (err) {
    // Redis errored. Auth routes fail closed via the in-memory fallback;
    // everything else fails open. See module docstring.
    logger.error(
      `Rate limiter Redis failure — failing ${failMode === "fallback" ? "closed (in-memory)" : "open"}`,
      err instanceof Error ? err : new Error(String(err)),
      { key, limit, windowMs }
    );
    if (failMode === "fallback") return memoryRateLimit(key, limit, windowMs);
    return {
      allowed: true,
      count: 0,
      remaining: limit,
      resetEpochSeconds,
      degraded: true,
    };
  }
}
