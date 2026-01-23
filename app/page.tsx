"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Mic, Brain, BarChart3, ArrowRight } from "lucide-react";

// Hydration-safe mounting check
const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export default function HomePage() {
  const { isSignedIn, isLoading } = useAuth();

  // useSyncExternalStore prevents hydration mismatch
  const mounted = useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);

  // Use false during SSR and initial render to match server
  const showDashboardLink = mounted && !isLoading && isSignedIn;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-8 w-8 text-blue-500" />
            <span className="text-xl font-bold text-white">AI Mock Interview</span>
          </div>
          <div className="flex items-center gap-4">
            {showDashboardLink ? (
              <Link href="/dashboard">
                <Button>Go to Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link href="/sign-in">
                  <Button variant="ghost" className="text-white hover:text-blue-400">
                    Sign In
                  </Button>
                </Link>
                <Link href="/sign-up">
                  <Button>Get Started Free</Button>
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16 text-center">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-blue-500/10 px-4 py-2 text-sm text-blue-400">
            <Mic className="h-4 w-4" />
            Voice-Powered AI Interviews
          </div>
          <h1 className="mb-6 text-5xl font-bold leading-tight text-white md:text-6xl">
            Master Your Next
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              {" "}Tech Interview
            </span>
          </h1>
          <p className="mb-8 text-xl text-slate-400">
            Practice with our AI interviewer that speaks and listens. Get real-time feedback,
            personalized questions, and improve your interview skills—all for free.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href={showDashboardLink ? "/dashboard" : "/sign-up"}>
              <Button size="lg" className="gap-2 text-lg">
                Start Free Interview <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="text-lg">
              Watch Demo
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mx-auto mt-24 grid max-w-5xl gap-8 md:grid-cols-3">
          <FeatureCard
            icon={<Mic className="h-8 w-8 text-blue-500" />}
            title="Voice Conversations"
            description="Speak naturally with our AI interviewer. No typing required—just talk like a real interview."
          />
          <FeatureCard
            icon={<Brain className="h-8 w-8 text-purple-500" />}
            title="Smart AI Evaluation"
            description="Get instant scoring on technical accuracy, communication skills, and depth of knowledge."
          />
          <FeatureCard
            icon={<BarChart3 className="h-8 w-8 text-green-500" />}
            title="Detailed Feedback"
            description="Receive personalized improvement tips, ideal answers, and topics to study after each interview."
          />
        </div>

        {/* Stats Section */}
        <div className="mx-auto mt-24 grid max-w-4xl gap-8 rounded-2xl bg-slate-800/50 p-8 md:grid-cols-4">
          <StatCard number="10K+" label="Users Practicing" />
          <StatCard number="50K+" label="Interviews Completed" />
          <StatCard number="85%" label="Success Rate" />
          <StatCard number="Free" label="Forever" />
        </div>

        {/* How It Works */}
        <div className="mx-auto mt-24 max-w-4xl">
          <h2 className="mb-12 text-3xl font-bold text-white">How It Works</h2>
          <div className="grid gap-6 md:grid-cols-4">
            <StepCard step={1} title="Select Role" description="Choose your target role and experience level" />
            <StepCard step={2} title="Start Interview" description="AI generates personalized questions for you" />
            <StepCard step={3} title="Answer & Speak" description="Respond using your voice—just like a real interview" />
            <StepCard step={4} title="Get Feedback" description="Receive instant scores and improvement tips" />
          </div>
        </div>

        {/* CTA Section */}
        <div className="mx-auto mt-24 max-w-2xl rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 p-12">
          <h2 className="mb-4 text-3xl font-bold text-white">Ready to Ace Your Interview?</h2>
          <p className="mb-8 text-lg text-blue-100">
            Join thousands of developers who improved their interview skills with AI practice.
          </p>
          <Link href={showDashboardLink ? "/dashboard" : "/sign-up"}>
            <Button size="lg" variant="secondary" className="gap-2 text-lg">
              Start Practicing Now <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto border-t border-slate-800 px-4 py-8 text-center text-slate-500">
        <p>© 2026 AI Mock Interview by FresherReady. All rights reserved.</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="rounded-xl bg-slate-800/50 p-6 text-left transition-all hover:bg-slate-800">
      <div className="mb-4">{icon}</div>
      <h3 className="mb-2 text-xl font-semibold text-white">{title}</h3>
      <p className="text-slate-400">{description}</p>
    </div>
  );
}

function StatCard({ number, label }: { number: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-3xl font-bold text-white">{number}</div>
      <div className="text-slate-400">{label}</div>
    </div>
  );
}

function StepCard({ step, title, description }: { step: number; title: string; description: string }) {
  return (
    <div className="relative rounded-xl bg-slate-800/50 p-6 text-center">
      <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 font-bold text-white">
        {step}
      </div>
      <h3 className="mb-2 font-semibold text-white">{title}</h3>
      <p className="text-sm text-slate-400">{description}</p>
    </div>
  );
}
