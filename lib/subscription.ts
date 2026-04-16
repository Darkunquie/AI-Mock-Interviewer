import { getCurrentUser, type AuthUser } from "./auth";
import { db } from "./db";
import { users } from "@/utils/schema";
import { eq } from "drizzle-orm";

type SubscriptionResult =
  | { user: AuthUser; allowed: true; reason?: undefined }
  | { user: AuthUser; allowed: false; reason: string }
  | { user: null; allowed: false; reason: string };

/**
 * Check if the current user has an active subscription or trial.
 * Admin users always have full access.
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

  // Fetch fresh subscription data from DB
  const [dbUser] = await db
    .select({
      subscriptionStatus: users.subscriptionStatus,
      trialEndsAt: users.trialEndsAt,
    })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

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

    // Trial expired — auto-update status in DB (best-effort)
    try {
      await db
        .update(users)
        .set({ subscriptionStatus: "expired" })
        .where(eq(users.id, user.id));
    } catch {
      // Still return expired — the trial is expired regardless of DB update success
    }

    return { user, allowed: false, reason: "trial_expired" };
  }

  return { user, allowed: false, reason: "no_subscription" };
}

/**
 * Get subscription status details for the current user.
 * Used by the /api/subscription/status endpoint.
 */
export async function getSubscriptionDetails(userId: number) {
  const [dbUser] = await db
    .select({
      subscriptionStatus: users.subscriptionStatus,
      trialEndsAt: users.trialEndsAt,
      approvedAt: users.approvedAt,
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

  const trial = await resolveTrialState(userId, dbUser.subscriptionStatus, dbUser.trialEndsAt);

  return {
    subscriptionStatus: trial.currentStatus,
    trialEndsAt: dbUser.trialEndsAt,
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
