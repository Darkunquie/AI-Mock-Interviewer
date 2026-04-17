import { getCurrentUser, type AuthUser } from "./auth";
import { db } from "./db";
import { users } from "@/utils/schema";
import { eq } from "drizzle-orm";
import { cacheGet, cacheSet, cacheDel } from "./cache";

type SubscriptionResult =
  | { user: AuthUser; allowed: true; reason?: undefined }
  | { user: AuthUser; allowed: false; reason: string }
  | { user: null; allowed: false; reason: string };

// Subscription tier per TARGET_ARCHITECTURE §5.
// 60s TTL is short enough that expiration-time transitions feel real-time
// while still cutting DB hits by >90% on hot pages.
const SUB_CACHE_TTL = 60;
const SUB_CACHE_PREFIX = "sub:";

interface CachedSubUser {
  subscriptionStatus: string | null;
  trialEndsAt: string | null; // ISO
}

function subCacheKey(userId: number): string {
  return `${SUB_CACHE_PREFIX}${userId}`;
}

/**
 * Invalidate the subscription cache for a user.
 * Must be called after admin approve / extend-trial / reject / status change.
 */
export async function invalidateSubscriptionCache(userId: number): Promise<void> {
  await cacheDel(subCacheKey(userId));
}

async function loadSubUser(userId: number): Promise<CachedSubUser | null> {
  const cached = await cacheGet<CachedSubUser>(subCacheKey(userId));
  if (cached) return cached;

  const [dbUser] = await db
    .select({
      subscriptionStatus: users.subscriptionStatus,
      trialEndsAt: users.trialEndsAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!dbUser) return null;

  const value: CachedSubUser = {
    subscriptionStatus: dbUser.subscriptionStatus,
    trialEndsAt: dbUser.trialEndsAt ? dbUser.trialEndsAt.toISOString() : null,
  };
  // Fire-and-forget: cache failure shouldn't block returning valid data
  cacheSet(subCacheKey(userId), value, SUB_CACHE_TTL).catch(() => {});
  return value;
}

/**
 * Check if the current user has an active subscription or trial.
 * Admin users always have full access.
 * 
 * Returns { user, allowed, reason } — use in middleware or route guards.
 */
export async function requireActiveSubscription(): Promise<SubscriptionResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { user: null, allowed: false, reason: "unauthorized" };
  }

  // Admin always has full access
  if (user.role === "admin") {
    return { user, allowed: true };
  }

  const dbUser = await loadSubUser(user.id);
  if (!dbUser) {
    return { user, allowed: false, reason: "user_not_found" };
  }

  const status = dbUser.subscriptionStatus;

  // Paid users always have access
  if (status === "active") {
    return { user, allowed: true };
  }

  // Trial users — check if trial is still valid
  if (status === "trial") {
    if (!dbUser.trialEndsAt) {
      return { user, allowed: false, reason: "trial_misconfigured" };
    }
    if (new Date(dbUser.trialEndsAt) > new Date()) {
      return { user, allowed: true };
    }

    // Trial expired — auto-update status in DB (best-effort) + bust cache
    await markExpired(user.id);

    return { user, allowed: false, reason: "trial_expired" };
  }

  return { user, allowed: false, reason: "no_subscription" };
}

/**
 * Get subscription status details for the current user.
 * Used by the /api/subscription/status endpoint.
 */
export async function getSubscriptionDetails(userId: number) {
  // role is not cached (needs one extra column) — small single-row read.
  const [dbUser] = await db
    .select({
      role: users.role,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!dbUser) return null;

  // Admin — always active
  if (dbUser.role === "admin") {
    return {
      subscriptionStatus: "active" as const,
      trialEndsAt: null,
      trialDaysLeft: null,
      isExpired: false,
      isAdmin: true,
    };
  }

  const cached = await loadSubUser(userId);
  if (!cached) return null;

  const trialEndsAt = cached.trialEndsAt ? new Date(cached.trialEndsAt) : null;
  const trial = await resolveTrialState(userId, cached.subscriptionStatus, trialEndsAt);

  return {
    subscriptionStatus: trial.currentStatus,
    trialEndsAt,
    trialDaysLeft: trial.trialDaysLeft,
    isExpired: trial.isExpired,
    isAdmin: false,
  };
}

async function markExpired(userId: number): Promise<void> {
  try {
    await db
      .update(users)
      .set({ subscriptionStatus: "expired" })
      .where(eq(users.id, userId));
    await cacheDel(subCacheKey(userId));
  } catch {
    // best-effort — caller still treats as expired
  }
}

async function resolveTrialState(
  userId: number,
  status: string | null,
  trialEndsAt: Date | null,
): Promise<{ currentStatus: string; trialDaysLeft: number | null; isExpired: boolean }> {
  const currentStatus = status || "none";

  if (currentStatus === "expired") {
    return { currentStatus, trialDaysLeft: null, isExpired: true };
  }

  if (currentStatus !== "trial") {
    return { currentStatus, trialDaysLeft: null, isExpired: false };
  }

  // Trial without trialEndsAt — treat as expired/invalid
  if (!trialEndsAt) {
    await markExpired(userId);
    return { currentStatus: "expired", trialDaysLeft: 0, isExpired: true };
  }

  const diff = new Date(trialEndsAt).getTime() - Date.now();
  const trialDaysLeft = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));

  if (trialDaysLeft <= 0) {
    await markExpired(userId);
    return { currentStatus: "expired", trialDaysLeft: 0, isExpired: true };
  }

  return { currentStatus, trialDaysLeft, isExpired: false };
}
