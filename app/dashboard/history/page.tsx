"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  Loader2,
  Search,
  Filter,
  Calendar,
  Briefcase,
  TrendingUp,
  ArrowRight,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ROLE_DISPLAY_NAMES,
  EXPERIENCE_DISPLAY_NAMES,
  INTERVIEW_TYPE_DISPLAY_NAMES,
  InterviewRole,
  ExperienceLevel,
  InterviewType,
} from "@/types";

interface Interview {
  mockId: string;
  role: string;
  experienceLevel: string;
  interviewType: string;
  status: string | null;
  totalScore: number | null;
  createdAt: string;
}

interface Stats {
  totalInterviews: number;
  completedInterviews: number;
  averageScore: number;
  bestScore: number;
}

export default function HistoryPage() {
  const [loading, setLoading] = useState(true);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const fetchHistory = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (roleFilter !== "all") params.append("role", roleFilter);
      if (typeFilter !== "all") params.append("type", typeFilter);
      if (searchQuery) params.append("search", searchQuery);

      const response = await fetch(`/api/interview/history?${params}`);
      if (!response.ok) throw new Error("Failed to fetch history");

      const data = await response.json();
      setInterviews(data.interviews);
      setStats(data.stats);
    } catch {
      toast.error("Failed to load interview history");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, roleFilter, typeFilter, searchQuery]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const clearFilters = () => {
    setStatusFilter("all");
    setRoleFilter("all");
    setTypeFilter("all");
    setSearchQuery("");
  };

  const hasActiveFilters = statusFilter !== "all" || roleFilter !== "all" || typeFilter !== "all" || searchQuery;

  const getScoreColor = (score: number | null) => {
    if (score === null) return "text-slate-400";
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  const getStatusBadge = (status: string | null) => {
    if (status === "completed") {
      return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Completed</Badge>;
    }
    if (status === "in_progress") {
      return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">In Progress</Badge>;
    }
    return <Badge className="bg-slate-500/10 text-slate-400 border-slate-500/20">Pending</Badge>;
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Interview History</h1>
        <p className="mt-2 text-slate-400">
          View and filter all your past mock interviews
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-slate-700 bg-slate-800/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Total Interviews</p>
                  <p className="text-2xl font-bold text-white">{stats.totalInterviews}</p>
                </div>
                <Briefcase className="h-8 w-8 text-blue-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-700 bg-slate-800/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Completed</p>
                  <p className="text-2xl font-bold text-white">{stats.completedInterviews}</p>
                </div>
                <Calendar className="h-8 w-8 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-700 bg-slate-800/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Average Score</p>
                  <p className={`text-2xl font-bold ${getScoreColor(stats.averageScore)}`}>
                    {stats.averageScore > 0 ? `${stats.averageScore}%` : "N/A"}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-yellow-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-700 bg-slate-800/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Best Score</p>
                  <p className={`text-2xl font-bold ${getScoreColor(stats.bestScore)}`}>
                    {stats.bestScore > 0 ? `${stats.bestScore}%` : "N/A"}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="mb-6 border-slate-700 bg-slate-800/50">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search by role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-slate-600 bg-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px] border-slate-600 bg-slate-700 text-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="border-slate-600 bg-slate-800">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[150px] border-slate-600 bg-slate-700 text-white">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent className="border-slate-600 bg-slate-800">
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="frontend">Frontend</SelectItem>
                <SelectItem value="backend">Backend</SelectItem>
                <SelectItem value="fullstack">Full Stack</SelectItem>
                <SelectItem value="data">Data Engineer</SelectItem>
                <SelectItem value="devops">DevOps</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px] border-slate-600 bg-slate-700 text-white">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent className="border-slate-600 bg-slate-800">
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="technical">Technical</SelectItem>
                <SelectItem value="behavioral">Behavioral</SelectItem>
                <SelectItem value="hr">HR Round</SelectItem>
              </SelectContent>
            </Select>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="gap-2 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" /> Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {interviews.length === 0 ? (
        <Card className="border-slate-700 bg-slate-800/50">
          <CardContent className="py-12 text-center">
            <Filter className="mx-auto h-12 w-12 text-slate-600 mb-4" />
            <p className="text-slate-400">
              {hasActiveFilters
                ? "No interviews match your filters"
                : "You haven't taken any interviews yet"}
            </p>
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="mt-4 border-slate-600"
              >
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {interviews.map((interview) => (
            <Card
              key={interview.mockId}
              className="border-slate-700 bg-slate-800/50 transition-all hover:border-slate-600 hover:bg-slate-800"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg text-white">
                    {ROLE_DISPLAY_NAMES[interview.role as InterviewRole]}
                  </CardTitle>
                  {getStatusBadge(interview.status)}
                </div>
                <CardDescription className="text-slate-400">
                  {INTERVIEW_TYPE_DISPLAY_NAMES[interview.interviewType as InterviewType]} •{" "}
                  {EXPERIENCE_DISPLAY_NAMES[interview.experienceLevel as ExperienceLevel]}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(interview.createdAt), "MMM d, yyyy")}
                  </div>
                  {interview.status === "completed" && interview.totalScore !== null && (
                    <div className={`font-semibold ${getScoreColor(interview.totalScore)}`}>
                      Score: {interview.totalScore}%
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Link href={`/dashboard/interview/${interview.mockId}`} className="w-full">
                  <Button variant="outline" className="w-full gap-2 border-slate-600 hover:bg-slate-700">
                    {interview.status === "completed" ? "View Results" : "Continue"}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
