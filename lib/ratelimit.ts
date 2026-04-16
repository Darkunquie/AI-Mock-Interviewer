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

export interface RateLimitResult {
  allowed: boolean;
  /** Number of requests attributed to this bucket in the current window. */
  count: number;
  /** How many more requests this key may make before the window rolls. */
  remaining: number;
  /** Unix seconds at which the current window resets. */
  resetSeconds: number;
  /** True if Redis was unreachable and the limiter failed open. */
  degraded?: boolean;
}

/**
 * Check a rate-limit bucket. Atomic across all workers sharing the same Redis.
 *
 * @param key Bucket key (already namespaced, e.g. `rl:1.2.3.4:/api/auth/signin`).
 * @param limit Max requests per window.
 * @param windowMs Window size in milliseconds.
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const windowSeconds = Math.ceil(windowMs / 1000);
  const nowSeconds = Math.floor(Date.now() / 1000);
  const resetSeconds = (Math.floor(nowSeconds / windowSeconds) + 1) * windowSeconds;

  try {
    const result = (await getRedis().eval(
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
      resetSeconds,
    };
  } catch (err) {
    // Fail-open: log loudly and allow. See module docstring.
    logger.error(
      "Rate limiter Redis failure — failing open",
      err instanceof Error ? err : new Error(String(err)),
      { key, limit, windowMs }
    );
    return {
      allowed: true,
      count: 0,
      remaining: limit,
      resetSeconds,
      degraded: true,
    };
  }
}
