"use client";

import { useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";

const POLL_INTERVAL_MS = 60_000; // 60 seconds
const REFRESH_DELAY_MS = 3_000; // 3 seconds after toast before auto-refresh

export function VersionCheck() {
  const clientBuildId = process.env.NEXT_PUBLIC_BUILD_ID;
  const hasNotifiedRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkVersion = useCallback(async () => {
    if (hasNotifiedRef.current) return;

    try {
      const res = await fetch("/api/version", {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });

      if (!res.ok) return;

      const data = await res.json();
      const serverBuildId = data.buildId;

      if (
        serverBuildId &&
        clientBuildId &&
        serverBuildId !== clientBuildId &&
        serverBuildId !== "unknown"
      ) {
        hasNotifiedRef.current = true;

        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }

        toast.info("A new version is available. Refreshing...", {
          duration: REFRESH_DELAY_MS + 1000,
          action: {
            label: "Refresh now",
            onClick: () => window.location.reload(),
          },
        });

        setTimeout(() => {
          window.location.reload();
        }, REFRESH_DELAY_MS);
      }
    } catch {
      // Silently ignore network errors (server may be restarting)
    }
  }, [clientBuildId]);

  useEffect(() => {
    // Skip in dev — build ID changes on every recompile
    if (!clientBuildId) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkVersion();
        if (!intervalRef.current && !hasNotifiedRef.current) {
          intervalRef.current = setInterval(checkVersion, POLL_INTERVAL_MS);
        }
      } else {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    };

    // Initial check after 5s delay (don't block initial render)
    const initialTimeout = setTimeout(checkVersion, 5_000);

    // Start polling
    intervalRef.current = setInterval(checkVersion, POLL_INTERVAL_MS);

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearTimeout(initialTimeout);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [checkVersion, clientBuildId]);

  return null;
}
