"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Play, ArrowRight, Clock, Target, RotateCcw } from "lucide-react";
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
    mode: string | null;
    techStack: string | null;
    topics: string | null;
    questions: Question[];
    createdAt: string;
    duration?: string;
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
  const [retaking, setRetaking] = useState(false);
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

  const handleRetake = async () => {
    setRetaking(true);
    try {
      const response = await fetch("/api/interview/retake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interviewId }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to create retake");
      }
      toast.success("Retake created with fresh questions!");
      router.push(`/dashboard/interview/${result.interviewId}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to retake interview");
    } finally {
      setRetaking(false);
    }
  };

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
  const isInProgress = interview.status === "in_progress";
  const isPractice = interview.mode === "practice";
  const questionsAnswered = answers.length;
  const totalQuestions = interview.questions.length;
  const interviewDuration = interview.duration || "15";

  // Parse tech stack and topics
  const techStack: string[] = interview.techStack
    ? (() => { try { return JSON.parse(interview.techStack); } catch { return []; } })()
    : [];
  const topics: string[] = interview.topics
    ? (() => { try { return JSON.parse(interview.topics); } catch { return []; } })()
    : [];

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">
              {isPractice ? "Practice Session" : `${ROLE_DISPLAY_NAMES[interview.role as InterviewRole]} Interview`}
            </h1>
            <p className="mt-2 text-slate-400">
              {isPractice ? (
                <>
                  {ROLE_DISPLAY_NAMES[interview.role as InterviewRole]} •{" "}
                  {EXPERIENCE_DISPLAY_NAMES[interview.experienceLevel as ExperienceLevel]}
                </>
              ) : (
                <>
                  {INTERVIEW_TYPE_DISPLAY_NAMES[interview.interviewType as InterviewType]} •{" "}
                  {EXPERIENCE_DISPLAY_NAMES[interview.experienceLevel as ExperienceLevel]}
                </>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isPractice && (
              <Badge variant="outline" className="border-purple-500/20 bg-purple-500/10 text-purple-400">
                Practice
              </Badge>
            )}
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
      </div>

      {/* Tech Stack Badges */}
      {techStack.length > 0 && (
        <div className="mb-6">
          <p className="text-sm text-slate-400 mb-2">Tech Stack</p>
          <div className="flex flex-wrap gap-2">
            {techStack.map((tech) => (
              <Badge key={tech} variant="outline" className="border-blue-500/30 text-blue-300">
                {tech}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Practice Topics */}
      {topics.length > 0 && (
        <div className="mb-6">
          <p className="text-sm text-slate-400 mb-2">Focus Topics</p>
          <div className="flex flex-wrap gap-2">
            {topics.map((topic) => (
              <Badge key={topic} variant="outline" className="border-purple-500/30 text-purple-300">
                {topic}
              </Badge>
            ))}
          </div>
        </div>
      )}

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
              <p className="text-2xl font-bold text-white">~{interviewDuration}</p>
              <p className="text-sm text-slate-400">Minutes</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Questions Preview - only show after interview has started or completed */}
      {(isCompleted || isInProgress) ? (
        <Card className="mb-8 border-slate-700 bg-slate-800/50">
          <CardHeader>
            <CardTitle className="text-white">
              {isPractice ? "Practice Questions" : "Interview Questions"}
            </CardTitle>
            <CardDescription className="text-slate-400">
              {isCompleted
                ? "Review the questions from your session"
                : "Questions you've encountered so far"}
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
      ) : (
        <Card className="mb-8 border-slate-700 bg-slate-800/50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/10 mb-4">
              <Target className="h-8 w-8 text-blue-500" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Questions are hidden</h3>
            <p className="text-slate-400 text-center max-w-md">
              Questions will be revealed one at a time during the {isPractice ? "practice" : "interview"}. Click below to begin.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-center gap-4">
        {isCompleted ? (
          <>
            <Button
              size="lg"
              onClick={() => router.push(`/dashboard/interview/${interviewId}/feedback`)}
              className="gap-2"
            >
              View Results <ArrowRight className="h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={handleRetake}
              disabled={retaking}
              className="gap-2 border-blue-600 text-blue-400 hover:bg-blue-500/10"
            >
              {retaking ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <RotateCcw className="h-5 w-5" />
              )}
              {retaking ? "Creating..." : "Retake"}
            </Button>
          </>
        ) : (
          <Button
            size="lg"
            onClick={() => router.push(`/dashboard/interview/${interviewId}/start`)}
            className="gap-2"
          >
            {questionsAnswered > 0 ? "Continue" : "Start"}{" "}
            {isPractice ? "Practice" : "Interview"}{" "}
            <Play className="h-5 w-5" />
          </Button>
        )}
      </div>
    </div>
  );
}
