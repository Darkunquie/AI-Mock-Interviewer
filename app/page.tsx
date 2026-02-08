"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import {
  Mic,
  BarChart3,
  Target,
  Zap,
  ArrowRight,
  Sparkles,
  Link as LinkIcon,
  Mail,
} from "lucide-react";

// Hydration-safe mounting check
const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

// SkillForge Logo - Anvil with Spark
function SkillForgeLogo() {
  return (
    <div className="size-5 bg-yellow-400 flex items-center justify-center rotate-45">
      <Zap className="w-3 h-3 text-[#0f0f0f] -rotate-45" />
    </div>
  );
}

export default function HomePage() {
  const { isSignedIn, isLoading } = useAuth();
  const mounted = useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);
  const showDashboardLink = mounted && !isLoading && isSignedIn;

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-neutral-200 antialiased overflow-x-hidden font-sans">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-[#0f0f0f]/90 backdrop-blur-xl border-b border-white/[0.08]">
        <div className="max-w-full mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <SkillForgeLogo />
            <span className="text-sm font-bold tracking-[0.25em] uppercase text-white">
              SkillForge
            </span>
          </Link>

          <div className="flex items-center gap-10">
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-yellow-400 transition-colors">
                Features
              </a>
            </nav>
            {showDashboardLink ? (
              <Link href="/dashboard">
                <button className="bg-white text-[#0f0f0f] px-5 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] hover:bg-yellow-400 transition-all">
                  Dashboard
                </button>
              </Link>
            ) : (
              <div className="flex items-center gap-4">
                <Link href="/sign-in">
                  <button className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-400 hover:text-yellow-400 transition-all">
                    Login
                  </button>
                </Link>
                <Link href="/sign-up">
                  <button className="bg-white text-[#0f0f0f] px-5 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] hover:bg-yellow-400 transition-all">
                    Sign Up
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="pt-16">
        <div className="grid grid-cols-1 md:grid-cols-12 w-full min-h-screen border-l border-white/[0.08]">
          {/* Hero Section - Left */}
          <section className="md:col-span-8 lg:col-span-9 grid-cell border-b border-r border-white/[0.08] flex flex-col justify-center min-h-[70vh] relative group">
            <div className="absolute top-8 left-8">
              <p className="text-orange-500 text-[10px] font-black uppercase tracking-[0.4em] mb-2">
                System Status: Active
              </p>
            </div>

            <div className="max-w-4xl space-y-12">
              <div className="space-y-6">
                <p className="text-yellow-400 text-xs font-bold uppercase tracking-[0.4em]">
                  Ready for your session?
                </p>
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter leading-[0.9] text-white">
                  Hello. I&apos;m your interviewer today.{" "}
                  <br />
                  <span className="text-zinc-700">Shall we begin?</span>
                </h1>
              </div>

              {/* Audio Visualizer Bars */}
              <div className="flex items-end gap-1 h-32 py-4">
                {[20, 45, 80, 30, 95, 50, 15, 75, 40, 100, 60, 25, 85, 35, 55, 10].map((height, i) => (
                  <div
                    key={i}
                    className={`w-2 ${i % 3 === 0 ? 'bg-orange-500' : 'bg-yellow-400'} glitch-bar`}
                    style={{
                      height: `${height}%`,
                      animationDelay: `${i * 0.1}s`,
                    }}
                  />
                ))}
              </div>

              {/* CTA */}
              <div className="flex flex-wrap items-center gap-8">
                <Link href={showDashboardLink ? "/dashboard/practice" : "/sign-up"}>
                  <button className="btn-brutalist px-10 py-5 bg-yellow-400 text-[#0f0f0f] font-black text-sm uppercase tracking-widest hover:bg-white transition-all">
                    Start Free Interview
                    <ArrowRight className="inline-block ml-2 w-4 h-4" />
                  </button>
                </Link>
                <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em] border-l border-zinc-800 pl-6">
                  100+ Tech Stacks Available
                </p>
              </div>
            </div>
          </section>

          {/* Features Section - Right */}
          <section className="md:col-span-4 lg:col-span-3 border-b border-white/[0.08]">
            <div className="grid grid-cols-1 h-full">
              {/* Feature 1 */}
              <div className="grid-cell border-b border-white/[0.08] flex flex-col justify-center gap-6 hover:bg-[#161616] group transition-colors">
                <Mic className="w-8 h-8 text-orange-500 group-hover:scale-110 transition-transform" />
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">01. Conversation</p>
                <h3 className="text-xl font-bold text-white leading-tight">
                  Natural, low-latency voice interaction.
                </h3>
                <p className="text-zinc-400 text-xs leading-relaxed italic">
                  &quot;Explain how you handle state management in complex applications.&quot;
                </p>
              </div>

              {/* Feature 2 */}
              <div className="grid-cell border-b border-white/[0.08] flex flex-col justify-center gap-6 hover:bg-[#161616] group transition-colors">
                <BarChart3 className="w-8 h-8 text-yellow-400 group-hover:scale-110 transition-transform" />
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">02. Feedback</p>
                <h3 className="text-xl font-bold text-white leading-tight">
                  Immediate analysis of your response.
                </h3>
                <p className="text-zinc-400 text-xs leading-relaxed italic">
                  &quot;You demonstrated clear logic but could improve your technical depth here.&quot;
                </p>
              </div>

              {/* Feature 3 */}
              <div className="grid-cell flex flex-col justify-center gap-6 hover:bg-[#161616] group transition-colors">
                <Target className="w-8 h-8 text-orange-500 group-hover:scale-110 transition-transform" />
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">03. Growth</p>
                <h3 className="text-xl font-bold text-white leading-tight">
                  Role-specific mastery paths.
                </h3>
                <p className="text-zinc-400 text-xs leading-relaxed italic">
                  &quot;Based on our talk, I&apos;ve curated five new challenges for your goal.&quot;
                </p>
              </div>
            </div>
          </section>

          {/* Stats Section */}
          <section className="md:col-span-12 grid grid-cols-2 md:grid-cols-4 border-b border-white/[0.08]" id="features">
            <StatCell number="100+" label="Tech Courses" />
            <StatCell number="1000+" label="Subtopics" />
            <StatCell number="20+" label="Learning Paths" />
            <StatCell number="Free" label="Forever" />
          </section>

          {/* What We Offer Grid */}
          <section className="md:col-span-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 border-b border-white/[0.08]" id="practice">
            <OfferCell
              icon={<Mic className="w-6 h-6" />}
              title="Voice Interviews"
              description="Real-time AI conversations with speech-to-text"
              color="yellow"
            />
            <OfferCell
              icon={<BarChart3 className="w-6 h-6" />}
              title="Smart Analytics"
              description="Track filler words, pace, and improvement"
              color="orange"
            />
            <OfferCell
              icon={<Sparkles className="w-6 h-6" />}
              title="Flash Cards"
              description="AI-generated cards for quick revision"
              color="yellow"
            />
            <OfferCell
              icon={<Target className="w-6 h-6" />}
              title="Company Prep"
              description="Questions styled for FAANG & top companies"
              color="orange"
            />
          </section>

          {/* CTA Section */}
          <section className="md:col-span-12 grid-cell border-b border-white/[0.08] bg-[#161616] flex flex-col md:flex-row items-center justify-between py-20 gap-12">
            <h2 className="text-3xl md:text-5xl font-bold text-white max-w-2xl leading-[0.9] tracking-tighter">
              Are you ready to <span className="text-yellow-400">forge</span> your skills?
            </h2>
            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
              <Link href={showDashboardLink ? "/dashboard/practice" : "/sign-up"}>
                <button className="px-10 py-5 bg-orange-500 text-white font-bold text-xs uppercase tracking-[0.2em] hover:bg-white hover:text-[#0f0f0f] transition-all text-center">
                  Start Practicing
                </button>
              </Link>
              <Link href={showDashboardLink ? "/dashboard/analytics" : "/sign-up"}>
                <button className="px-10 py-5 border border-white/20 text-white font-bold text-xs uppercase tracking-[0.2em] hover:border-yellow-400 hover:text-yellow-400 transition-all text-center">
                  View Analytics
                </button>
              </Link>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#0f0f0f] border-t border-white/[0.08] py-16">
        <div className="max-w-full mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 lg:gap-24">
            {/* Logo */}
            <div className="space-y-8 md:col-span-1">
              <div className="flex items-center gap-2">
                <div className="size-4 bg-orange-500 rotate-45" />
                <span className="text-xs font-black uppercase tracking-[0.3em] text-white">
                  SkillForge
                </span>
              </div>
              <p className="text-zinc-500 text-[10px] font-medium uppercase tracking-widest leading-loose max-w-xs">
                Built for the future of technical assessment. Zero friction. Pure growth.
              </p>
            </div>

            {/* Links */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8 md:col-span-3">
              <div className="space-y-6">
                <p className="text-[9px] font-black text-white uppercase tracking-[0.3em]">Platform</p>
                <ul className="space-y-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                  <li><Link href="/dashboard/practice" className="hover:text-yellow-400 transition-colors">Practice</Link></li>
                  <li><Link href="/dashboard/flash-cards" className="hover:text-yellow-400 transition-colors">Flash Cards</Link></li>
                  <li><Link href="/dashboard/analytics" className="hover:text-yellow-400 transition-colors">Analytics</Link></li>
                </ul>
              </div>
              <div className="space-y-6">
                <p className="text-[9px] font-black text-white uppercase tracking-[0.3em]">Company</p>
                <ul className="space-y-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                  <li><a href="#" className="hover:text-yellow-400 transition-colors">About</a></li>
                  <li><a href="#" className="hover:text-yellow-400 transition-colors">Privacy</a></li>
                  <li><a href="#" className="hover:text-yellow-400 transition-colors">Terms</a></li>
                </ul>
              </div>
              <div className="space-y-6 col-span-2 md:col-span-1">
                <p className="text-[9px] font-black text-white uppercase tracking-[0.3em]">Connect</p>
                <div className="flex gap-4">
                  <div className="w-10 h-10 border border-white/[0.08] flex items-center justify-center text-zinc-500 hover:text-yellow-400 hover:border-yellow-400 transition-all cursor-pointer">
                    <LinkIcon className="w-4 h-4" />
                  </div>
                  <div className="w-10 h-10 border border-white/[0.08] flex items-center justify-center text-zinc-500 hover:text-yellow-400 hover:border-yellow-400 transition-all cursor-pointer">
                    <Mail className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom */}
          <div className="mt-20 pt-8 border-t border-white/[0.08] flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-zinc-700 text-[9px] font-bold uppercase tracking-[0.4em]">
              © 2026 SKILLFORGE. SYSTEM ONLINE.
            </p>
            <div className="flex gap-8">
              <span className="text-[9px] text-zinc-700 font-bold uppercase tracking-[0.4em]">
                100+ COURSES
              </span>
              <span className="text-[9px] text-zinc-700 font-bold uppercase tracking-[0.4em]">
                FREE FOREVER
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function StatCell({ number, label }: { number: string; label: string }) {
  return (
    <div className="grid-cell border-r border-white/[0.08] flex flex-col justify-center items-center gap-2 hover:bg-[#161616] transition-colors">
      <p className="text-4xl md:text-5xl font-black text-yellow-400">{number}</p>
      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{label}</p>
    </div>
  );
}

function OfferCell({
  icon,
  title,
  description,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: "yellow" | "orange";
}) {
  return (
    <div className="grid-cell border-r border-white/[0.08] flex flex-col gap-4 hover:bg-[#161616] transition-colors group">
      <div className={`${color === "yellow" ? "text-yellow-400" : "text-orange-500"} group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <h3 className="text-lg font-bold text-white">{title}</h3>
      <p className="text-zinc-500 text-xs leading-relaxed">{description}</p>
    </div>
  );
}
