"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  Loader2,
  ArrowLeft,
  Trophy,
  Target,
  TrendingUp,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Home,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ROLE_DISPLAY_NAMES,
  EXPERIENCE_DISPLAY_NAMES,
  INTERVIEW_TYPE_DISPLAY_NAMES,
  InterviewRole,
  ExperienceLevel,
  InterviewType,
} from "@/types";

interface FeedbackData {
  interview: {
    mockId: string;
    role: string;
    experienceLevel: string;
    interviewType: string;
    totalScore: number;
    questions: Array<{ id: number; text: string; difficulty: string; topic: string }>;
    completedAt: string;
  };
  answers: Array<{
    questionIndex: number;
    questionText: string;
    userAnswer: string;
    technicalScore: number;
    communicationScore: number;
    depthScore: number;
    idealAnswer: string;
    feedback: {
      strengths: string[];
      weaknesses: string[];
      encouragement: string;
    } | null;
  }>;
  summary: {
    overallScore: number;
    rating: string;
    strengths: string[];
    weaknesses: string[];
    recommendedTopics: string[];
    actionPlan: string;
    summaryText: string;
  } | null;
}

export default function FeedbackPage() {
  const params = useParams();
  const router = useRouter();
  const interviewId = params.interviewId as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<FeedbackData | null>(null);
  const [expandedAnswers, setExpandedAnswers] = useState<Set<number>>(new Set());

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const response = await fetch(`/api/interview/${interviewId}`);
        if (!response.ok) throw new Error("Failed to fetch feedback");
        const result = await response.json();
        setData(result);
      } catch {
        toast.error("Failed to load feedback");
        router.push("/dashboard");
      } finally {
        setLoading(false);
      }
    };
    fetchFeedback();
  }, [interviewId, router]);

  const toggleAnswer = (index: number) => {
    const newExpanded = new Set(expandedAnswers);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedAnswers(newExpanded);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  const getRatingColor = (rating: string) => {
    if (rating.toLowerCase().includes("excellent")) return "bg-green-500";
    if (rating.toLowerCase().includes("good") || rating.toLowerCase().includes("very")) return "bg-blue-500";
    if (rating.toLowerCase().includes("average")) return "bg-yellow-500";
    return "bg-red-500";
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!data || !data.summary) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-slate-400">Interview results not available</p>
        <Link href="/dashboard">
          <Button>Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  const { interview, answers, summary } = data;

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="mb-4 inline-flex items-center gap-2 text-slate-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Interview Results</h1>
            <p className="mt-2 text-slate-400">
              {ROLE_DISPLAY_NAMES[interview.role as InterviewRole]} •{" "}
              {INTERVIEW_TYPE_DISPLAY_NAMES[interview.interviewType as InterviewType]}
            </p>
          </div>
          <Badge className={`${getRatingColor(summary.rating)} text-white`}>
            {summary.rating}
          </Badge>
        </div>
      </div>

      {/* Overall Score Card */}
      <Card className="mb-8 border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center gap-4 md:flex-row md:gap-12">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2">
                <Trophy className={`h-8 w-8 ${getScoreColor(summary.overallScore)}`} />
                <span className={`text-6xl font-bold ${getScoreColor(summary.overallScore)}`}>
                  {summary.overallScore}%
                </span>
              </div>
              <p className="mt-2 text-slate-400">Overall Score</p>
            </div>
            <div className="h-16 w-px bg-slate-700 hidden md:block" />
            <div className="grid grid-cols-3 gap-8 text-center">
              <div>
                <p className="text-2xl font-bold text-white">{interview.questions.length}</p>
                <p className="text-sm text-slate-400">Questions</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{answers.length}</p>
                <p className="text-sm text-slate-400">Answered</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {EXPERIENCE_DISPLAY_NAMES[interview.experienceLevel as ExperienceLevel].split(" ")[0]}
                </p>
                <p className="text-sm text-slate-400">Level</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Text */}
      {summary.summaryText && (
        <Card className="mb-8 border-slate-700 bg-slate-800/50">
          <CardContent className="pt-6">
            <p className="text-lg text-slate-300">{summary.summaryText}</p>
          </CardContent>
        </Card>
      )}

      {/* Strengths & Weaknesses */}
      <div className="mb-8 grid gap-6 md:grid-cols-2">
        <Card className="border-green-500/20 bg-green-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-400">
              <TrendingUp className="h-5 w-5" />
              Your Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {summary.strengths.map((strength, i) => (
                <li key={i} className="flex items-start gap-2 text-slate-300">
                  <span className="mt-1 text-green-500">•</span>
                  {strength}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="border-yellow-500/20 bg-yellow-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-400">
              <Target className="h-5 w-5" />
              Areas to Improve
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {summary.weaknesses.map((weakness, i) => (
                <li key={i} className="flex items-start gap-2 text-slate-300">
                  <span className="mt-1 text-yellow-500">•</span>
                  {weakness}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Recommended Topics */}
      {summary.recommendedTopics && summary.recommendedTopics.length > 0 && (
        <Card className="mb-8 border-blue-500/20 bg-blue-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-400">
              <BookOpen className="h-5 w-5" />
              Recommended Topics to Study
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {summary.recommendedTopics.map((topic, i) => (
                <Badge key={i} variant="outline" className="border-blue-500/30 text-blue-300">
                  {topic}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Plan */}
      {summary.actionPlan && (
        <Card className="mb-8 border-purple-500/20 bg-purple-500/5">
          <CardHeader>
            <CardTitle className="text-purple-400">Action Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-300">{summary.actionPlan}</p>
          </CardContent>
        </Card>
      )}

      {/* Detailed Q&A */}
      <Card className="mb-8 border-slate-700 bg-slate-800/50">
        <CardHeader>
          <CardTitle className="text-white">Question-by-Question Review</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {answers.map((answer, index) => (
              <div
                key={index}
                className="rounded-lg border border-slate-700 bg-slate-800/30 overflow-hidden"
              >
                <button
                  onClick={() => toggleAnswer(index)}
                  className="flex w-full items-center justify-between p-4 text-left hover:bg-slate-700/30"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 text-sm font-medium text-white">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-white line-clamp-1">
                        {answer.questionText}
                      </p>
                      <div className="mt-1 flex gap-2 text-sm">
                        <span className="text-slate-400">
                          Score:{" "}
                          <span className={getScoreColor(
                            Math.round(
                              (answer.technicalScore + answer.communicationScore + answer.depthScore) / 3 * 10
                            )
                          )}>
                            {Math.round(
                              (answer.technicalScore + answer.communicationScore + answer.depthScore) / 3 * 10
                            )}%
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                  {expandedAnswers.has(index) ? (
                    <ChevronUp className="h-5 w-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-slate-400" />
                  )}
                </button>

                {expandedAnswers.has(index) && (
                  <div className="border-t border-slate-700 p-4 space-y-4">
                    {/* Scores */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <p className="text-xs text-slate-400">Technical</p>
                        <p className="text-lg font-bold text-white">{answer.technicalScore}/10</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-slate-400">Communication</p>
                        <p className="text-lg font-bold text-white">{answer.communicationScore}/10</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-slate-400">Depth</p>
                        <p className="text-lg font-bold text-white">{answer.depthScore}/10</p>
                      </div>
                    </div>

                    {/* Your Answer */}
                    <div>
                      <p className="text-sm font-medium text-slate-400 mb-1">Your Answer:</p>
                      <p className="text-slate-300 text-sm bg-slate-700/30 p-3 rounded">
                        {answer.userAnswer}
                      </p>
                    </div>

                    {/* Ideal Answer */}
                    {answer.idealAnswer && (
                      <div>
                        <p className="text-sm font-medium text-blue-400 mb-1">Model Answer:</p>
                        <p className="text-slate-300 text-sm bg-blue-500/10 p-3 rounded">
                          {answer.idealAnswer}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
        <Link href="/dashboard">
          <Button variant="outline" className="w-full gap-2 border-slate-600 sm:w-auto">
            <Home className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        <Link href="/dashboard">
          <Button className="w-full gap-2 sm:w-auto">
            Start New Interview
          </Button>
        </Link>
      </div>
    </div>
  );
}
