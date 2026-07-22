import { getRedis } from "./cache";
import { logger } from "./logger";

/**
 * Per-user daily AI quota — a cost guardrail over the paid Groq/Deepgram calls
 * (interview create/evaluate, transcribe, flashcards, projects). Per-IP rate
 * limits alone don't cap spend: one authenticated user (or a viral spike) can
 * burn the budget from many IPs. This caps *requests per user per UTC day*.
 *
 * Design notes:
 *  - Atomic INCR in Redis, keyed `aiquota:{userId}:{YYYY-MM-DD}` (UTC).
 *  - Fails OPEN on Redis outage (allow) — a cache blip shouldn't take AI down;
 *    the per-IP limiter and the AI_DISABLED kill-switch still apply. Cost
 *    control is best-effort, not authz.
 *  - AI_DISABLED=true is a hard global stop for cost emergencies.
 *  - AI_DAILY_QUOTA sets the per-user/day request budget (default 150).
 */

export interface QuotaResult {
  allowed: boolean;
  used: number;
  limit: number;
  remaining: number;
  /** Set when the global kill-switch blocked the call (vs. quota exhaustion). */
  disabled?: boolean;
}

export interface QuotaOptions {
  /** Units this call consumes (default 1). */
  cost?: number;
  /** Separate daily bucket, e.g. "transcribe" for high-frequency STT. */
  bucket?: string;
  /** Override the per-day limit for this bucket (default AI_DAILY_QUOTA/150). */
  limit?: number;
}

function dailyLimit(override?: number): number {
  if (override && Number.isFinite(override) && override > 0) return override;
  const n = Number.parseInt(process.env.AI_DAILY_QUOTA || "150", 10);
  return Number.isFinite(n) && n > 0 ? n : 150;
}

function utcDayKey(): string {
  // ISO string is always UTC; the date portion is the day bucket.
  return new Date().toISOString().slice(0, 10);
}

/**
 * Count one AI action against the user's daily budget and report whether it's
 * allowed. Pass `bucket`/`limit` to give a high-frequency route (transcribe)
 * its own larger budget separate from the generation budget.
 */
export async function checkAiQuota(userId: number, opts: QuotaOptions = {}): Promise<QuotaResult> {
  const cost = opts.cost ?? 1;
  const limit = dailyLimit(opts.limit);

  // Global kill-switch — cost emergency / provider incident.
  if (process.env.AI_DISABLED === "true") {
    return { allowed: false, used: 0, limit, remaining: 0, disabled: true };
  }

  const redis = getRedis();
  if (!redis) {
    // No Redis — fail open (cost cap is best-effort).
    return { allowed: true, used: 0, limit, remaining: limit };
  }

  const prefix = opts.bucket ? `${opts.bucket}:` : "";
  const key = `aiquota:${prefix}${userId}:${utcDayKey()}`;
  try {
    const used = await redis.incrby(key, cost);
    // Set the TTL once, on the first write of the day (used === cost).
    if (used === cost) {
      // 25h so the bucket outlives the UTC day regardless of when it started.
      await redis.expire(key, 25 * 60 * 60);
    }
    return {
      allowed: used <= limit,
      used,
      limit,
      remaining: Math.max(0, limit - used),
    };
  } catch (err) {
    logger.warn("AI quota check failed — allowing (fail open)", {
      userId,
      error: err instanceof Error ? err.message : String(err),
    });
    return { allowed: true, used: 0, limit, remaining: limit };
  }
}
