"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Zap,
  LayoutDashboard,
  Users,
  LogOut,
  Menu,
  X,
  ArrowLeft,
  Trophy,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, isAdmin, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/sign-in");
    } else if (!isLoading && user && !isAdmin) {
      router.push("/dashboard");
    }
  }, [user, isLoading, isAdmin, router]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const navItems = [
    { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/admin/users", icon: Users, label: "Users" },
    { href: "/dashboard/leaderboard", icon: Trophy, label: "Leaderboard" },
  ];

  const isActive = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin";
    }
    return pathname.startsWith(href);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-yellow-400"></div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      {/* Mobile Sidebar Overlay */}
      <div
        className={`fixed inset-0 bg-black/60 z-40 lg:hidden transition-opacity duration-300 ${
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
          lg:translate-x-0 lg:w-[72px] lg:hover:w-64 group/sidebar
        `}
      >
        {/* Logo */}
        <div className="p-4 flex items-center gap-3 h-16">
          <div className="h-10 w-10 min-w-[40px] bg-yellow-400 rotate-45 flex items-center justify-center flex-shrink-0">
            <Zap className="h-5 w-5 text-[#0f0f0f] -rotate-45" />
          </div>
          <div className="overflow-hidden lg:opacity-0 lg:group-hover/sidebar:opacity-100 transition-opacity duration-300">
            <h1 className="text-sm font-black tracking-[0.2em] uppercase whitespace-nowrap">
              SkillForge
            </h1>
            <p className="text-[9px] text-yellow-400 uppercase tracking-[0.3em] font-bold">
              Admin
            </p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 space-y-1 mt-2">
          {navItems.map((item) => (
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
              <span className="whitespace-nowrap overflow-hidden lg:opacity-0 lg:group-hover/sidebar:opacity-100 transition-opacity duration-300 text-xs uppercase tracking-wider">
                {item.label}
              </span>
            </Link>
          ))}

          {/* Divider */}
          <div className="border-t border-white/[0.08] my-3" />

          {/* Back to Dashboard */}
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-3 py-2.5 text-zinc-400 hover:bg-[#161616] hover:text-white transition-colors"
            title="Back to Dashboard"
          >
            <ArrowLeft className="h-5 w-5 min-w-[20px] flex-shrink-0" />
            <span className="whitespace-nowrap overflow-hidden lg:opacity-0 lg:group-hover/sidebar:opacity-100 transition-opacity duration-300 text-xs uppercase tracking-wider">
              Back to App
            </span>
          </Link>
        </nav>

        {/* User Profile & Sign out */}
        <div className="p-3 border-t border-white/[0.08] space-y-2">
          <div className="flex items-center gap-3 px-3 py-2.5 bg-[#161616]">
            <div className="h-9 w-9 min-w-[36px] bg-yellow-400 flex items-center justify-center text-[#0f0f0f] font-bold text-sm flex-shrink-0">
              {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden lg:opacity-0 lg:group-hover/sidebar:opacity-100 transition-opacity duration-300">
              <p className="text-sm font-bold text-white truncate">{user.name || "Admin"}</p>
              <p className="text-[10px] text-yellow-400 uppercase tracking-widest">Admin</p>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2.5 text-zinc-400 hover:bg-[#161616] hover:text-white transition-colors w-full"
            title="Sign out"
          >
            <LogOut className="h-5 w-5 min-w-[20px] flex-shrink-0" />
            <span className="whitespace-nowrap overflow-hidden lg:opacity-0 lg:group-hover/sidebar:opacity-100 transition-opacity duration-300 text-xs uppercase tracking-wider">
              Sign out
            </span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-[72px] flex flex-col min-h-screen">
        {/* Mobile Header */}
        <header className="sticky top-0 z-30 w-full border-b border-white/[0.08] bg-[#0f0f0f]/95 backdrop-blur-md px-4 py-3 flex items-center justify-between lg:hidden">
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
            <span className="text-xs font-black tracking-[0.15em] uppercase">Admin</span>
          </div>
          <div className="h-9 w-9 bg-yellow-400 flex items-center justify-center text-[#0f0f0f] font-bold text-sm">
            {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
          </div>
        </header>

        {/* Desktop Top Bar */}
        <header className="hidden lg:flex sticky top-0 z-30 w-full border-b border-white/[0.08] bg-[#0f0f0f]/95 backdrop-blur-md px-8 py-2.5 items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-yellow-400 text-[10px] uppercase tracking-widest font-bold">Admin Panel</span>
            <span className="text-zinc-600">|</span>
            <span className="text-white font-bold">{user.name || "Admin"}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[10px] text-zinc-600 uppercase tracking-[0.3em] font-bold">SkillForge Platform</span>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 lg:p-8 flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
