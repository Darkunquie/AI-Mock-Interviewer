"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Loader2,
  ArrowRight,
  SkipForward,
  CheckCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useSpeechToText } from "@/hooks/useSpeechToText";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { useTimer } from "@/hooks/useTimer";
import { Question, AnswerEvaluation } from "@/types";

interface InterviewData {
  interview: {
    mockId: string;
    role: string;
    experienceLevel: string;
    interviewType: string;
    status: string;
    questions: Question[];
  };
  answers: Array<{
    questionIndex: number;
    questionText: string;
    userAnswer: string;
  }>;
}

const TIMER_DURATION = 180; // 3 minutes per question

export default function InterviewStartPage() {
  const params = useParams();
  const router = useRouter();
  const interviewId = params.interviewId as string;

  // State
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [data, setData] = useState<InterviewData | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [feedback, setFeedback] = useState<AnswerEvaluation | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [useVoice, setUseVoice] = useState(true);

  // Timer hook - always on
  const handleTimeUp = useCallback(() => {
    toast.warning("Time's up! Moving to the next question.", {
      icon: <Clock className="h-4 w-4" />,
    });
    if (userAnswer.trim()) {
      handleSubmitAnswer();
    } else {
      handleNextQuestion();
    }
  }, [userAnswer]);

  const {
    timeLeft,
    start: startTimer,
    pause: pauseTimer,
    reset: resetTimer,
    formatTime,
    percentageLeft,
  } = useTimer({
    initialTime: TIMER_DURATION,
    onTimeUp: handleTimeUp,
  });

  // Speech hooks
  const {
    transcript,
    interimTranscript,
    isListening,
    isSupported: sttSupported,
    error: sttError,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechToText();

  const {
    speak,
    cancel: cancelSpeech,
    isSpeaking,
    isSupported: ttsSupported,
  } = useTextToSpeech({ rate: 0.95 });

  // Fetch interview data function
  const fetchInterview = useCallback(async () => {
    try {
      const response = await fetch(`/api/interview/${interviewId}`);
      if (!response.ok) throw new Error("Failed to fetch interview");
      const result = await response.json();
      setData(result);

      const answeredIndices = new Set(
        result.answers.map((a: { questionIndex: number }) => a.questionIndex)
      );
      const nextUnanswered = result.interview.questions.findIndex(
        (_: Question, i: number) => !answeredIndices.has(i)
      );
      if (nextUnanswered !== -1) {
        setCurrentQuestionIndex(nextUnanswered);
      }
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

  // Update user answer when transcript changes
  useEffect(() => {
    if (transcript) {
      setUserAnswer(transcript);
    }
  }, [transcript]);

  // Speak question when it changes
  useEffect(() => {
    if (data && useVoice && ttsSupported && !showFeedback) {
      const question = data.interview.questions[currentQuestionIndex];
      if (question) {
        speak(question.text);
      }
    }
  }, [currentQuestionIndex, data, useVoice, ttsSupported, showFeedback, speak]);

  // Auto-start timer when question changes
  useEffect(() => {
    if (!showFeedback && !loading) {
      resetTimer();
      startTimer();
    }
  }, [currentQuestionIndex, showFeedback, loading]);

  // Pause timer when showing feedback
  useEffect(() => {
    if (showFeedback) {
      pauseTimer();
    }
  }, [showFeedback, pauseTimer]);

  const handleToggleRecording = () => {
    if (isListening) {
      stopListening();
    } else {
      resetTranscript();
      setUserAnswer("");
      startListening();
    }
  };

  const handleSubmitAnswer = async () => {
    if (!userAnswer.trim()) {
      toast.error("Please provide an answer");
      return;
    }

    if (!data) return;

    setSubmitting(true);
    stopListening();
    cancelSpeech();
    pauseTimer();

    try {
      const question = data.interview.questions[currentQuestionIndex];
      const response = await fetch("/api/interview/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interviewId,
          questionIndex: currentQuestionIndex,
          questionText: question.text,
          userAnswer: userAnswer.trim(),
        }),
      });

      if (!response.ok) throw new Error("Failed to evaluate answer");

      const result = await response.json();
      setFeedback(result.evaluation);
      setShowFeedback(true);

      if (useVoice && ttsSupported) {
        const feedbackText = `You scored ${result.evaluation.overallScore} out of 100. ${result.evaluation.encouragement}`;
        speak(feedbackText);
      }
    } catch {
      toast.error("Failed to evaluate your answer. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleNextQuestion = () => {
    if (!data) return;

    cancelSpeech();
    pauseTimer();
    const nextIndex = currentQuestionIndex + 1;

    if (nextIndex >= data.interview.questions.length) {
      handleFinishInterview();
    } else {
      setCurrentQuestionIndex(nextIndex);
      setUserAnswer("");
      setFeedback(null);
      setShowFeedback(false);
      resetTranscript();
    }
  };

  const handleFinishInterview = async () => {
    setSubmitting(true);
    try {
      const response = await fetch("/api/interview/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interviewId }),
      });

      if (!response.ok) throw new Error("Failed to generate summary");

      toast.success("Interview completed!");
      router.push(`/dashboard/interview/${interviewId}/feedback`);
    } catch {
      toast.error("Failed to complete interview");
    } finally {
      setSubmitting(false);
    }
  };

  const getTimerColor = () => {
    if (percentageLeft > 50) return "text-green-500";
    if (percentageLeft > 25) return "text-yellow-500";
    return "text-red-500";
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!data) return null;

  const { interview } = data;
  const currentQuestion = interview.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / interview.questions.length) * 100;
  const isLastQuestion = currentQuestionIndex === interview.questions.length - 1;

  return (
    <div className="mx-auto flex h-[calc(100vh-80px)] max-w-3xl flex-col">
      {/* Progress Header + Timer Row */}
      <div className="mb-3 flex items-center justify-between gap-4">
        <div className="flex-1">
          <div className="mb-1 flex items-center justify-between text-sm text-slate-400">
            <span>
              Question {currentQuestionIndex + 1} of {interview.questions.length}
            </span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
        {!showFeedback && (
          <div className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 ${percentageLeft <= 25 ? "border-red-500/50 animate-pulse" : "border-slate-700"}`}>
            <Clock className={`h-4 w-4 ${getTimerColor()}`} />
            <span className={`text-lg font-bold font-mono ${getTimerColor()}`}>
              {formatTime(timeLeft)}
            </span>
            {percentageLeft <= 25 && (
              <AlertTriangle className="h-4 w-4 text-red-400" />
            )}
          </div>
        )}
      </div>

      {/* Voice Toggle - compact */}
      <div className="mb-3 flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setUseVoice(!useVoice)}
          className="gap-2 border-slate-600 h-8 text-xs"
        >
          {useVoice ? (
            <>
              <Volume2 className="h-3 w-3" /> Voice On
            </>
          ) : (
            <>
              <VolumeX className="h-3 w-3" /> Voice Off
            </>
          )}
        </Button>
      </div>

      {/* Question Card - compact */}
      <Card className="mb-3 border-slate-700 bg-slate-800/50 shrink-0">
        <CardContent className="py-4">
          <div className="mb-2 flex items-center gap-2">
            <Badge variant="outline" className="text-slate-300 border-slate-500">
              {currentQuestion.difficulty}
            </Badge>
            <Badge variant="outline" className="text-slate-300 border-slate-500">
              {currentQuestion.topic}
            </Badge>
          </div>
          <h2 className="text-lg font-medium text-white leading-snug">{currentQuestion.text}</h2>
          {isSpeaking && (
            <div className="mt-2 flex items-center gap-2 text-blue-400">
              <Volume2 className="h-3 w-3 animate-pulse" />
              <span className="text-xs">Speaking...</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Answer / Feedback Section - fills remaining space */}
      {!showFeedback ? (
        <Card className="flex min-h-0 flex-1 flex-col border-slate-700 bg-slate-800/50">
          <CardContent className="flex flex-1 flex-col py-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-medium text-white">Your Answer</h3>
              {sttSupported && (
                <Button
                  variant={isListening ? "destructive" : "outline"}
                  size="sm"
                  onClick={handleToggleRecording}
                  className="gap-2 h-8 text-xs"
                  disabled={submitting}
                >
                  {isListening ? (
                    <>
                      <MicOff className="h-3 w-3" /> Stop Recording
                    </>
                  ) : (
                    <>
                      <Mic className="h-3 w-3" /> Start Recording
                    </>
                  )}
                </Button>
              )}
            </div>

            {isListening && (
              <div className="mb-2 flex items-center gap-2 rounded-lg bg-red-500/10 p-2 text-red-400">
                <div className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                <span className="text-xs">Recording... Speak your answer clearly</span>
              </div>
            )}

            <Textarea
              value={userAnswer + (interimTranscript ? " " + interimTranscript : "")}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder={
                sttSupported
                  ? "Click 'Start Recording' to speak or type your answer here..."
                  : "Type your answer here..."
              }
              className="flex-1 resize-none border-slate-600 bg-slate-700 text-white placeholder:text-slate-500"
              disabled={isListening || submitting}
            />

            {sttError && <p className="mt-1 text-xs text-red-400">{sttError}</p>}

            <div className="mt-3 flex justify-end gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextQuestion}
                className="gap-2 border-slate-600"
                disabled={submitting}
              >
                <SkipForward className="h-4 w-4" /> Skip
              </Button>
              <Button
                size="sm"
                onClick={handleSubmitAnswer}
                disabled={!userAnswer.trim() || submitting}
                className="gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Evaluating...
                  </>
                ) : (
                  <>
                    Submit Answer <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Feedback Section - scrollable within viewport */
        <Card className="flex min-h-0 flex-1 flex-col border-slate-700 bg-slate-800/50">
          <CardContent className="flex-1 overflow-y-auto py-4">
            <div className="mb-4 flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-green-500" />
              <div>
                <h3 className="font-medium text-white">Answer Evaluated</h3>
                <p className="text-xs text-slate-400">Here&apos;s your feedback</p>
              </div>
            </div>

            {feedback && (
              <div className="space-y-4">
                {/* Scores */}
                <div className="grid gap-3 sm:grid-cols-3">
                  <ScoreCard label="Technical" score={feedback.technicalScore} />
                  <ScoreCard label="Communication" score={feedback.communicationScore} />
                  <ScoreCard label="Depth" score={feedback.depthScore} />
                </div>

                {/* Overall Score */}
                <div className="rounded-lg bg-slate-700/50 p-3 text-center">
                  <p className="text-xs text-slate-400">Overall Score</p>
                  <p className="text-3xl font-bold text-white">{feedback.overallScore}%</p>
                </div>

                {/* Strengths & Weaknesses */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg bg-green-500/10 p-3">
                    <h4 className="mb-1 text-sm font-medium text-green-400">Strengths</h4>
                    <ul className="space-y-1 text-xs text-slate-300">
                      {feedback.strengths.map((s, i) => (
                        <li key={i}>• {s}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-lg bg-yellow-500/10 p-3">
                    <h4 className="mb-1 text-sm font-medium text-yellow-400">Areas to Improve</h4>
                    <ul className="space-y-1 text-xs text-slate-300">
                      {feedback.weaknesses.map((w, i) => (
                        <li key={i}>• {w}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Ideal Answer */}
                <div className="rounded-lg bg-blue-500/10 p-3">
                  <h4 className="mb-1 text-sm font-medium text-blue-400">Model Answer</h4>
                  <p className="text-xs text-slate-300">{feedback.idealAnswer}</p>
                </div>

                {/* Encouragement */}
                <div className="rounded-lg bg-purple-500/10 p-3">
                  <p className="text-xs text-slate-300">{feedback.encouragement}</p>
                </div>
              </div>
            )}

            <div className="mt-4 flex justify-end">
              <Button size="sm" onClick={handleNextQuestion} className="gap-2" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Processing...
                  </>
                ) : isLastQuestion ? (
                  <>
                    Finish Interview <CheckCircle className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    Next Question <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ScoreCard({ label, score }: { label: string; score: number }) {
  const getColor = (score: number) => {
    if (score >= 8) return "text-green-500";
    if (score >= 6) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <div className="rounded-lg bg-slate-700/50 p-3 text-center">
      <p className="text-xs text-slate-400">{label}</p>
      <p className={`text-xl font-bold ${getColor(score)}`}>{score}/10</p>
    </div>
  );
}
