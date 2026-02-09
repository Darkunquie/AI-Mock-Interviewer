"use client";

import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Search } from "lucide-react";
import { toast } from "sonner";

interface UserRecord {
  id: number;
  email: string;
  name: string | null;
  phone: string | null;
  role: string;
  status: string;
  createdAt: string;
}

type StatusFilter = "all" | "pending" | "approved" | "rejected";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchUsers = async () => {
    try {
      const url = filter === "all"
        ? "/api/admin/users"
        : `/api/admin/users?status=${filter}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) setUsers(data.users);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchUsers();
  }, [filter]);

  const handleApprove = async (userId: number) => {
    setActionLoading(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/approve`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        fetchUsers();
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error("Failed to approve user");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (userId: number) => {
    setActionLoading(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/reject`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        fetchUsers();
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error("Failed to reject user");
    } finally {
      setActionLoading(null);
    }
  };

  const filteredUsers = users.filter((user) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      user.email.toLowerCase().includes(q) ||
      (user.name?.toLowerCase().includes(q) ?? false)
    );
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-yellow-400/10 text-yellow-400 border-yellow-400/20",
      approved: "bg-green-400/10 text-green-400 border-green-400/20",
      rejected: "bg-red-400/10 text-red-400 border-red-400/20",
    };
    return (
      <span
        className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest border ${
          styles[status] || "bg-zinc-800 text-zinc-400 border-zinc-700"
        }`}
      >
        {status}
      </span>
    );
  };

  const tabs: { label: string; value: StatusFilter }[] = [
    { label: "All", value: "all" },
    { label: "Pending", value: "pending" },
    { label: "Approved", value: "approved" },
    { label: "Rejected", value: "rejected" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
        <p className="text-zinc-500 text-xs uppercase tracking-widest mt-1">
          Approve or reject user accounts
        </p>
      </div>

      {/* Filter Tabs + Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
                filter === tab.value
                  ? "bg-yellow-400 text-[#0f0f0f]"
                  : "bg-[#161616] text-zinc-400 hover:text-white border border-white/[0.08]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-[#161616] border border-white/[0.08] text-white placeholder:text-zinc-600 text-sm focus:outline-none focus:border-yellow-400 transition-colors"
          />
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-yellow-400"></div>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="border border-white/[0.08] bg-[#161616] p-10 text-center">
          <p className="text-zinc-400 text-sm">No users found</p>
        </div>
      ) : (
        <div className="border border-white/[0.08] overflow-hidden">
          {/* Table Header */}
          <div className="hidden md:grid grid-cols-[1fr_1fr_120px_100px_100px_160px] gap-4 px-5 py-3 bg-[#161616] border-b border-white/[0.08]">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Name</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Email</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Phone</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Status</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Joined</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 text-right">Actions</span>
          </div>

          {/* Table Rows */}
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className="grid grid-cols-1 md:grid-cols-[1fr_1fr_120px_100px_100px_160px] gap-2 md:gap-4 px-5 py-4 border-b border-white/[0.08] last:border-b-0 hover:bg-[#161616]/50 transition-colors items-center"
            >
              {/* Name */}
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 min-w-[32px] bg-zinc-800 flex items-center justify-center text-zinc-300 font-bold text-xs flex-shrink-0">
                  {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium text-white truncate">
                  {user.name || "—"}
                </span>
              </div>

              {/* Email */}
              <span className="text-sm text-zinc-400 truncate">{user.email}</span>

              {/* Phone */}
              <span className="text-sm text-zinc-500 truncate hidden md:block">
                {user.phone || "—"}
              </span>

              {/* Status */}
              <div className="hidden md:block">{statusBadge(user.status)}</div>

              {/* Date */}
              <span className="text-xs text-zinc-500 hidden md:block">
                {user.createdAt ? formatDate(user.createdAt) : "—"}
              </span>

              {/* Actions */}
              <div className="flex items-center gap-2 md:justify-end">
                {/* Mobile status badge */}
                <div className="md:hidden mr-auto">{statusBadge(user.status)}</div>

                {user.status === "pending" && (
                  <>
                    <button
                      onClick={() => handleApprove(user.id)}
                      disabled={actionLoading === user.id}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-bold uppercase tracking-wider hover:bg-green-500/20 transition-colors disabled:opacity-50"
                    >
                      <CheckCircle className="h-3 w-3" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(user.id)}
                      disabled={actionLoading === user.id}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-wider hover:bg-red-500/20 transition-colors disabled:opacity-50"
                    >
                      <XCircle className="h-3 w-3" />
                      Reject
                    </button>
                  </>
                )}
                {user.status === "approved" && (
                  <button
                    onClick={() => handleReject(user.id)}
                    disabled={actionLoading === user.id}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-wider hover:bg-red-500/20 transition-colors disabled:opacity-50"
                  >
                    <XCircle className="h-3 w-3" />
                    Revoke
                  </button>
                )}
                {user.status === "rejected" && (
                  <button
                    onClick={() => handleApprove(user.id)}
                    disabled={actionLoading === user.id}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-bold uppercase tracking-wider hover:bg-green-500/20 transition-colors disabled:opacity-50"
                  >
                    <CheckCircle className="h-3 w-3" />
                    Approve
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
