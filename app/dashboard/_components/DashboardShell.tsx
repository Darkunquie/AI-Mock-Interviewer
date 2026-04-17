"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Zap,
  LayoutDashboard,
  BarChart3,
  History,
  GraduationCap,
  LogOut,
  Menu,
  X,
  FolderKanban,
  Layers,
  Shield,
  Trophy,
} from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import type { AuthUser } from "@/lib/auth";

const NAV_ITEMS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/dashboard/practice", icon: GraduationCap, label: "Practice" },
  { href: "/dashboard/flash-cards", icon: Layers, label: "Flash Cards" },
  { href: "/dashboard/projects", icon: FolderKanban, label: "Projects" },
  { href: "/dashboard/history", icon: History, label: "History" },
  { href: "/dashboard/analytics", icon: BarChart3, label: "Analytics" },
  { href: "/dashboard/leaderboard", icon: Trophy, label: "Leaderboard" },
];

export default function DashboardShell({
  user,
  isAdmin,
  children,
}: {
  user: AuthUser;
  isAdmin: boolean;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isExpired: isSubscriptionExpired, isLoading: isSubLoading } = useSubscription();

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Subscription expired → redirect to subscription page
  useEffect(() => {
    if (
      !isSubLoading &&
      isSubscriptionExpired &&
      !isAdmin &&
      pathname !== "/dashboard/subscription"
    ) {
      router.push("/dashboard/subscription");
    }
  }, [isSubLoading, isSubscriptionExpired, isAdmin, pathname, router]);

  const handleSignOut = async () => {
    await fetch("/api/auth/signout", { method: "POST" });
    router.push("/");
  };

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      <div
        className={`fixed inset-0 bg-black/60 z-40 md:hidden transition-opacity duration-300 ${
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar Navigation */}
      <aside
        className={`
          fixed left-0 top-0 h-full border-r border-white/[0.08] bg-[#0f0f0f] flex flex-col z-50
          transition-all duration-300 ease-in-out
          w-64
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0 md:w-[72px] md:hover:w-64 group/sidebar
        `}
      >
        {/* Logo */}
        <div className="p-4 flex items-center gap-3 h-16">
          <div className="h-10 w-10 min-w-[40px] bg-yellow-400 rotate-45 flex items-center justify-center flex-shrink-0">
            <Zap className="h-5 w-5 text-[#0f0f0f] -rotate-45" />
          </div>
          <h1 className="text-sm font-black tracking-[0.2em] uppercase whitespace-nowrap overflow-hidden md:opacity-0 md:group-hover/sidebar:opacity-100 transition-opacity duration-300">
            SkillForge
          </h1>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 space-y-1 mt-2">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 font-medium transition-colors ${
                isActive(item.href)
                  ? "bg-yellow-400/10 text-yellow-400"
                  : "text-zinc-400 hover:bg-[#161616] hover:text-white"
              }`}
              title={item.label}
            >
              <item.icon className="h-5 w-5 min-w-[20px] flex-shrink-0" />
              <span className="whitespace-nowrap overflow-hidden md:opacity-0 md:group-hover/sidebar:opacity-100 transition-opacity duration-300 text-xs uppercase tracking-wider">
                {item.label}
              </span>
            </Link>
          ))}

          {/* Admin Portal Link */}
          {isAdmin && (
            <>
              <div className="border-t border-white/[0.08] my-3" />
              <Link
                href="/admin"
                className="flex items-center gap-3 px-3 py-2.5 text-yellow-400 hover:bg-yellow-400/10 transition-colors"
                title="Admin Portal"
              >
                <Shield className="h-5 w-5 min-w-[20px] flex-shrink-0" />
                <span className="whitespace-nowrap overflow-hidden md:opacity-0 md:group-hover/sidebar:opacity-100 transition-opacity duration-300 text-xs uppercase tracking-wider">
                  Admin Portal
                </span>
              </Link>
            </>
          )}
        </nav>

        {/* User Profile & Sign out at bottom */}
        <div className="p-3 border-t border-white/[0.08] space-y-2">
          <div className="flex items-center gap-3 px-3 py-2.5 bg-[#161616]">
            <div className="h-9 w-9 min-w-[36px] bg-orange-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden md:opacity-0 md:group-hover/sidebar:opacity-100 transition-opacity duration-300">
              <p className="text-sm font-bold text-white truncate">{user.name || "User"}</p>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Candidate</p>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2.5 text-zinc-400 hover:bg-[#161616] hover:text-white transition-colors w-full"
            title="Sign out"
          >
            <LogOut className="h-5 w-5 min-w-[20px] flex-shrink-0" />
            <span className="whitespace-nowrap overflow-hidden md:opacity-0 md:group-hover/sidebar:opacity-100 transition-opacity duration-300 text-xs uppercase tracking-wider">
              Sign out
            </span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="md:ml-[72px] flex flex-col min-h-screen">
        {/* Mobile Header */}
        <header className="sticky top-0 z-30 w-full border-b border-white/[0.08] bg-[#0f0f0f]/95 backdrop-blur-md px-4 py-3 flex items-center justify-between md:hidden">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 text-zinc-400 hover:bg-[#161616] hover:text-white transition-colors"
            aria-label="Toggle menu"
          >
            {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-yellow-400 rotate-45 flex items-center justify-center">
              <Zap className="h-4 w-4 text-[#0f0f0f] -rotate-45" />
            </div>
            <span className="text-xs font-black tracking-[0.15em] uppercase">SkillForge</span>
          </div>
          <div className="h-9 w-9 bg-orange-500 flex items-center justify-center text-white font-bold text-sm">
            {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
          </div>
        </header>

        {/* Desktop Top Bar */}
        <header className="hidden md:flex sticky top-0 z-30 w-full border-b border-white/[0.08] bg-[#0f0f0f]/95 backdrop-blur-md px-8 py-2.5 items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold">Welcome back,</span>
            <span className="text-white font-bold">{user.name || "User"}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[10px] text-zinc-600 uppercase tracking-[0.3em] font-bold">SkillForge Platform</span>
          </div>
        </header>

        {children}
      </main>
    </>
  );
}
