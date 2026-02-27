"use client";

import { useState, useEffect, useCallback } from "react";

interface SubscriptionStatus {
  subscriptionStatus: string;
  trialEndsAt: string | null;
  trialDaysLeft: number | null;
  isExpired: boolean;
  isAdmin: boolean;
}

export function useSubscription() {
  const [data, setData] = useState<SubscriptionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/subscription/status");
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setData(json);
        }
      }
    } catch {
      // Silently fail — user may not be authenticated
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return {
    isLoading,
    subscriptionStatus: data?.subscriptionStatus ?? "none",
    trialEndsAt: data?.trialEndsAt ?? null,
    trialDaysLeft: data?.trialDaysLeft ?? null,
    isExpired: data?.isExpired ?? false,
    isAdmin: data?.isAdmin ?? false,
    isTrialActive:
      data?.subscriptionStatus === "trial" && !data?.isExpired,
    isSubscriptionActive: data?.subscriptionStatus === "active" && !data?.isExpired,
    refresh: fetchStatus,
  };
}
