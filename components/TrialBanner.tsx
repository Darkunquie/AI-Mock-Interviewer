"use client";

import { useSubscription } from "@/hooks/useSubscription";
import { Clock, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function TrialBanner() {
  const { isLoading, isTrialActive, isExpired, trialDaysLeft, isAdmin, isSubscriptionActive } =
    useSubscription();

  // Don't show banner for admins, paid users, or while loading
  if (isLoading || isAdmin || isSubscriptionActive) return null;

  if (isTrialActive && trialDaysLeft !== null && trialDaysLeft > 0) {
    return (
      <div className="bg-yellow-400/10 border border-yellow-400/20 px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Clock className="h-4 w-4 text-yellow-400 flex-shrink-0" />
          <p className="text-sm text-yellow-200">
            <span className="font-bold text-yellow-400">Free trial:</span>{" "}
            {trialDaysLeft === 1
              ? "Last day remaining"
              : `${trialDaysLeft} days remaining`}
          </p>
        </div>
        <Link
          href="/dashboard/subscription"
          className="text-xs font-bold uppercase tracking-wider text-yellow-400 hover:text-yellow-300 transition-colors whitespace-nowrap"
        >
          Upgrade Now
        </Link>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-200">
            Your free trial has expired. Upgrade to continue using all features.
          </p>
        </div>
        <Link
          href="/dashboard/subscription"
          className="text-xs font-bold uppercase tracking-wider bg-yellow-400 text-black px-4 py-1.5 hover:bg-yellow-300 transition-colors whitespace-nowrap"
        >
          Upgrade Now
        </Link>
      </div>
    );
  }

  return null;
}
