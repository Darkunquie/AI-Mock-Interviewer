"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Play, ArrowRight, Clock, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Question,
  ROLE_DISPLAY_NAMES,
  EXPERIENCE_DISPLAY_NAMES,
  INTERVIEW_TYPE_DISPLAY_NAMES,
  InterviewRole,
  ExperienceLevel,
  InterviewType,
} from "@/types";

interface InterviewData {
  interview: {
    mockId: string;
    role: string;
    experienceLevel: string;
    interviewType: string;
    status: string;
    questions: Question[];
    createdAt: string;
  };
  answers: Array<{
    questionIndex: number;
    questionText: string;
    userAnswer: string;
    technicalScore: number;
    communicationScore: number;
    depthScore: number;
  }>;
  summary: {
    overallScore: number;
    rating: string;
    strengths: string[];
    weaknesses: string[];
  } | null;
}

export default function InterviewDetailPage() {
  const params = useParams();
  const router = useRouter();
  const interviewId = params.interviewId as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<InterviewData | null>(null);

  const fetchInterview = useCallback(async () => {
    try {
      const response = await fetch(`/api/interview/${interviewId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch interview");
      }
      const result = await response.json();
      setData(result);
    } catch {
      toast.error("Failed to load interview");
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  }, [interviewId, router]);

  useEffect(() => {
    fetchInterview();
  }, [fetchInterview]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { interview, answers } = data;
  const isCompleted = interview.status === "completed";
  const questionsAnswered = answers.length;
  const totalQuestions = interview.questions.length;

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">
              {ROLE_DISPLAY_NAMES[interview.role as InterviewRole]} Interview
            </h1>
            <p className="mt-2 text-slate-400">
              {INTERVIEW_TYPE_DISPLAY_NAMES[interview.interviewType as InterviewType]} •{" "}
              {EXPERIENCE_DISPLAY_NAMES[interview.experienceLevel as ExperienceLevel]}
            </p>
          </div>
          <Badge
            variant="outline"
            className={
              isCompleted
                ? "border-green-500/20 bg-green-500/10 text-green-500"
                : "border-yellow-500/20 bg-yellow-500/10 text-yellow-500"
            }
          >
            {isCompleted ? "Completed" : questionsAnswered > 0 ? "In Progress" : "Not Started"}
          </Badge>
        </div>
      </div>

      {/* Interview Info Cards */}
      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <Card className="border-slate-700 bg-slate-800/50">
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10">
              <Target className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{totalQuestions}</p>
              <p className="text-sm text-slate-400">Questions</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-700 bg-slate-800/50">
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
              <Play className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{questionsAnswered}</p>
              <p className="text-sm text-slate-400">Answered</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-700 bg-slate-800/50">
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/10">
              <Clock className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">~15</p>
              <p className="text-sm text-slate-400">Minutes</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Questions Preview */}
      <Card className="mb-8 border-slate-700 bg-slate-800/50">
        <CardHeader>
          <CardTitle className="text-white">Interview Questions</CardTitle>
          <CardDescription className="text-slate-400">
            {isCompleted
              ? "Review the questions from your interview"
              : "Here's what you'll be asked during the interview"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {interview.questions.map((question, index) => {
              const answered = answers.find((a) => a.questionIndex === index);
              return (
                <div
                  key={question.id}
                  className={`flex items-start gap-4 rounded-lg border p-4 ${
                    answered
                      ? "border-green-500/20 bg-green-500/5"
                      : "border-slate-700 bg-slate-800/30"
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium ${
                      answered
                        ? "bg-green-500 text-white"
                        : "bg-slate-700 text-slate-400"
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-white">{question.text}</p>
                    <div className="mt-2 flex gap-2">
                      <Badge variant="outline" className="text-xs">
                        {question.difficulty}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {question.topic}
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Action Button */}
      <div className="flex justify-center">
        {isCompleted ? (
          <Button
            size="lg"
            onClick={() => router.push(`/dashboard/interview/${interviewId}/feedback`)}
            className="gap-2"
          >
            View Results <ArrowRight className="h-5 w-5" />
          </Button>
        ) : (
          <Button
            size="lg"
            onClick={() => router.push(`/dashboard/interview/${interviewId}/start`)}
            className="gap-2"
          >
            {questionsAnswered > 0 ? "Continue Interview" : "Start Interview"}{" "}
            <Play className="h-5 w-5" />
          </Button>
        )}
      </div>
    </div>
  );
}
