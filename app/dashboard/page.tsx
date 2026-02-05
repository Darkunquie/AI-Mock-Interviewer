import { redirect } from "next/navigation";
import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { interviews } from "@/utils/schema";
import { getCurrentUser } from "@/lib/auth";
import Link from "next/link";
import { CheckCircle, TrendingUp, Flame, Mic, ArrowRight, Map } from "lucide-react";
import AddNewInterview from "./_components/AddNewInterview";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Fetch user's interviews
  let userInterviews: Array<{
    mockId: string;
    role: string;
    experienceLevel: string;
    interviewType: string;
    status: string | null;
    totalScore: number | null;
    createdAt: Date | null;
  }> = [];

  let stats = {
    totalInterviews: 0,
    averageScore: 0,
    thisWeekCount: 0,
  };

  try {
    userInterviews = await db
      .select({
        mockId: interviews.mockId,
        role: interviews.role,
        experienceLevel: interviews.experienceLevel,
        interviewType: interviews.interviewType,
        status: interviews.status,
        totalScore: interviews.totalScore,
        createdAt: interviews.createdAt,
      })
      .from(interviews)
      .where(eq(interviews.userId, user.id))
      .orderBy(desc(interviews.createdAt))
      .limit(20);

    // Calculate stats
    const completedInterviews = userInterviews.filter(i => i.status === "completed");
    stats.totalInterviews = completedInterviews.length;

    if (completedInterviews.length > 0) {
      const totalScores = completedInterviews
        .filter(i => i.totalScore !== null)
        .reduce((sum, i) => sum + (i.totalScore || 0), 0);
      const scoredCount = completedInterviews.filter(i => i.totalScore !== null).length;
      stats.averageScore = scoredCount > 0 ? Math.round(totalScores / scoredCount) : 0;
    }

    // Count this week's interviews
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    stats.thisWeekCount = userInterviews.filter(
      i => i.createdAt && new Date(i.createdAt) > oneWeekAgo
    ).length;

  } catch (error) {
    console.log("Database not configured yet:", error);
  }

  const firstName = user.name?.split(" ")[0] || "there";

  return (
    <div className="space-y-8">
      {/* Page Heading */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-white">
            Welcome back, {firstName}!
          </h2>
          <p className="text-slate-400 mt-1">
            Ready for your next AI-powered technical session?
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/practice"
            className="flex items-center gap-2 px-4 py-2 border border-[#2d3139] rounded-lg text-sm font-semibold hover:bg-[#1c1f26] transition-colors"
          >
            <Map className="h-5 w-5" />
            Learning Paths
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#1c1f26] p-6 rounded-xl border border-[#2d3139]">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">
              Interviews Completed
            </p>
            <CheckCircle className="h-5 w-5 text-blue-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold">{stats.totalInterviews}</p>
            {stats.thisWeekCount > 0 && (
              <p className="text-sm font-bold text-emerald-500">
                +{stats.thisWeekCount} this week
              </p>
            )}
          </div>
        </div>

        <div className="bg-[#1c1f26] p-6 rounded-xl border border-[#2d3139]">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">
              Average Score
            </p>
            <TrendingUp className="h-5 w-5 text-blue-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold">
              {stats.averageScore > 0 ? `${stats.averageScore}%` : "—"}
            </p>
            {stats.averageScore >= 80 && (
              <p className="text-sm font-bold text-emerald-500">Great job!</p>
            )}
          </div>
        </div>

        <div className="bg-[#1c1f26] p-6 rounded-xl border border-[#2d3139]">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">
              Practice Streak
            </p>
            <Flame className="h-5 w-5 text-orange-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold">{stats.thisWeekCount > 0 ? "Active" : "Start today!"}</p>
            <p className="text-sm font-bold text-slate-400">Keep it up!</p>
          </div>
        </div>
      </div>

      {/* Start New Interview Section */}
      <div>
        <h3 className="text-xl font-bold mb-4">Start New Interview</h3>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <AddNewInterview />
        </div>
      </div>

      {/* Recent Interviews */}
      {userInterviews.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold">Recent Interviews</h3>
            <Link
              href="/dashboard/history"
              className="text-sm font-semibold text-blue-400 hover:underline"
            >
              View all history
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {userInterviews.slice(0, 6).map((interview) => (
              <InterviewCard key={interview.mockId} interview={interview} />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {userInterviews.length === 0 && (
        <div className="rounded-xl border border-[#2d3139] bg-[#1c1f26] p-8 text-center">
          <Mic className="h-12 w-12 text-blue-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No interviews completed yet</h3>
          <p className="text-slate-400">
            Click the card above to start your first mock interview!
          </p>
        </div>
      )}
    </div>
  );
}

// Interview Card Component
function InterviewCard({
  interview,
}: {
  interview: {
    mockId: string;
    role: string;
    experienceLevel: string;
    interviewType: string;
    status: string | null;
    totalScore: number | null;
    createdAt: Date | null;
  };
}) {
  const score = interview.totalScore || 0;
  const isCompleted = interview.status === "completed";
  const circumference = 2 * Math.PI * 28;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  // Format date
  const formatDate = (date: Date | null) => {
    if (!date) return "";
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    return `${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? "s" : ""} ago`;
  };

  // Format role name
  const formatRole = (role: string) => {
    return role
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div className="bg-[#1c1f26] border border-[#2d3139] rounded-xl overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-5 flex flex-col gap-4">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="font-bold text-lg">{formatRole(interview.role)}</h4>
            <p className="text-xs text-slate-400">
              {interview.experienceLevel} • {interview.interviewType}
            </p>
          </div>
          <div
            className={`text-[10px] font-black px-2 py-1 rounded uppercase ${
              isCompleted
                ? "bg-emerald-500/20 text-emerald-400"
                : "bg-yellow-500/20 text-yellow-400"
            }`}
          >
            {isCompleted ? "Completed" : "In Progress"}
          </div>
        </div>

        {isCompleted && score > 0 && (
          <div className="flex items-center gap-6 py-2">
            {/* Progress Circle */}
            <div className="relative w-16 h-16 flex items-center justify-center">
              <svg className="w-16 h-16 -rotate-90">
                <circle
                  className="text-slate-700"
                  cx="32"
                  cy="32"
                  r="28"
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="6"
                />
                <circle
                  className="text-blue-500"
                  cx="32"
                  cy="32"
                  r="28"
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="6"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute text-sm font-bold">{score}%</span>
            </div>

            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Overall Score</span>
                <span className="font-bold">{score}%</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-1.5">
                <div
                  className="bg-blue-500 h-1.5 rounded-full"
                  style={{ width: `${score}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-[#2d3139] flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {formatDate(interview.createdAt)}
          </span>
          <Link
            href={
              isCompleted
                ? `/dashboard/interview/${interview.mockId}/feedback`
                : `/dashboard/interview/${interview.mockId}/start`
            }
            className="text-xs font-bold text-blue-400 hover:underline flex items-center gap-1"
          >
            {isCompleted ? "Review Feedback" : "Continue"}
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
