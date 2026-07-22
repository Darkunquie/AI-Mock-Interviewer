"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, Zap, Eye, EyeOff } from "lucide-react";
import { apiFetch } from "@/lib/client/api";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("token");
    setToken(t);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNum = /\d/.test(password);
    if (password.length < 8 || !hasUpper || !hasLower || !hasNum) {
      toast.error("Password must be at least 8 characters with uppercase, lowercase, and a number");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      const res = await apiFetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Password updated. Please sign in.");
        router.push("/sign-in");
      } else {
        toast.error(typeof data.error === "string" ? data.error : "Reset failed");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0f0f0f]">
      <div className="w-full max-w-md p-10 border border-white/[0.08] bg-[#161616]">
        <div className="flex flex-col items-center mb-10">
          <Link href="/" className="flex items-center gap-3 mb-8">
            <div className="size-5 bg-yellow-400 flex items-center justify-center rotate-45">
              <Zap className="w-3 h-3 text-[#0f0f0f] -rotate-45" />
            </div>
            <span className="text-sm font-bold tracking-[0.25em] uppercase text-white">SkillForge</span>
          </Link>
          <h1 className="text-2xl font-bold text-white tracking-tight">New password</h1>
          <p className="text-zinc-500 text-xs uppercase tracking-widest mt-2">Choose a strong password</p>
        </div>

        {token === "" || token === null ? (
          <p className="text-zinc-400 text-sm text-center leading-relaxed">
            This reset link is missing its token. Request a new one from the{" "}
            <Link href="/forgot-password" className="text-yellow-400 hover:text-white">forgot password</Link> page.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="password" className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                New password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full px-4 py-3 pr-12 bg-[#0f0f0f] border border-white/[0.08] text-white placeholder:text-zinc-600 text-sm focus:outline-none focus:border-yellow-400 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="confirm" className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                Confirm password
              </label>
              <input
                id="confirm"
                type={showPassword ? "text" : "password"}
                placeholder="Re-enter password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                className="w-full px-4 py-3 bg-[#0f0f0f] border border-white/[0.08] text-white placeholder:text-zinc-600 text-sm focus:outline-none focus:border-yellow-400 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-yellow-400 text-[#0f0f0f] font-bold text-xs uppercase tracking-[0.2em] hover:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Updating...
                </span>
              ) : (
                "Update password"
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
