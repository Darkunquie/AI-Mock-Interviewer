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
  Pause,
  Zap,
  Info,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
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

const TIMER_DURATION = 180;

export default function InterviewStartPage() {
  const params = useParams();
  const router = useRouter();
  const interviewId = params.interviewId as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [data, setData] = useState<InterviewData | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [feedback, setFeedback] = useState<AnswerEvaluation | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [useVoice, setUseVoice] = useState(true);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);

  const handleTimeUp = useCallback(() => {
    toast.warning("Time's up! Moving to the next question.");
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
  } = useAudioRecorder({
    chunkInterval: 4000,
    language: "en",
  });

  const sttSupported = typeof window !== "undefined" && !!navigator.mediaDevices;

  const {
    speak,
    cancel: cancelSpeech,
    isSpeaking,
    isSupported: ttsSupported,
  } = useTextToSpeech({ rate: 0.95 });

  const {
    metrics: speechMetrics,
    analyzeTranscript,
    startTracking,
    stopTracking,
    resetMetrics,
  } = useSpeechAnalysis();

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

  useEffect(() => {
    if (transcript) {
      setUserAnswer(transcript);
      analyzeTranscript(transcript);
    }
  }, [transcript, analyzeTranscript]);

  useEffect(() => {
    if (data && useVoice && ttsSupported && !showFeedback) {
      const question = data.interview.questions[currentQuestionIndex];
      if (question) {
        speak(question.text);
      }
    }
  }, [currentQuestionIndex, data, useVoice, ttsSupported, showFeedback, speak]);

  useEffect(() => {
    if (!showFeedback && !loading) {
      resetTimer();
      startTimer();
    }
  }, [currentQuestionIndex, showFeedback, loading]);

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

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#0f0f0f]">
        <Loader2 className="h-8 w-8 animate-spin text-yellow-400" />
      </div>
    );
  }

  if (!data) return null;

  const { interview } = data;
  const currentQuestion = interview.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / interview.questions.length) * 100;
  const isLastQuestion = currentQuestionIndex === interview.questions.length - 1;

  return (
    <div className="h-screen bg-[#0f0f0f] text-white flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-white/[0.08] px-6 py-3 bg-[#0f0f0f] shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="size-6 bg-yellow-400 rounded flex items-center justify-center">
            <Zap className="w-4 h-4 text-[#0f0f0f]" />
          </div>
          <span className="text-sm font-bold text-white hidden sm:inline">Interview</span>
        </Link>

        {/* Progress */}
        <div className="flex flex-col items-center gap-0.5 min-w-[200px]">
          <div className="flex justify-between w-full text-[9px] font-bold text-zinc-500 uppercase tracking-wider">
            <span>Q{currentQuestionIndex + 1}/{interview.questions.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-yellow-400 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Timer & Controls */}
        <div className="flex items-center gap-2">
          {!showFeedback && (
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded border text-sm ${
              percentageLeft <= 25 ? "bg-red-500/10 border-red-500/30 text-red-400" : "bg-zinc-900 border-zinc-700 text-white"
            }`}>
              <Clock className="w-3 h-3" />
              <span className="font-bold tabular-nums">{formatTime(timeLeft)}</span>
            </div>
          )}
          <button
            onClick={() => setUseVoice(!useVoice)}
            className="size-7 flex items-center justify-center rounded bg-zinc-800 border border-zinc-700 hover:bg-zinc-700"
          >
            {useVoice ? <Volume2 className="w-4 h-4 text-yellow-400" /> : <VolumeX className="w-4 h-4 text-zinc-500" />}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex min-h-0">
        {/* Left Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 border-r border-white/[0.08] bg-[#0f0f0f]">
          <div className="p-4 overflow-y-auto">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Transcript</h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-xs font-bold text-zinc-400">Interviewer</p>
                <p className="text-sm text-zinc-300 leading-relaxed">"{currentQuestion?.text}"</p>
              </div>
              {userAnswer && (
                <div className="space-y-1 border-l-2 border-yellow-400/30 pl-3">
                  <p className="text-xs font-bold text-yellow-400">You</p>
                  <p className="text-sm text-zinc-400 italic">"{userAnswer}"</p>
                </div>
              )}
              {isListening && interimTranscript && (
                <div className="space-y-1 border-l-2 border-yellow-400 pl-3">
                  <p className="text-xs font-bold text-yellow-400">You (Live)</p>
                  <p className="text-lg font-medium text-white leading-snug">"{interimTranscript}"</p>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Center Content */}
        <section className="flex-1 flex flex-col p-4 overflow-hidden">
          <div className="max-w-4xl w-full mx-auto space-y-4 flex-1 flex flex-col">
            {/* Question Card */}
            <div className="bg-[#161616] rounded-xl p-5 border border-white/[0.08] shadow-sm shrink-0">
              <div className="flex items-center justify-between mb-1">
                <span className="px-2 py-0.5 bg-yellow-400/10 text-yellow-400 text-[9px] font-black rounded uppercase tracking-wider border border-yellow-400/20">
                  {currentQuestion?.topic || interview.interviewType}
                </span>
                <span className="text-zinc-600 text-[9px] font-bold uppercase">Q{currentQuestionIndex + 1}</span>
              </div>
              <h1 className="text-lg font-bold leading-tight text-white">{currentQuestion?.text}</h1>
              {currentQuestion?.difficulty && (
                <div className="flex items-center gap-1 pt-1 mt-1 border-t border-white/[0.08]">
                  <Info className="w-2.5 h-2.5 text-zinc-500" />
                  <p className="text-[9px] text-zinc-500">Difficulty: <span className="text-zinc-300">{currentQuestion.difficulty}</span></p>
                </div>
              )}
            </div>

            {/* Answer/Feedback Section */}
            {!showFeedback ? (
              <div className="bg-[#161616] rounded-xl border border-white/[0.08] flex flex-col flex-1 min-h-0">
                <div className="px-3 py-1 border-b border-white/[0.08] flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-yellow-400" />
                    <span className="text-xs font-bold text-white">Your Answer</span>
                  </div>
                  <div className="flex items-center gap-2 text-[9px] font-bold uppercase text-zinc-500">
                    {isListening && (
                      <span className="flex items-center gap-1 text-green-400">
                        <span className="size-1.5 bg-green-400 rounded-full animate-pulse" />
                        REC
                      </span>
                    )}
                    <span>{userAnswer.length}</span>
                  </div>
                </div>

                <textarea
                  value={userAnswer + (interimTranscript ? " " + interimTranscript : "")}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Type your answer or click mic to speak..."
                  className="p-4 bg-transparent border-none focus:ring-0 focus:outline-none text-base leading-relaxed text-white placeholder:text-zinc-600 resize-none flex-1"
                  disabled={isListening || submitting}
                />

                <div className="px-2 py-1 border-t border-white/[0.08] flex items-center justify-end gap-2">
                  <button onClick={() => setUserAnswer("")} className="text-[9px] font-bold text-zinc-500 hover:text-white uppercase px-2 py-1">
                    Clear
                  </button>
                  <button
                    onClick={handleNextQuestion}
                    disabled={submitting}
                    className="text-[9px] font-bold text-zinc-400 hover:text-white uppercase px-2 py-1 flex items-center gap-1 border border-zinc-700 rounded"
                  >
                    <SkipForward className="w-3 h-3" /> Skip
                  </button>
                  <button
                    onClick={handleSubmitAnswer}
                    disabled={!userAnswer.trim() || submitting}
                    className="bg-yellow-400 hover:bg-yellow-300 text-[#0f0f0f] text-[9px] font-black uppercase px-3 py-1.5 rounded disabled:opacity-50 flex items-center gap-1"
                  >
                    {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <>Submit <ArrowRight className="w-3 h-3" /></>}
                  </button>
                </div>
              </div>
            ) : (
              /* Feedback */
              <div className="bg-[#161616] rounded-lg border border-white/[0.08] flex-1 overflow-y-auto">
                <div className="px-3 py-1.5 border-b border-white/[0.08] flex items-center gap-1.5 bg-green-500/10">
                  <CheckCircle className="w-3 h-3 text-green-400" />
                  <span className="text-xs font-bold text-green-400">Evaluated</span>
                </div>
                {feedback && (
                  <div className="p-3 space-y-2">
                    <div className="grid gap-1.5 grid-cols-4">
                      <ScoreCard label="Tech" score={feedback.technicalScore} />
                      <ScoreCard label="Comm" score={feedback.communicationScore} />
                      <ScoreCard label="Depth" score={feedback.depthScore} />
                      <div className="rounded bg-yellow-400/10 border border-yellow-400/20 p-2 text-center">
                        <p className="text-[8px] text-yellow-400/70 uppercase font-bold">Overall</p>
                        <p className="text-lg font-black text-yellow-400">{feedback.overallScore}%</p>
                      </div>
                    </div>
                    <div className="grid gap-1.5 grid-cols-2">
                      <div className="rounded bg-green-500/10 border border-green-500/20 p-2">
                        <h4 className="text-[10px] font-bold text-green-400 mb-1">Strengths</h4>
                        <ul className="space-y-0.5 text-[10px] text-zinc-300">
                          {feedback.strengths.slice(0, 2).map((s, i) => <li key={i}>• {s}</li>)}
                        </ul>
                      </div>
                      <div className="rounded bg-orange-500/10 border border-orange-500/20 p-2">
                        <h4 className="text-[10px] font-bold text-orange-400 mb-1">Improve</h4>
                        <ul className="space-y-0.5 text-[10px] text-zinc-300">
                          {feedback.weaknesses.slice(0, 2).map((w, i) => <li key={i}>• {w}</li>)}
                        </ul>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <button
                        onClick={handleNextQuestion}
                        disabled={submitting}
                        className="bg-yellow-400 hover:bg-yellow-300 text-[#0f0f0f] text-[9px] font-black uppercase px-3 py-1.5 rounded disabled:opacity-50 flex items-center gap-1"
                      >
                        {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : isLastQuestion ? <>Finish</> : <>Next <ArrowRight className="w-3 h-3" /></>}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Right Sidebar */}
        <aside className="hidden xl:flex flex-col w-56 border-l border-white/[0.08] bg-[#0f0f0f]">
          <div className="p-4 overflow-y-auto">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Feedback</h3>
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-[#161616] border border-white/[0.08]">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-zinc-500 text-[10px] font-bold uppercase">Pace</p>
                  <Zap className="w-4 h-4 text-yellow-400" />
                </div>
                <p className="text-white text-2xl font-bold tabular-nums">{speechMetrics.averageWPM || 0} <span className="text-xs font-normal text-zinc-400">WPM</span></p>
              </div>
              <div className="p-3 rounded-lg bg-[#161616] border border-white/[0.08]">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-zinc-500 text-[10px] font-bold uppercase">Fillers</p>
                  {speechMetrics.fillerWords.total > 3 ? <AlertTriangle className="w-4 h-4 text-orange-500" /> : <CheckCircle className="w-4 h-4 text-green-500" />}
                </div>
                <p className="text-white text-2xl font-bold tabular-nums">{speechMetrics.fillerWords.total}</p>
              </div>
              <div className="p-3 rounded-lg bg-yellow-400/5 border border-yellow-400/10">
                <div className="flex items-center gap-1.5 mb-1">
                  <Sparkles className="w-3 h-3 text-yellow-400" />
                  <p className="text-[10px] font-bold text-yellow-400 uppercase">AI Tip</p>
                </div>
                <p className="text-[11px] leading-relaxed text-zinc-400">{isListening ? "Speak clearly." : "Click mic to speak."}</p>
              </div>
            </div>
          </div>
        </aside>
      </main>

      {/* Footer */}
      <footer className="h-20 shrink-0 bg-[#161616] border-t border-white/[0.08] px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div className="flex flex-col items-center gap-0.5">
            <button
              onClick={handleToggleRecording}
              disabled={submitting || showFeedback || permissionStatus === 'denied'}
              className={`size-12 rounded-full flex items-center justify-center transition-all ${
                isListening ? "bg-red-500 hover:bg-red-600 animate-pulse" : "bg-yellow-400 hover:bg-yellow-300"
              } disabled:opacity-50`}
            >
              {isListening ? <MicOff className="w-6 h-6 text-white" /> : <Mic className="w-6 h-6 text-[#0f0f0f]" />}
            </button>
            <span className={`text-[8px] font-black uppercase ${isListening ? "text-red-400" : "text-yellow-400"}`}>
              {isListening ? "REC" : "MIC"}
            </span>
          </div>
          {isListening && (
            <div className="flex items-center gap-0.5 h-8 px-3 bg-zinc-800/50 rounded-full">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="w-0.5 bg-yellow-400 rounded-full animate-pulse" style={{ height: `${6 + Math.random() * 14}px` }} />
              ))}
            </div>
          )}
          {sttError && <span className="text-orange-400 text-xs">{sttError}</span>}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={pauseTimer} className="flex items-center gap-1.5 px-4 h-9 rounded-lg border border-zinc-700 text-zinc-300 font-bold text-xs hover:bg-zinc-800 transition-colors">
            <Pause className="w-3.5 h-3.5" /> Pause
          </button>
          <button
            onClick={handleSubmitTest}
            disabled={submitting}
            className="flex items-center gap-1.5 px-4 h-9 rounded-lg bg-red-500 hover:bg-red-600 text-white font-bold text-xs disabled:opacity-50 transition-all"
          >
            <Flag className="w-3.5 h-3.5" /> End
          </button>
        </div>
      </footer>

      {/* Dialog */}
      {showSubmitDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="w-full max-w-xs bg-[#161616] border border-white/[0.08] rounded-lg p-4">
            <div className="mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <h3 className="text-sm font-bold text-white">Submit Early?</h3>
            </div>
            {data && (
              <div className="mb-3 rounded bg-zinc-800/50 p-2 text-xs space-y-1">
                <div className="flex justify-between"><span className="text-zinc-500">Total:</span><span className="text-white">{data.interview.questions.length}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Done:</span><span className="text-green-400">{data.answers.length}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Skip:</span><span className="text-orange-400">{data.interview.questions.length - data.answers.length}</span></div>
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={() => setShowSubmitDialog(false)} className="flex-1 px-2 py-1.5 rounded border border-zinc-700 text-zinc-300 text-[10px] font-bold uppercase">Cancel</button>
              <button onClick={confirmSubmitTest} disabled={submitting} className="flex-1 px-2 py-1.5 rounded bg-yellow-400 text-[#0f0f0f] text-[10px] font-bold uppercase flex items-center justify-center gap-1">
                {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Flag className="w-3 h-3" /> Submit</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ScoreCard({ label, score }: { label: string; score: number }) {
  const color = score >= 8 ? "green" : score >= 6 ? "yellow" : "red";
  const colorClasses = {
    green: "text-green-400 border-green-500/20 bg-green-500/10",
    yellow: "text-yellow-400 border-yellow-500/20 bg-yellow-500/10",
    red: "text-red-400 border-red-500/20 bg-red-500/10",
  };

  return (
    <div className={`rounded border p-2 text-center ${colorClasses[color]}`}>
      <p className="text-[8px] opacity-70 uppercase font-bold">{label}</p>
      <p className="text-lg font-black">{score}/10</p>
    </div>
  );
}
