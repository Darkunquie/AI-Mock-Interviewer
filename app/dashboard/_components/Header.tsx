"use client";

import { useAuth } from "@/hooks/useAuth";

export default function Header() {
  const { user } = useAuth();

  const firstName = user?.name?.split(" ")[0] || "there";

  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-white">
        Welcome back, {firstName}!
      </h1>
      <p className="mt-2 text-slate-400">
        Ready to practice? Start a new mock interview or review your past sessions.
      </p>
    </div>
  );
}
