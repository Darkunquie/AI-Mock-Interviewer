import { redirect } from "next/navigation";
import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { interviews } from "@/utils/schema";
import { getCurrentUser } from "@/lib/auth";
import Header from "./_components/Header";
import AddNewInterview from "./_components/AddNewInterview";
import InterviewList from "./_components/InterviewList";

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
  } catch (error) {
    // Database might not be set up yet
    console.log("Database not configured yet:", error);
  }

  return (
    <div>
      <Header />

      <div className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-white">Start New Interview</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <AddNewInterview />
        </div>
      </div>

      {userInterviews.length > 0 && (
        <div>
          <h2 className="mb-4 text-xl font-semibold text-white">Recent Interviews</h2>
          <InterviewList interviews={userInterviews} />
        </div>
      )}

      {userInterviews.length === 0 && (
        <div className="mt-8 rounded-xl border border-slate-700 bg-slate-800/30 p-8 text-center">
          <p className="text-slate-400">
            You haven&apos;t taken any interviews yet. Start your first mock interview to practice!
          </p>
        </div>
      )}
    </div>
  );
}
