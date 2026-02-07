"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Mic,
  LayoutDashboard,
  BarChart3,
  History,
  GraduationCap,
  LogOut,
  Menu,
  X,
  FolderKanban,
  Layers,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/sign-in");
    }
  }, [user, isLoading, router]);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const navItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/dashboard/practice", icon: GraduationCap, label: "Practice" },
    { href: "/dashboard/flash-cards", icon: Layers, label: "Flash Cards" },
    { href: "/dashboard/projects", icon: FolderKanban, label: "Projects" },
    { href: "/dashboard/history", icon: History, label: "History" },
    { href: "/dashboard/analytics", icon: BarChart3, label: "Analytics" },
  ];

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f1115] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0f1115] text-white">
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
          fixed left-0 top-0 h-full border-r border-[#2d3139] bg-[#0f1115] flex flex-col z-50
          transition-all duration-300 ease-in-out
          w-64
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:w-[72px] lg:hover:w-64 group/sidebar
        `}
      >
        {/* Logo */}
        <div className="p-4 flex items-center gap-3 h-16">
          <div className="h-10 w-10 min-w-[40px] bg-blue-500 rounded-lg flex items-center justify-center text-white flex-shrink-0">
            <Mic className="h-5 w-5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight whitespace-nowrap overflow-hidden lg:opacity-0 lg:group-hover/sidebar:opacity-100 transition-opacity duration-300">
            FresherReady
          </h1>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 space-y-1 mt-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${
                isActive(item.href)
                  ? "bg-blue-500/10 text-blue-400"
                  : "text-slate-400 hover:bg-[#1c1f26] hover:text-white"
              }`}
              title={item.label}
            >
              <item.icon className="h-5 w-5 min-w-[20px] flex-shrink-0" />
              <span className="whitespace-nowrap overflow-hidden lg:opacity-0 lg:group-hover/sidebar:opacity-100 transition-opacity duration-300">
                {item.label}
              </span>
            </Link>
          ))}
        </nav>

        {/* User Profile & Sign out at bottom */}
        <div className="p-3 border-t border-[#2d3139] space-y-2">
          {/* User Profile */}
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[#1c1f26]">
            <div className="h-9 w-9 min-w-[36px] rounded-full bg-blue-600 flex items-center justify-center text-white font-medium text-sm flex-shrink-0">
              {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden lg:opacity-0 lg:group-hover/sidebar:opacity-100 transition-opacity duration-300">
              <p className="text-sm font-semibold text-white truncate">{user.name || "User"}</p>
              <p className="text-xs text-slate-400">Candidate</p>
            </div>
          </div>

          {/* Sign out button */}
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-[#1c1f26] hover:text-white transition-colors w-full"
            title="Sign out"
          >
            <LogOut className="h-5 w-5 min-w-[20px] flex-shrink-0" />
            <span className="whitespace-nowrap overflow-hidden lg:opacity-0 lg:group-hover/sidebar:opacity-100 transition-opacity duration-300">
              Sign out
            </span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-[72px] flex flex-col min-h-screen">
        {/* Mobile Header */}
        <header className="sticky top-0 z-30 w-full border-b border-[#2d3139] bg-[#0f1115]/95 backdrop-blur-md px-4 py-3 flex items-center justify-between lg:hidden">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 text-slate-400 hover:bg-[#1c1f26] hover:text-white rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-blue-500 rounded-lg flex items-center justify-center text-white">
              <Mic className="h-4 w-4" />
            </div>
            <span className="font-bold">FresherReady</span>
          </div>
          <div className="h-9 w-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium text-sm">
            {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
          </div>
        </header>

        {/* Desktop Top Bar */}
        <header className="hidden lg:flex sticky top-0 z-30 w-full border-b border-[#2d3139] bg-[#0f1115]/95 backdrop-blur-md px-8 py-2.5 items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-slate-400 text-sm">Welcome back,</span>
            <span className="text-white font-medium">{user.name || "User"}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-500">AI Mock Interview Platform</span>
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
