"use client";

import { useSubscription } from "@/hooks/useSubscription";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  Lock,
  Zap,
  Mic,
  BarChart3,
  Layers,
  FolderKanban,
  History,
  FileText,
} from "lucide-react";

const lockedFeatures = [
  { icon: Zap, label: "AI Mock Interviews", description: "Unlimited practice sessions with AI feedback" },
  { icon: Mic, label: "Voice Transcription", description: "Real-time speech-to-text during interviews" },
  { icon: BarChart3, label: "Analytics Dashboard", description: "Track your progress and performance" },
  { icon: Layers, label: "Flash Cards", description: "AI-generated study materials" },
  { icon: FolderKanban, label: "Project Ideas", description: "Personalized project recommendations" },
  { icon: History, label: "Interview History", description: "Review past interviews and feedback" },
  { icon: FileText, label: "PDF Question Import", description: "Upload custom question sets" },
];

export default function SubscriptionPage() {
  const router = useRouter();
  const { isLoading, isExpired, isAdmin, isSubscriptionActive, isTrialActive } =
    useSubscription();

  // Redirect if user has active access
  useEffect(() => {
    if (!isLoading && (isAdmin || isSubscriptionActive || isTrialActive)) {
      router.push("/dashboard");
    }
  }, [isLoading, isAdmin, isSubscriptionActive, isTrialActive, router]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-yellow-400"></div>
      </div>
    );
  }

  if (!isExpired) return null;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="flex justify-center mb-4">
          <div className="size-16 bg-red-500/10 rounded-full flex items-center justify-center">
            <Lock className="w-8 h-8 text-red-400" />
          </div>
        </div>
        <h1 className="text-2xl font-black uppercase tracking-wider text-white mb-3">
          Your Free Trial Has Ended
        </h1>
        <p className="text-zinc-400 max-w-md mx-auto">
          Your 3-day free trial has expired. Upgrade to a paid plan to continue
          using all SkillForge features.
        </p>
      </div>

      {/* Locked Features Grid */}
      <div className="mb-10">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 mb-4">
          Features you&apos;re missing
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {lockedFeatures.map((feature) => (
            <div
              key={feature.label}
              className="flex items-start gap-3 p-4 border border-white/[0.08] bg-white/[0.02]"
            >
              <feature.icon className="h-5 w-5 text-zinc-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-white">{feature.label}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing Card */}
      <div className="border border-yellow-400/20 bg-yellow-400/[0.03] p-8 text-center">
        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-yellow-400 mb-2">
          Full Access
        </h3>
        <div className="flex items-baseline justify-center gap-1 mb-4">
          <span className="text-4xl font-black text-white">Coming Soon</span>
        </div>
        <p className="text-zinc-400 text-sm mb-6">
          Payment integration is being set up. Contact us for early access.
        </p>
        <button
          disabled
          className="w-full py-3 bg-yellow-400/50 text-black font-bold text-xs uppercase tracking-[0.2em] cursor-not-allowed"
        >
          Payment Coming Soon
        </button>
      </div>

      {/* Contact */}
      <p className="text-center text-xs text-zinc-600 mt-6">
        Need help? Contact support for assistance with your account.
      </p>
    </div>
  );
}
