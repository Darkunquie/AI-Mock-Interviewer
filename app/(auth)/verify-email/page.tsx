"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Zap, CheckCircle2, XCircle } from "lucide-react";
import { apiFetch } from "@/lib/client/api";

type State = "verifying" | "success" | "error";

export default function VerifyEmailPage() {
  const router = useRouter();
  const [state, setState] = useState<State>("verifying");
  const ranRef = useRef(false);

  useEffect(() => {
    // Guard against double-invocation in React strict mode (would consume the
    // single-use token twice; the second call would 400).
    if (ranRef.current) return;
    ranRef.current = true;

    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) {
      setState("error");
      return;
    }

    (async () => {
      try {
        const res = await apiFetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        if (data.success) {
          setState("success");
          setTimeout(() => router.push("/dashboard"), 1200);
        } else {
          setState("error");
        }
      } catch {
        setState("error");
      }
    })();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0f0f0f]">
      <div className="w-full max-w-md p-10 border border-white/[0.08] bg-[#161616] text-center">
        <div className="flex flex-col items-center">
          <Link href="/" className="flex items-center gap-3 mb-8">
            <div className="size-5 bg-yellow-400 flex items-center justify-center rotate-45">
              <Zap className="w-3 h-3 text-[#0f0f0f] -rotate-45" />
            </div>
            <span className="text-sm font-bold tracking-[0.25em] uppercase text-white">SkillForge</span>
          </Link>

          {state === "verifying" && (
            <>
              <Loader2 className="w-10 h-10 text-yellow-400 animate-spin mb-6" />
              <h1 className="text-2xl font-bold text-white tracking-tight">Verifying…</h1>
              <p className="text-zinc-500 text-sm mt-3">Activating your account.</p>
            </>
          )}

          {state === "success" && (
            <>
              <div className="size-16 bg-green-400/10 border border-green-400/20 flex items-center justify-center mb-6">
                <CheckCircle2 className="w-8 h-8 text-green-400" />
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Email verified</h1>
              <p className="text-zinc-400 text-sm mt-3">Taking you to your dashboard…</p>
            </>
          )}

          {state === "error" && (
            <>
              <div className="size-16 bg-red-400/10 border border-red-400/20 flex items-center justify-center mb-6">
                <XCircle className="w-8 h-8 text-red-400" />
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Link invalid or expired</h1>
              <p className="text-zinc-400 text-sm mt-3 mb-8 max-w-xs">
                This verification link is no longer valid. Try signing in, or sign up again to get a fresh link.
              </p>
              <Link
                href="/sign-in"
                className="inline-block w-full py-4 bg-white/[0.05] border border-white/[0.08] text-white font-bold text-xs uppercase tracking-[0.2em] hover:bg-white/[0.1] transition-all"
              >
                Back to Sign In
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
