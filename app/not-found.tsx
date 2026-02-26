import Link from "next/link";
import { Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0f0f0f] px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-7xl font-bold text-yellow-400">404</h1>
          <h2 className="text-xl font-bold text-white">
            Page Not Found
          </h2>
          <p className="text-zinc-500 text-sm">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-6 py-3 bg-yellow-400 text-[#0f0f0f] font-bold text-xs uppercase tracking-[0.2em] hover:bg-white transition-all"
          >
            <Home className="w-4 h-4" />
            Dashboard
          </Link>
          <Link
            href="/"
            className="flex items-center gap-2 px-6 py-3 border border-white/[0.08] text-zinc-400 font-bold text-xs uppercase tracking-[0.2em] hover:text-white hover:border-white/20 transition-all"
          >
            <Search className="w-4 h-4" />
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
