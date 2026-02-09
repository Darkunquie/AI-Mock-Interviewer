"use client";

import Link from "next/link";
import { Clock, Zap } from "lucide-react";

export default function PendingApprovalPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0f0f0f]">
      <div className="w-full max-w-md p-10 border border-white/[0.08] bg-[#161616] text-center">
        <div className="flex flex-col items-center mb-10">
          <Link href="/" className="flex items-center gap-3 mb-8">
            <div className="size-5 bg-yellow-400 flex items-center justify-center rotate-45">
              <Zap className="w-3 h-3 text-[#0f0f0f] -rotate-45" />
            </div>
            <span className="text-sm font-bold tracking-[0.25em] uppercase text-white">
              SkillForge
            </span>
          </Link>

          <div className="size-16 bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center mb-6">
            <Clock className="w-8 h-8 text-yellow-400" />
          </div>

          <h1 className="text-2xl font-bold text-white tracking-tight">
            Account Pending Approval
          </h1>
          <p className="text-zinc-400 text-sm mt-4 leading-relaxed max-w-xs">
            Your account has been created successfully. An admin will review and
            approve your account shortly.
          </p>
          <p className="text-zinc-500 text-xs mt-3">
            You will be able to sign in once your account is approved.
          </p>
        </div>

        <Link
          href="/sign-in"
          className="inline-block w-full py-4 bg-white/[0.05] border border-white/[0.08] text-white font-bold text-xs uppercase tracking-[0.2em] hover:bg-white/[0.1] transition-all"
        >
          Back to Sign In
        </Link>
      </div>
    </div>
  );
}
