"use client";

import Link from "next/link";
import { format } from "date-fns";
import { Calendar, Briefcase, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  ROLE_DISPLAY_NAMES,
  EXPERIENCE_DISPLAY_NAMES,
  INTERVIEW_TYPE_DISPLAY_NAMES,
  InterviewRole,
  ExperienceLevel,
  InterviewType,
} from "@/types";

interface InterviewCardProps {
  interview: {
    mockId: string;
    role: string;
    experienceLevel: string;
    interviewType: string;
    status: string | null;
    totalScore: number | null;
    createdAt: Date | null;
  };
}

export default function InterviewCard({ interview }: InterviewCardProps) {
  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "completed":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "in_progress":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  const getScoreColor = (score: number | null) => {
    if (!score) return "text-slate-400";
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <Card className="border-slate-700 bg-slate-800/50 transition-all hover:bg-slate-800">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg text-white">
              {ROLE_DISPLAY_NAMES[interview.role as InterviewRole] || interview.role}
            </CardTitle>
            <CardDescription className="mt-1 text-slate-400">
              {INTERVIEW_TYPE_DISPLAY_NAMES[interview.interviewType as InterviewType] || interview.interviewType}
            </CardDescription>
          </div>
          <Badge variant="outline" className={getStatusColor(interview.status)}>
            {interview.status === "completed"
              ? "Completed"
              : interview.status === "in_progress"
              ? "In Progress"
              : "Pending"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-4 text-sm text-slate-400">
          <div className="flex items-center gap-1">
            <Briefcase className="h-4 w-4" />
            {EXPERIENCE_DISPLAY_NAMES[interview.experienceLevel as ExperienceLevel] || interview.experienceLevel}
          </div>
          {interview.createdAt && (
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {format(new Date(interview.createdAt), "MMM d, yyyy")}
            </div>
          )}
        </div>

        {interview.status === "completed" && interview.totalScore !== null && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Score</span>
              <span className={`font-semibold ${getScoreColor(interview.totalScore)}`}>
                {interview.totalScore}%
              </span>
            </div>
            <Progress value={interview.totalScore} className="h-2" />
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Link href={`/dashboard/interview/${interview.mockId}`} className="w-full">
          <Button variant="outline" className="w-full gap-2 border-slate-600 hover:bg-slate-700">
            {interview.status === "completed" ? "View Results" : "Continue Interview"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
