"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, Trophy, Medal, Crown, Users, Star } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";

interface LeaderboardEntry {
  rank: number;
  userId: number;
  name: string;
  imageUrl: string | null;
  averageScore: number;
  bestScore: number;
  totalInterviews: number;
  primaryRole: string;
}

interface LeaderboardData {
  leaderboard: LeaderboardEntry[];
  currentUserRank: number | null;
  currentUserId: number;
  totalUsers: number;
}

const PERIODS = [
  { value: "all", label: "All Time" },
  { value: "month", label: "This Month" },
  { value: "week", label: "This Week" },
];

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [period, setPeriod] = useState("all");

  const fetchLeaderboard = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (period !== "all") params.set("period", period);

      const response = await fetch(`/api/interview/leaderboard?${params}`);
      if (!response.ok) throw new Error("Failed to fetch");
      const result = await response.json();
      setData(result);
    } catch {
      toast.error("Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-400";
    if (score >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-emerald-400/10 border-emerald-400/20";
    if (score >= 60) return "bg-yellow-400/10 border-yellow-400/20";
    return "bg-red-400/10 border-red-400/20";
  };

  const getRankDisplay = (rank: number) => {
    if (rank === 1) return <Crown className="h-6 w-6 text-yellow-400" />;
    if (rank === 2) return <Medal className="h-6 w-6 text-zinc-300" />;
    if (rank === 3) return <Medal className="h-6 w-6 text-orange-600" />;
    return <span className="text-sm font-bold text-zinc-500">#{rank}</span>;
  };

  const getRankBorder = (rank: number, isCurrentUser: boolean) => {
    if (isCurrentUser) return "border-yellow-400/40 bg-yellow-400/5";
    if (rank === 1) return "border-yellow-400/20 bg-yellow-400/5";
    if (rank === 2) return "border-zinc-400/20 bg-zinc-400/5";
    if (rank === 3) return "border-orange-600/20 bg-orange-600/5";
    return "border-white/[0.08] bg-[#161616]";
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      "bg-orange-500",
      "bg-blue-500",
      "bg-emerald-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-cyan-500",
      "bg-yellow-500",
      "bg-red-500",
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-yellow-400" />
      </div>
    );
  }

  if (!data || data.leaderboard.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <Trophy className="h-16 w-16 text-zinc-600" />
        <p className="text-zinc-400 text-lg">No leaderboard data yet</p>
        <p className="text-zinc-600 text-sm">Complete interviews to appear on the leaderboard</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <Trophy className="h-7 w-7 text-yellow-400" />
              Leaderboard
            </h1>
            <p className="text-zinc-500 text-sm mt-1">
              Top performers ranked by average interview score
            </p>
          </div>
          {data.currentUserRank && (
            <div className="text-right">
              <p className="text-xs text-zinc-500 uppercase tracking-wider">Your Rank</p>
              <p className="text-3xl font-bold text-yellow-400">#{data.currentUserRank}</p>
              <p className="text-xs text-zinc-600">of {data.totalUsers} users</p>
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="border-white/[0.08] bg-[#161616]">
          <CardContent className="pt-4 pb-4 text-center">
            <Users className="h-5 w-5 text-zinc-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-white">{data.totalUsers}</p>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Active Users</p>
          </CardContent>
        </Card>
        <Card className="border-white/[0.08] bg-[#161616]">
          <CardContent className="pt-4 pb-4 text-center">
            <Star className="h-5 w-5 text-yellow-400 mx-auto mb-1" />
            <p className="text-2xl font-bold text-white">
              {data.leaderboard[0]?.averageScore || 0}%
            </p>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Top Score</p>
          </CardContent>
        </Card>
        <Card className="border-white/[0.08] bg-[#161616]">
          <CardContent className="pt-4 pb-4 text-center">
            <Trophy className="h-5 w-5 text-orange-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-white truncate text-sm">
              {data.leaderboard[0]?.name || "-"}
            </p>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">#1 Leader</p>
          </CardContent>
        </Card>
      </div>

      {/* Period Filter */}
      <div className="flex gap-2 mb-6">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={`px-4 py-2 text-xs uppercase tracking-wider font-medium transition-colors ${
              period === p.value
                ? "bg-yellow-400/10 text-yellow-400 border border-yellow-400/30"
                : "bg-[#161616] text-zinc-500 border border-white/[0.08] hover:text-white hover:bg-white/5"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Leaderboard List */}
      <Card className="border-white/[0.08] bg-[#0f0f0f]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-zinc-400 uppercase tracking-wider">Rankings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.leaderboard.map((entry) => {
            const isCurrentUser = entry.userId === data.currentUserId;
            return (
              <div
                key={entry.userId}
                className={`flex items-center gap-4 p-4 border transition-colors ${getRankBorder(
                  entry.rank,
                  isCurrentUser
                )} ${isCurrentUser ? "ring-1 ring-yellow-400/30" : ""}`}
              >
                {/* Rank */}
                <div className="w-10 flex items-center justify-center flex-shrink-0">
                  {getRankDisplay(entry.rank)}
                </div>

                {/* Avatar */}
                <div
                  className={`h-10 w-10 flex-shrink-0 flex items-center justify-center text-white font-bold text-sm ${getAvatarColor(
                    entry.name
                  )}`}
                >
                  {entry.name.charAt(0).toUpperCase()}
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-white truncate">
                      {entry.name}
                      {isCurrentUser && (
                        <span className="text-yellow-400 text-xs ml-2">(You)</span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <Badge
                      variant="outline"
                      className="border-white/[0.1] text-zinc-400 text-[10px] px-1.5 py-0"
                    >
                      {entry.primaryRole}
                    </Badge>
                    <span className="text-[10px] text-zinc-600">
                      {entry.totalInterviews} interview{entry.totalInterviews !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>

                {/* Scores */}
                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] text-zinc-600 uppercase">Best</p>
                    <p className="text-sm font-bold text-zinc-400">{entry.bestScore}%</p>
                  </div>
                  <div
                    className={`text-center px-4 py-2 border ${getScoreBg(entry.averageScore)}`}
                  >
                    <p className="text-[10px] text-zinc-500 uppercase">Avg</p>
                    <p className={`text-xl font-bold ${getScoreColor(entry.averageScore)}`}>
                      {entry.averageScore}%
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Current user not in top 50 message */}
      {data.currentUserRank && data.currentUserRank > 50 && (
        <div className="mt-4 text-center py-4 border border-yellow-400/20 bg-yellow-400/5">
          <p className="text-yellow-400 text-sm">
            You&apos;re ranked <span className="font-bold">#{data.currentUserRank}</span> — keep practicing to climb higher!
          </p>
        </div>
      )}
    </div>
  );
}
