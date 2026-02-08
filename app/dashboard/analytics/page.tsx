"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, TrendingUp, TrendingDown, Target, Award, Calendar, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface AnalyticsData {
  overview: {
    totalInterviews: number;
    completedInterviews: number;
    averageScore: number;
    bestScore: number;
    worstScore: number;
    improvementRate: number;
  };
  scoreHistory: Array<{
    date: string;
    score: number;
    role: string;
  }>;
  scoreByRole: Array<{
    role: string;
    avgScore: number;
    count: number;
  }>;
  scoreByType: Array<{
    type: string;
    avgScore: number;
    count: number;
  }>;
  skillBreakdown: {
    technical: number;
    communication: number;
    depth: number;
  };
  recentTrend: "improving" | "declining" | "stable";
}

const COLORS = ["#facc15", "#f97316", "#22c55e", "#ef4444", "#8b5cf6", "#06b6d4"];

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData | null>(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      const response = await fetch("/api/interview/analytics");
      if (!response.ok) throw new Error("Failed to fetch analytics");
      const result = await response.json();
      setData(result);
    } catch {
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-yellow-400" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <BarChart3 className="h-16 w-16 text-zinc-700 mb-4" />
        <p className="text-zinc-400">No analytics data available yet.</p>
        <p className="text-sm text-zinc-600 mt-2">Complete some interviews to see your progress!</p>
      </div>
    );
  }

  const { overview, scoreHistory, scoreByRole, scoreByType, skillBreakdown, recentTrend } = data;

  const getTrendIcon = () => {
    if (recentTrend === "improving") return <TrendingUp className="h-5 w-5 text-green-500" />;
    if (recentTrend === "declining") return <TrendingDown className="h-5 w-5 text-red-500" />;
    return <Target className="h-5 w-5 text-yellow-500" />;
  };

  const getTrendBadge = () => {
    if (recentTrend === "improving") {
      return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Improving</Badge>;
    }
    if (recentTrend === "declining") {
      return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Needs Attention</Badge>;
    }
    return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Stable</Badge>;
  };

  const skillData = [
    { name: "Technical", value: skillBreakdown.technical, color: "#facc15" },
    { name: "Communication", value: skillBreakdown.communication, color: "#f97316" },
    { name: "Depth", value: skillBreakdown.depth, color: "#22c55e" },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500 mb-1">Performance</p>
          <h1 className="text-3xl font-bold text-white">Progress Analytics</h1>
          <p className="mt-2 text-zinc-500 text-sm">
            Track your interview performance and identify areas for improvement
          </p>
        </div>
        <div className="flex items-center gap-2">
          {getTrendIcon()}
          {getTrendBadge()}
        </div>
      </div>

      {/* Overview Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-white/[0.08] bg-[#161616]">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Total Interviews</p>
                <p className="text-3xl font-black text-yellow-400">{overview.totalInterviews}</p>
              </div>
              <Calendar className="h-10 w-10 text-yellow-400 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-white/[0.08] bg-[#161616]">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Average Score</p>
                <p className="text-3xl font-black text-orange-500">{overview.averageScore}%</p>
              </div>
              <Target className="h-10 w-10 text-orange-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-white/[0.08] bg-[#161616]">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Best Score</p>
                <p className="text-3xl font-black text-emerald-500">{overview.bestScore}%</p>
              </div>
              <Award className="h-10 w-10 text-emerald-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-white/[0.08] bg-[#161616]">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Improvement</p>
                <p className={`text-3xl font-black ${overview.improvementRate >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                  {overview.improvementRate >= 0 ? "+" : ""}{overview.improvementRate}%
                </p>
              </div>
              {overview.improvementRate >= 0 ? (
                <TrendingUp className="h-10 w-10 text-emerald-500 opacity-50" />
              ) : (
                <TrendingDown className="h-10 w-10 text-red-500 opacity-50" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        {/* Score History */}
        <Card className="border-white/[0.08] bg-[#161616]">
          <CardHeader>
            <CardTitle className="text-white">Score Trend</CardTitle>
            <CardDescription className="text-zinc-500">
              Your interview scores over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            {scoreHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={scoreHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="date" stroke="#71717a" fontSize={12} />
                  <YAxis stroke="#71717a" fontSize={12} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#161616",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "0",
                    }}
                    labelStyle={{ color: "#fff" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#facc15"
                    strokeWidth={2}
                    dot={{ fill: "#facc15", strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-zinc-500">
                Complete more interviews to see your trend
              </div>
            )}
          </CardContent>
        </Card>

        {/* Skill Breakdown */}
        <Card className="border-white/[0.08] bg-[#161616]">
          <CardHeader>
            <CardTitle className="text-white">Skill Breakdown</CardTitle>
            <CardDescription className="text-zinc-500">
              Average scores by skill category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={skillData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value, x, y }) => (
                    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="middle" fontSize={12}>
                      {`${name}: ${value}/10`}
                    </text>
                  )}
                  labelLine={{ stroke: "#71717a" }}
                >
                  {skillData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Legend
                  formatter={(value) => <span style={{ color: "#fff" }}>{value}</span>}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#161616",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "0",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Score by Role */}
        <Card className="border-white/[0.08] bg-[#161616]">
          <CardHeader>
            <CardTitle className="text-white">Performance by Role</CardTitle>
            <CardDescription className="text-zinc-500">
              Average score for each role type
            </CardDescription>
          </CardHeader>
          <CardContent>
            {scoreByRole.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={scoreByRole} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis type="number" stroke="#71717a" fontSize={12} domain={[0, 100]} />
                  <YAxis dataKey="role" type="category" stroke="#71717a" fontSize={12} width={80} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#161616",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "0",
                    }}
                    formatter={(value) => [`${value ?? 0}%`, "Avg Score"]}
                  />
                  <Bar dataKey="avgScore" fill="#facc15" radius={[0, 0, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-zinc-500">
                No role data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Score by Type */}
        <Card className="border-white/[0.08] bg-[#161616]">
          <CardHeader>
            <CardTitle className="text-white">Performance by Type</CardTitle>
            <CardDescription className="text-zinc-500">
              Average score for each interview type
            </CardDescription>
          </CardHeader>
          <CardContent>
            {scoreByType.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={scoreByType}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="type" stroke="#71717a" fontSize={12} />
                  <YAxis stroke="#71717a" fontSize={12} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#161616",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "0",
                    }}
                    formatter={(value) => [`${value ?? 0}%`, "Avg Score"]}
                  />
                  <Bar dataKey="avgScore" radius={[0, 0, 0, 0]}>
                    {scoreByType.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-zinc-500">
                No type data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
