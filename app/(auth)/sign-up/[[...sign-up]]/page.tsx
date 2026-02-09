"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, Zap } from "lucide-react";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, phone }),
      });

      const data = await res.json();

      if (data.success && data.pending) {
        toast.success("Account created! Awaiting admin approval.");
        router.push("/pending-approval");
      } else if (data.success) {
        toast.success("Account created successfully!");
        router.push("/dashboard");
      } else {
        toast.error(data.error || "Failed to create account");
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
            <span className="text-sm font-bold tracking-[0.25em] uppercase text-white">
              SkillForge
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-white tracking-tight">Create an account</h1>
          <p className="text-zinc-500 text-xs uppercase tracking-widest mt-2">Start your journey</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="name" className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-3 bg-[#0f0f0f] border border-white/[0.08] text-white placeholder:text-zinc-600 text-sm focus:outline-none focus:border-yellow-400 transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-[#0f0f0f] border border-white/[0.08] text-white placeholder:text-zinc-600 text-sm focus:outline-none focus:border-yellow-400 transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="phone" className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              Phone Number
            </label>
            <input
              id="phone"
              type="tel"
              placeholder="+91 9876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="w-full px-4 py-3 bg-[#0f0f0f] border border-white/[0.08] text-white placeholder:text-zinc-600 text-sm focus:outline-none focus:border-yellow-400 transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
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
                Creating account...
              </span>
            ) : (
              "Sign Up"
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <span className="text-zinc-500 text-xs">Already have an account? </span>
          <Link href="/sign-in" className="text-yellow-400 text-xs font-bold uppercase tracking-wider hover:text-white transition-colors">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
