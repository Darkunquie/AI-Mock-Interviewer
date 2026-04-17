"use client";

import { useEffect, useState } from "react";
import { Users, UserCheck, UserX, Clock, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { apiFetch } from "@/lib/client/api";

interface Stats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

interface PendingUser {
  id: number;
  email: string;
  name: string | null;
  phone: string | null;
  createdAt: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  const fetchData = async () => {
    try {
      const [statsRes, usersRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/users?status=pending"),
      ]);
      if (!statsRes.ok || !usersRes.ok) throw new Error("Request failed");
      const statsData = await statsRes.json();
      const usersData = await usersRes.json();
      if (statsData.success) setStats(statsData.stats);
      else throw new Error(statsData.error || "Failed to load stats");
      if (usersData.success) setPendingUsers(usersData.users);
      else throw new Error(usersData.error || "Failed to load users");
    } catch {
      toast.error("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleApprove = async (userId: number) => {
    setActionLoading(userId);
    try {
      const res = await apiFetch(`/api/admin/users/${userId}/approve`, { method: "POST" });
      if (!res.ok) throw new Error("Request failed");
      const data = await res.json();
      if (data.success) { toast.success(data.message); fetchData(); }
      else toast.error(data.error);
    } catch {
      toast.error("Failed to approve user");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (userId: number) => {
    setActionLoading(userId);
    try {
      const res = await apiFetch(`/api/admin/users/${userId}/reject`, { method: "POST" });
      if (!res.ok) throw new Error("Request failed");
      const data = await res.json();
      if (data.success) { toast.success(data.message); fetchData(); }
      else toast.error(data.error);
    } catch {
      toast.error("Failed to reject user");
    } finally {
      setActionLoading(null);
    }
  };

  const runBulkAction = async (opts: {
    path: (userId: number) => string;
    body?: unknown;
    successLabel: string;
    failureToast: string;
  }) => {
    const results = await Promise.allSettled(
      pendingUsers.map((user) =>
        apiFetch(opts.path(user.id), {
          method: "POST",
          ...(opts.body !== undefined && {
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(opts.body),
          }),
        }).then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
      )
    );
    const succeeded = results.filter((r) => r.status === "fulfilled" && (r.value as { success: boolean }).success).length;
    const failed = results.length - succeeded;
    if (succeeded === 0 && failed > 0) toast.error(opts.failureToast);
    else if (failed === 0) toast.success(`All ${succeeded} users ${opts.successLabel}`);
    else toast.warning(`${succeeded} ${opts.successLabel}, ${failed} failed`);
    await fetchData();
  };

  const handleBulkApprove = async () => {
    setBulkLoading(true);
    try {
      await runBulkAction({
        path: (id) => `/api/admin/users/${id}/approve`,
        successLabel: "approved",
        failureToast: "Failed to approve users",
      });
    } catch {
      toast.error("Failed to approve users");
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkReject = async () => {
    setBulkLoading(true);
    try {
      await runBulkAction({
        path: (id) => `/api/admin/users/${id}/reject`,
        successLabel: "rejected",
        failureToast: "Failed to reject users",
      });
    } catch {
      toast.error("Failed to reject users");
    } finally {
      setBulkLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-yellow-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-zinc-500 text-xs uppercase tracking-widest mt-1">User management overview</p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="border border-white/[0.08] bg-[#161616] p-5">
            <div className="flex items-center gap-3 mb-3">
              <Users className="h-5 w-5 text-zinc-400" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Total Users</span>
            </div>
            <p className="text-3xl font-bold">{stats.total}</p>
          </div>
          <div className="border border-yellow-400/20 bg-yellow-400/5 p-5">
            <div className="flex items-center gap-3 mb-3">
              <Clock className="h-5 w-5 text-yellow-400" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-yellow-400">Pending</span>
            </div>
            <p className="text-3xl font-bold text-yellow-400">{stats.pending}</p>
          </div>
          <div className="border border-green-400/20 bg-green-400/5 p-5">
            <div className="flex items-center gap-3 mb-3">
              <UserCheck className="h-5 w-5 text-green-400" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-green-400">Approved</span>
            </div>
            <p className="text-3xl font-bold text-green-400">{stats.approved}</p>
          </div>
          <div className="border border-red-400/20 bg-red-400/5 p-5">
            <div className="flex items-center gap-3 mb-3">
              <UserX className="h-5 w-5 text-red-400" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-red-400">Rejected</span>
            </div>
            <p className="text-3xl font-bold text-red-400">{stats.rejected}</p>
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-4 gap-4">
          <h2 className="text-lg font-bold">Pending Approvals</h2>
          <div className="flex items-center gap-2">
            {pendingUsers.length > 0 && (
              <>
                <button
                  onClick={handleBulkApprove}
                  disabled={bulkLoading}
                  className="flex items-center gap-1.5 px-3 py-2 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold uppercase tracking-wider hover:bg-green-500/20 transition-colors disabled:opacity-50"
                >
                  <CheckCircle className="h-3.5 w-3.5" />
                  {bulkLoading ? "Approving..." : `Approve All (${pendingUsers.length})`}
                </button>
                <button
                  onClick={() => {
                    if (globalThis.confirm(`Reject all ${pendingUsers.length} pending users?`)) {
                      handleBulkReject();
                    }
                  }}
                  disabled={bulkLoading}
                  className="flex items-center gap-1.5 px-3 py-2 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold uppercase tracking-wider hover:bg-red-500/20 transition-colors disabled:opacity-50"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  {bulkLoading ? "Rejecting..." : "Reject All"}
                </button>
              </>
            )}
            <Link href="/admin/users" className="text-yellow-400 text-xs font-bold uppercase tracking-wider hover:text-white transition-colors">
              View all users
            </Link>
          </div>
        </div>

        {pendingUsers.length === 0 ? (
          <div className="border border-white/[0.08] bg-[#161616] p-10 text-center">
            <UserCheck className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-400 text-sm">No pending approvals</p>
            <p className="text-zinc-600 text-xs mt-1">All users have been reviewed</p>
          </div>
        ) : (
          <div className="space-y-2">
            {pendingUsers.map((user) => (
              <div key={user.id} className="border border-white/[0.08] bg-[#161616] p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="h-10 w-10 min-w-[40px] bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center text-yellow-400 font-bold text-sm flex-shrink-0">
                    {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">{user.name || "No name"}</p>
                    <p className="text-xs text-zinc-500 truncate">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleApprove(user.id)}
                    disabled={actionLoading === user.id || bulkLoading}
                    className="flex items-center gap-1.5 px-3 py-2 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold uppercase tracking-wider hover:bg-green-500/20 transition-colors disabled:opacity-50"
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(user.id)}
                    disabled={actionLoading === user.id || bulkLoading}
                    className="flex items-center gap-1.5 px-3 py-2 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold uppercase tracking-wider hover:bg-red-500/20 transition-colors disabled:opacity-50"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
