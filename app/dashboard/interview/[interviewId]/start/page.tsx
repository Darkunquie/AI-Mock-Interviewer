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
  Flag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { useTimer } from "@/hooks/useTimer";
import { useSpeechAnalysis } from "@/hooks/useSpeechAnalysis";
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
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);

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

  // Groq Whisper speech-to-text (more accurate than Web Speech API)
  const {
    transcript,
    interimTranscript,
    isRecording: isListening,
    isTranscribing,
    error: sttError,
    permissionStatus,
    startRecording: startListening,
    stopRecording: stopListening,
    resetTranscript,
    requestPermission,
  } = useAudioRecorder({
    chunkInterval: 4000, // Transcribe every 4 seconds
    language: "en",
  });

  // Audio recording is supported in all modern browsers
  const sttSupported = typeof window !== "undefined" && !!navigator.mediaDevices;

  const {
    speak,
    cancel: cancelSpeech,
    isSpeaking,
    isSupported: ttsSupported,
  } = useTextToSpeech({ rate: 0.95 });

  // Speech analysis for metrics
  const {
    metrics: speechMetrics,
    analyzeTranscript,
    startTracking,
    stopTracking,
    resetMetrics,
  } = useSpeechAnalysis();

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
      analyzeTranscript(transcript);
    }
  }, [transcript, analyzeTranscript]);

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

  const handleToggleRecording = async () => {
    if (isListening) {
      stopListening();
      stopTracking();
    } else {
      resetTranscript();
      setUserAnswer("");
      resetMetrics();
      await startListening();
      startTracking();
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
    stopTracking();
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
          speechMetrics: {
            fillerWordCount: speechMetrics.fillerWords.total,
            fillerWords: speechMetrics.fillerWords.breakdown,
            wordsPerMinute: speechMetrics.averageWPM,
            speakingTime: speechMetrics.speakingTime,
          },
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

  const handleSubmitTest = () => {
    if (!data) return;

    const answeredCount = data.answers.length;
    const totalQuestions = data.interview.questions.length;
    const unansweredCount = totalQuestions - answeredCount;

    if (unansweredCount > 0) {
      setShowSubmitDialog(true);
    } else {
      // All questions answered, submit directly
      handleFinishInterview();
    }
  };

  const confirmSubmitTest = () => {
    setShowSubmitDialog(false);
    cancelSpeech();
    stopListening();
    pauseTimer();
    handleFinishInterview();
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
        <div className="flex items-center gap-2">
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
          <Button
            variant="outline"
            size="sm"
            onClick={handleSubmitTest}
            disabled={submitting}
            className="gap-2 border-slate-600 text-slate-300 hover:text-white hover:border-blue-500"
          >
            <Flag className="h-4 w-4" />
            Submit Test
          </Button>
        </div>
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
            <div className="mb-2 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-white">Your Answer</h3>
                {sttSupported ? (
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
                ) : (
                  <Badge variant="outline" className="text-yellow-400 border-yellow-500/30">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Speech not supported
                  </Badge>
                )}
              </div>
              {/* Permission Status Warning */}
              {permissionStatus === 'denied' && !sttError && (
                <div className="rounded-lg bg-red-500/10 p-2 text-red-300 border border-red-500/20">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                    <div className="text-xs">
                      <p className="font-medium">Microphone access is blocked</p>
                      <p className="mt-1 text-red-400/80">
                        Please allow microphone access in your browser settings and refresh the page.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {permissionStatus === 'prompt' && !isListening && (
                <div className="rounded-lg bg-blue-500/10 p-2 text-blue-300 border border-blue-500/20">
                  <div className="flex items-start gap-2">
                    <Mic className="h-4 w-4 mt-0.5 shrink-0" />
                    <div className="text-xs flex-1">
                      <p className="font-medium">Microphone permission needed</p>
                      <p className="mt-1 text-blue-400/80">
                        Click "Start Recording" to allow microphone access for voice input.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {sttError && (
                <div className="rounded-lg bg-yellow-500/10 p-2 text-yellow-300 border border-yellow-500/20">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                    <div className="text-xs">
                      <p className="font-medium">{sttError}</p>
                      {sttError.includes("denied") && (
                        <p className="mt-1 text-yellow-400/80">
                          Click the microphone icon in your browser's address bar to allow access, then refresh the page.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {isListening && (
              <div className="mb-2 space-y-1">
                {/* Compact recording indicator with inline metrics */}
                <div className="flex items-center justify-between gap-2 rounded-lg bg-red-500/10 px-3 py-1.5 text-red-400">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                    <span className="text-xs">
                      {isTranscribing ? "Transcribing..." : "Recording..."}
                    </span>
                  </div>
                  {/* Inline speech metrics */}
                  {speechMetrics.totalWords > 0 && (
                    <div className="flex items-center gap-3 text-xs">
                      <div className="flex items-center gap-1">
                        <span className="text-slate-400">Fillers:</span>
                        <span className={`font-bold ${
                          speechMetrics.fillerWords.total > 5 ? "text-red-400" :
                          speechMetrics.fillerWords.total > 2 ? "text-yellow-400" :
                          "text-green-400"
                        }`}>
                          {speechMetrics.fillerWords.total}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-slate-400">Pace:</span>
                        <span className={`font-bold ${
                          speechMetrics.averageWPM < 120 ? "text-yellow-400" :
                          speechMetrics.averageWPM > 180 ? "text-red-400" :
                          "text-green-400"
                        }`}>
                          {speechMetrics.averageWPM} WPM
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Interim transcript - what's being heard */}
                {interimTranscript && (
                  <div className="rounded-lg bg-green-500/10 px-3 py-1.5 text-green-300 border border-green-500/20">
                    <span className="text-xs font-medium">Hearing: </span>
                    <span className="text-xs italic">{interimTranscript}</span>
                  </div>
                )}
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

                {/* Speech Metrics */}
                {(feedback.fillerWordCount !== undefined || feedback.wordsPerMinute !== undefined) && (
                  <div className="rounded-lg bg-purple-500/10 border border-purple-500/20 p-3">
                    <h4 className="mb-2 text-sm font-medium text-purple-400">Communication Metrics</h4>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {feedback.fillerWordCount !== undefined && (
                        <div className="rounded bg-slate-700/30 p-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-400">Filler Words</span>
                            <span className={`text-lg font-bold ${
                              feedback.fillerWordCount > 5 ? "text-red-400" :
                              feedback.fillerWordCount > 2 ? "text-yellow-400" :
                              "text-green-400"
                            }`}>
                              {feedback.fillerWordCount}
                            </span>
                          </div>
                          {feedback.fillerWords && Object.keys(feedback.fillerWords).length > 0 && (
                            <div className="mt-1 text-xs text-slate-500">
                              {Object.entries(feedback.fillerWords)
                                .slice(0, 3)
                                .map(([word, count]) => (
                                  <span key={word} className="mr-2">
                                    "{word}": {count}
                                  </span>
                                ))}
                            </div>
                          )}
                        </div>
                      )}
                      {feedback.wordsPerMinute !== undefined && (
                        <div className="rounded bg-slate-700/30 p-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-400">Speaking Pace</span>
                            <span className={`text-lg font-bold ${
                              feedback.wordsPerMinute < 120 ? "text-yellow-400" :
                              feedback.wordsPerMinute > 180 ? "text-red-400" :
                              feedback.wordsPerMinute >= 140 && feedback.wordsPerMinute <= 160 ? "text-green-400" :
                              "text-blue-400"
                            }`}>
                              {feedback.wordsPerMinute} WPM
                            </span>
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            {feedback.wordsPerMinute < 120 ? "Too slow" :
                             feedback.wordsPerMinute > 180 ? "Too fast" :
                             feedback.wordsPerMinute >= 140 && feedback.wordsPerMinute <= 160 ? "Perfect!" :
                             "Good"}
                            {" • Optimal: 140-160 WPM"}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

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

      {/* Submit Test Confirmation Dialog */}
      {showSubmitDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <Card className="w-full max-w-md border-slate-700 bg-slate-800 shadow-2xl">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-full bg-yellow-500/20 p-2">
                  <AlertTriangle className="h-6 w-6 text-yellow-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Submit Test Early?</h3>
                  <p className="text-sm text-slate-400">
                    You have unanswered questions remaining
                  </p>
                </div>
              </div>

              {data && (
                <div className="mb-6 space-y-2 rounded-lg bg-slate-700/50 p-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Total Questions:</span>
                    <span className="font-medium text-white">{data.interview.questions.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Answered:</span>
                    <span className="font-medium text-green-400">{data.answers.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Unanswered:</span>
                    <span className="font-medium text-yellow-400">
                      {data.interview.questions.length - data.answers.length}
                    </span>
                  </div>
                </div>
              )}

              <p className="mb-6 text-sm text-slate-300">
                Are you sure you want to submit the test now? Unanswered questions will be skipped and won&apos;t be scored.
              </p>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowSubmitDialog(false)}
                  className="flex-1 border-slate-600 text-slate-300 hover:text-white"
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmSubmitTest}
                  disabled={submitting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Flag className="mr-2 h-4 w-4" />
                      Submit Now
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
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
