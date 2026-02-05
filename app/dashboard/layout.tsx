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
  Bell,
  Menu,
  X
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
  const [showMenu, setShowMenu] = useState(false);
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

        {/* Sign out at bottom */}
        <div className="p-3 border-t border-[#2d3139]">
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
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 w-full border-b border-[#2d3139] bg-[#0f1115]/95 backdrop-blur-md px-4 lg:px-8 py-3 flex items-center justify-between">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 text-slate-400 hover:bg-[#1c1f26] hover:text-white rounded-lg lg:hidden transition-colors"
            aria-label="Toggle menu"
          >
            {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>

          {/* Mobile Logo */}
          <div className="flex items-center gap-2 lg:hidden">
            <div className="h-8 w-8 bg-blue-500 rounded-lg flex items-center justify-center text-white">
              <Mic className="h-4 w-4" />
            </div>
            <span className="font-bold">FresherReady</span>
          </div>

          {/* Spacer */}
          <div className="flex-1 hidden lg:block"></div>

          {/* Right Side */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Notifications */}
            <button className="p-2 text-slate-400 hover:bg-[#1c1f26] hover:text-white rounded-full relative transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full border-2 border-[#0f1115]"></span>
            </button>

            <div className="h-8 w-px bg-[#2d3139] mx-1 hidden sm:block"></div>

            {/* User Profile */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-2 sm:gap-3 cursor-pointer group"
              >
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold">{user.name || "User"}</p>
                  <p className="text-xs text-slate-400">Candidate</p>
                </div>
                <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full border-2 border-blue-500/20 p-0.5 group-hover:border-blue-500/50 transition-colors">
                  <div className="w-full h-full rounded-full bg-blue-600 flex items-center justify-center text-white font-medium text-sm">
                    {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                  </div>
                </div>
              </button>

              {/* Dropdown Menu */}
              {showMenu && (
                <>
                  {/* Backdrop to close dropdown */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-[#1c1f26] border border-[#2d3139] rounded-xl shadow-lg py-1 z-50">
                    <div className="px-4 py-2 border-b border-[#2d3139]">
                      <p className="text-sm font-medium text-white truncate">{user.name}</p>
                      <p className="text-xs text-slate-400 truncate">{user.email}</p>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-[#2d3139] transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
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
