"use client";

import InterviewCard from "./InterviewCard";

interface InterviewListProps {
  interviews: Array<{
    mockId: string;
    role: string;
    experienceLevel: string;
    interviewType: string;
    status: string | null;
    totalScore: number | null;
    createdAt: Date | null;
  }>;
}

export default function InterviewList({ interviews }: InterviewListProps) {
  if (interviews.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {interviews.map((interview) => (
        <InterviewCard key={interview.mockId} interview={interview} />
      ))}
    </div>
  );
}
