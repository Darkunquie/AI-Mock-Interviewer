"use client";

import { useEffect } from "react";
import { RefreshCw, Home, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4" role="alert">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="size-12 bg-red-500/10 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white">
            Admin Panel Error
          </h2>
          <p className="text-zinc-500 text-sm">
            An error occurred in the admin panel. Try refreshing or go back to the dashboard.
          </p>
          {error.digest && (
            <p className="text-zinc-600 text-xs font-mono">
              Error ID: {error.digest}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={reset}
            className="flex items-center gap-2 px-6 py-3 bg-yellow-400 text-[#0f0f0f] font-bold text-xs uppercase tracking-[0.2em] hover:bg-white transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
          <Link
            href="/"
            className="flex items-center gap-2 px-6 py-3 border border-white/[0.08] text-zinc-400 font-bold text-xs uppercase tracking-[0.2em] hover:text-white hover:border-white/20 transition-all"
          >
            <Home className="w-4 h-4" />
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
