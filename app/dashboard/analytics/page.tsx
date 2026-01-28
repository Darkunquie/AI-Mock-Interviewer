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

const COLORS = ["#3b82f6", "#22c55e", "#eab308", "#ef4444", "#8b5cf6", "#06b6d4"];

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
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <BarChart3 className="h-16 w-16 text-slate-600 mb-4" />
        <p className="text-slate-400">No analytics data available yet.</p>
        <p className="text-sm text-slate-500 mt-2">Complete some interviews to see your progress!</p>
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
    { name: "Technical", value: skillBreakdown.technical, color: "#3b82f6" },
    { name: "Communication", value: skillBreakdown.communication, color: "#22c55e" },
    { name: "Depth", value: skillBreakdown.depth, color: "#8b5cf6" },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Progress Analytics</h1>
          <p className="mt-2 text-slate-400">
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
        <Card className="border-slate-700 bg-slate-800/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total Interviews</p>
                <p className="text-3xl font-bold text-white">{overview.totalInterviews}</p>
              </div>
              <Calendar className="h-10 w-10 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-700 bg-slate-800/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Average Score</p>
                <p className="text-3xl font-bold text-white">{overview.averageScore}%</p>
              </div>
              <Target className="h-10 w-10 text-yellow-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-700 bg-slate-800/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Best Score</p>
                <p className="text-3xl font-bold text-green-500">{overview.bestScore}%</p>
              </div>
              <Award className="h-10 w-10 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-700 bg-slate-800/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Improvement</p>
                <p className={`text-3xl font-bold ${overview.improvementRate >= 0 ? "text-green-500" : "text-red-500"}`}>
                  {overview.improvementRate >= 0 ? "+" : ""}{overview.improvementRate}%
                </p>
              </div>
              {overview.improvementRate >= 0 ? (
                <TrendingUp className="h-10 w-10 text-green-500 opacity-50" />
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
        <Card className="border-slate-700 bg-slate-800/50">
          <CardHeader>
            <CardTitle className="text-white">Score Trend</CardTitle>
            <CardDescription className="text-slate-400">
              Your interview scores over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            {scoreHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={scoreHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #334155",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "#fff" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: "#3b82f6", strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-slate-400">
                Complete more interviews to see your trend
              </div>
            )}
          </CardContent>
        </Card>

        {/* Skill Breakdown */}
        <Card className="border-slate-700 bg-slate-800/50">
          <CardHeader>
            <CardTitle className="text-white">Skill Breakdown</CardTitle>
            <CardDescription className="text-slate-400">
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
                  label={({ name, value }) => `${name}: ${value}/10`}
                  labelLine={{ stroke: "#94a3b8" }}
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
                    backgroundColor: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: "8px",
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
        <Card className="border-slate-700 bg-slate-800/50">
          <CardHeader>
            <CardTitle className="text-white">Performance by Role</CardTitle>
            <CardDescription className="text-slate-400">
              Average score for each role type
            </CardDescription>
          </CardHeader>
          <CardContent>
            {scoreByRole.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={scoreByRole} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={12} domain={[0, 100]} />
                  <YAxis dataKey="role" type="category" stroke="#94a3b8" fontSize={12} width={80} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #334155",
                      borderRadius: "8px",
                    }}
                    formatter={(value) => [`${value ?? 0}%`, "Avg Score"]}
                  />
                  <Bar dataKey="avgScore" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-slate-400">
                No role data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Score by Type */}
        <Card className="border-slate-700 bg-slate-800/50">
          <CardHeader>
            <CardTitle className="text-white">Performance by Type</CardTitle>
            <CardDescription className="text-slate-400">
              Average score for each interview type
            </CardDescription>
          </CardHeader>
          <CardContent>
            {scoreByType.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={scoreByType}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="type" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #334155",
                      borderRadius: "8px",
                    }}
                    formatter={(value) => [`${value ?? 0}%`, "Avg Score"]}
                  />
                  <Bar dataKey="avgScore" radius={[4, 4, 0, 0]}>
                    {scoreByType.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-slate-400">
                No type data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
