"use client";

import { useEffect } from "react";
import { Zap, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="size-12 bg-yellow-400 rotate-45 flex items-center justify-center">
            <Zap className="w-6 h-6 text-[#0f0f0f] -rotate-45" />
          </div>
        </div>

        {/* Error message */}
        <div className="space-y-3">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Something went wrong
          </h1>
          <p className="text-zinc-500 text-sm">
            An unexpected error occurred. Please try again.
          </p>
          {error.digest && (
            <p className="text-zinc-600 text-xs font-mono">
              Error ID: {error.digest}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={reset}
            className="flex items-center gap-2 px-6 py-3 bg-yellow-400 text-[#0f0f0f] font-bold text-xs uppercase tracking-[0.2em] hover:bg-white transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-6 py-3 border border-white/[0.08] text-zinc-400 font-bold text-xs uppercase tracking-[0.2em] hover:text-white hover:border-white/20 transition-all"
          >
            <Home className="w-4 h-4" />
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
