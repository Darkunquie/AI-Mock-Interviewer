"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
import { apiFetch } from "@/lib/client/api";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { useTimer } from "@/hooks/useTimer";
import { useSpeechAnalysis } from "@/hooks/useSpeechAnalysis";
import dynamic from "next/dynamic";

// WebGL canvas — client-only, no SSR.
const InterviewerAvatar3D = dynamic(
  () => import("@/components/interview/InterviewerAvatar3D").then((m) => m.InterviewerAvatar3D),
  { ssr: false }
);
import { Question, AnswerEvaluation, ExperienceLevel } from "@/types";

interface InterviewData {
  interview: {
    mockId: string;
    role: string;
    experienceLevel: ExperienceLevel;
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

function getSpeedForExperience(level: ExperienceLevel): number {
  switch (level) {
    case "0-1": return 0.8;   // Beginner: slower
    case "1-3": return 0.85;  // Intermediate: slightly slow
    case "3-5": return 0.9;   // Advanced: moderate
    case "5+":  return 0.9;   // Senior: moderate
    default:    return 0.85;
  }
}

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
  const [useVoice, setUseVoice] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

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

  const speechRate = data ? getSpeedForExperience(data.interview.experienceLevel) : 1.0;

  const {
    speak,
    prefetch: prefetchSpeech,
    cancel: cancelSpeech,
    isSpeaking,
    isSupported: ttsSupported,
    audioElementRef,
  } = useTextToSpeech({ rate: speechRate });

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

  // Latest mic state/stopper, read via ref so the speak effect never goes stale
  // yet also never re-fires just because recording toggled.
  const isListeningRef = useRef(false);
  const stopListeningRef = useRef(stopListening);
  useEffect(() => {
    isListeningRef.current = isListening;
    stopListeningRef.current = stopListening;
  }, [isListening, stopListening]);

  // Speak each question once, when it first becomes visible.
  const spokenIndexRef = useRef<number | null>(null);
  useEffect(() => {
    if (data && useVoice && ttsSupported && !showFeedback && hasInteracted) {
      if (spokenIndexRef.current === currentQuestionIndex) return;
      const question = data.interview.questions[currentQuestionIndex];
      if (question) {
        spokenIndexRef.current = currentQuestionIndex;
        // Stop mic while TTS speaks to prevent a feedback loop where the mic
        // transcribes the AI's own voice into the answer.
        if (isListeningRef.current) {
          stopListeningRef.current();
        }
        speak(question.text);
      }
    }
  }, [currentQuestionIndex, data, useVoice, ttsSupported, showFeedback, speak, hasInteracted]);

  // Replay the current question on demand (works even if voice is muted).
  const handleReplayQuestion = () => {
    if (!data) return;
    const q = data.interview.questions[currentQuestionIndex];
    if (!q) return;
    setHasInteracted(true);
    if (isListening) stopListening();
    speak(q.text);
  };

  // Warm the current + next couple of questions' audio so playback is instant.
  // Not gated on useVoice: we prefetch the FIRST question on page load so there's
  // no delay the moment the user enables voice.
  useEffect(() => {
    if (!data || !ttsSupported) return;
    const qs = data.interview.questions;
    for (let k = 0; k <= 2; k++) {
      const q = qs[currentQuestionIndex + k];
      if (q?.text) prefetchSpeech(q.text);
    }
  }, [currentQuestionIndex, data, ttsSupported, prefetchSpeech]);

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
    setHasInteracted(true); // Enable TTS after user interaction
    if (isListening) {
      stopListening();
      stopTracking();
    } else {
      // Stop any interviewer speech first so the mic can't record it.
      cancelSpeech();
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
      const response = await apiFetch("/api/interview/evaluate", {
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
      const response = await apiFetch("/api/interview/summary", {
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
      <header className="flex items-center justify-between gap-3 border-b border-white/[0.08] px-4 sm:px-6 py-3 bg-[#0f0f0f] shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
          <div className="size-6 bg-yellow-400 rounded flex items-center justify-center">
            <Zap className="w-4 h-4 text-[#0f0f0f]" />
          </div>
          <span className="text-sm font-bold text-white hidden sm:inline">Interview</span>
        </Link>

        {/* Progress */}
        <div className="flex flex-col items-center gap-0.5 flex-1 min-w-0 max-w-[280px]">
          <div className="flex justify-between w-full text-[9px] font-bold text-zinc-500 uppercase tracking-wider">
            <span>Q{currentQuestionIndex + 1}/{interview.questions.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-yellow-400 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Timer & Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {!showFeedback && (
            <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-sm ${
              percentageLeft <= 25 ? "bg-red-500/10 border-red-500/30 text-red-400" : "bg-[#161616] border-white/[0.08] text-white"
            }`}>
              <Clock className="w-3.5 h-3.5" />
              <span className="font-bold tabular-nums">{formatTime(timeLeft)}</span>
            </div>
          )}
          <button
            onClick={() => {
              setHasInteracted(true);
              const next = !useVoice;
              setUseVoice(next);
              if (!next) cancelSpeech(); // muting → stop current playback
            }}
            title={useVoice ? "Mute interviewer voice" : "Enable interviewer voice"}
            className="hidden sm:flex size-8 items-center justify-center rounded-lg bg-[#161616] border border-white/[0.08] hover:bg-zinc-800 transition-colors"
          >
            {useVoice ? <Volume2 className="w-4 h-4 text-yellow-400" /> : <VolumeX className="w-4 h-4 text-zinc-500" />}
          </button>
          <div className="hidden sm:block w-px h-6 bg-white/[0.08] mx-0.5" />
          <button
            onClick={handleReplayQuestion}
            disabled={isSpeaking || showFeedback}
            title="Hear the question again"
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-yellow-400/30 bg-yellow-400/10 text-yellow-400 hover:bg-yellow-400/20 font-bold text-xs disabled:opacity-40 transition-colors"
          >
            <Volume2 className="w-3.5 h-3.5" /> <span className="hidden sm:inline">{isSpeaking ? "Playing…" : "Repeat"}</span>
          </button>
          <button
            onClick={pauseTimer}
            title="Pause"
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-white/[0.08] bg-[#161616] text-zinc-300 font-bold text-xs hover:bg-zinc-800 transition-colors"
          >
            <Pause className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Pause</span>
          </button>
          <button
            onClick={handleSubmitTest}
            disabled={submitting}
            title="End interview"
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-red-500 hover:bg-red-600 text-white font-bold text-xs disabled:opacity-50 transition-all"
          >
            <Flag className="w-3.5 h-3.5" /> <span className="hidden sm:inline">End</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex min-h-0 gap-4 p-4">
        {/* Left — Interviewer video-call pane (Aria) */}
        <aside className="hidden lg:flex flex-col w-[320px] shrink-0 gap-3">
          {/* Video pane */}
          <div
            className={`relative flex-1 min-h-0 rounded-2xl overflow-hidden border transition-shadow duration-300 ${
              isSpeaking
                ? "border-yellow-400/40 shadow-[0_0_40px_-8px_rgba(250,204,21,0.35)]"
                : "border-white/[0.08]"
            }`}
            style={{ background: "radial-gradient(120% 90% at 50% 28%, #232320 0%, #17170f 46%, #0f0f0f 100%)" }}
          >
            {/* The human face (photo → talking video), or SVG fallback */}
            <InterviewerAvatar3D speaking={isSpeaking} audioRef={audioElementRef} />

            {/* status chip */}
            <div className="absolute top-3 left-3 z-10 flex items-center gap-2 h-7 px-3 rounded-full bg-black/55 backdrop-blur border border-white/10">
              <span
                className={`size-2 rounded-full ${
                  isSpeaking ? "bg-yellow-400 animate-pulse" : isListening ? "bg-emerald-400 animate-pulse" : "bg-zinc-400"
                }`}
              />
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-200">
                {isSpeaking ? "Speaking" : isListening ? "Listening" : "Live"}
              </span>
            </div>
            {isListening && (
              <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 h-7 px-3 rounded-full bg-black/55 backdrop-blur border border-white/10">
                <span className="size-1.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-200">Rec</span>
              </div>
            )}

            {/* bottom scrim + name tag (Zoom-style) */}
            <div className="absolute inset-x-0 bottom-0 z-10 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-10">
              <div className="flex items-end justify-between gap-2">
                <div>
                  <p className="text-base font-bold text-white leading-tight drop-shadow">Aria</p>
                  <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-zinc-300">AI Interviewer</p>
                </div>
                <span className="text-[11px] font-semibold text-yellow-300 drop-shadow">
                  {isSpeaking ? "Speaking…" : isListening ? "Listening…" : "Ready"}
                </span>
              </div>
            </div>
          </div>

          {/* live transcript */}
          <div className="shrink-0 rounded-2xl bg-[#161616] border border-white/[0.08] p-3">
            <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Aria is asking</p>
            <p className="text-[13px] leading-relaxed text-zinc-300 line-clamp-3">&ldquo;{currentQuestion?.text}&rdquo;</p>
            {isListening && interimTranscript && (
              <div className="mt-2 pt-2 border-t border-white/[0.08]">
                <p className="text-[9px] font-bold uppercase tracking-wider text-yellow-400/70 mb-1">You (live)</p>
                <p className="text-[13px] leading-snug text-white line-clamp-2">"{interimTranscript}"</p>
              </div>
            )}
          </div>
        </aside>

        {/* Center — Question + Answer */}
        <section className="flex-1 flex flex-col overflow-hidden min-w-0">
          <div className="max-w-4xl w-full mx-auto space-y-4 flex-1 flex flex-col">
            {/* Question Card */}
            <div className="bg-[#161616] rounded-2xl p-6 border border-white/[0.08] shadow-lg shadow-black/20 shrink-0">
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-1 bg-yellow-400/10 text-yellow-400 text-[10px] font-black rounded-md uppercase tracking-wider border border-yellow-400/20">
                  {currentQuestion?.topic || interview.interviewType}
                </span>
                <div className="flex items-center gap-3">
                  {currentQuestion?.difficulty && (
                    <span className="flex items-center gap-1 text-[10px] text-zinc-500">
                      <Info className="w-3 h-3" />
                      Difficulty: <span className="text-zinc-300 capitalize">{currentQuestion.difficulty}</span>
                    </span>
                  )}
                  <span className="text-zinc-600 text-[10px] font-bold uppercase">Q{currentQuestionIndex + 1}</span>
                </div>
              </div>
              <h1 className="text-2xl font-bold leading-snug text-white">{currentQuestion?.text}</h1>
            </div>

            {/* Answer/Feedback Section */}
            {!showFeedback ? (
              <div className="bg-[#161616] rounded-2xl border border-white/[0.08] flex flex-col flex-1 min-h-0">
                <div className="px-4 py-2.5 border-b border-white/[0.08] flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                    <span className="text-xs font-bold text-white">Your Answer</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-[10px] font-bold uppercase text-zinc-500">
                    {isListening && (
                      <span className="flex items-center gap-1 text-red-400">
                        <span className="size-1.5 bg-red-500 rounded-full animate-pulse" />
                        REC
                      </span>
                    )}
                    <span className="tabular-nums">{userAnswer.length} / 2000</span>
                  </div>
                </div>

                <textarea
                  value={userAnswer + (interimTranscript ? " " + interimTranscript : "")}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Type your answer or click the mic to speak…"
                  className="px-4 py-3 bg-transparent border-none focus:ring-0 focus:outline-none text-base leading-relaxed text-white placeholder:text-zinc-600 resize-none flex-1"
                  disabled={isListening || submitting}
                />

                <div className="px-3 py-2.5 border-t border-white/[0.08] flex items-center justify-between gap-2">
                  {/* inline mic + waveform */}
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={handleToggleRecording}
                      disabled={submitting || permissionStatus === "denied"}
                      title={isListening ? "Stop recording" : "Record answer"}
                      className={`size-10 rounded-full flex items-center justify-center transition-all shrink-0 ${
                        isListening ? "bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30" : "bg-yellow-400 hover:bg-yellow-300 shadow-lg shadow-yellow-400/20"
                      } disabled:opacity-50`}
                    >
                      {isListening ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5 text-[#0f0f0f]" />}
                    </button>
                    {isListening ? (
                      <div className="flex items-center gap-0.5 h-6">
                        {[...Array(9)].map((_, i) => (
                          <div
                            key={i}
                            className="w-0.5 bg-yellow-400 rounded-full animate-pulse"
                            style={{ height: `${6 + (i % 4) * 5}px`, animationDelay: `${i * 0.08}s` }}
                          />
                        ))}
                      </div>
                    ) : (
                      <span className="text-[10px] font-medium text-zinc-500">Tap to speak</span>
                    )}
                    {sttError && <span className="text-orange-400 text-[10px]">{sttError}</span>}
                  </div>

                  <div className="flex items-center gap-2">
                    <button onClick={() => { setUserAnswer(""); resetTranscript(); resetMetrics(); }} className="text-[10px] font-bold text-zinc-500 hover:text-white uppercase px-2.5 py-1.5">
                      Clear
                    </button>
                    <button
                      onClick={handleNextQuestion}
                      disabled={submitting}
                      className="text-[10px] font-bold text-zinc-400 hover:text-white uppercase px-2.5 py-1.5 flex items-center gap-1 border border-white/[0.08] rounded-lg hover:bg-zinc-800 transition-colors"
                    >
                      <SkipForward className="w-3 h-3" /> Skip
                    </button>
                    <button
                      onClick={handleSubmitAnswer}
                      disabled={!userAnswer.trim() || submitting}
                      className="bg-yellow-400 hover:bg-yellow-300 text-[#0f0f0f] text-[10px] font-black uppercase px-4 py-2 rounded-lg disabled:opacity-50 flex items-center gap-1 transition-colors"
                    >
                      {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <>Submit <ArrowRight className="w-3.5 h-3.5" /></>}
                    </button>
                  </div>
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

        {/* Right — Metrics rail */}
        <aside className="hidden xl:flex flex-col w-[240px] shrink-0 gap-3 overflow-y-auto">
          <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">Live Feedback</h3>
          <div className="p-4 rounded-2xl bg-[#161616] border border-white/[0.08]">
            <div className="flex justify-between items-center mb-1.5">
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Pace</p>
              <Zap className="w-4 h-4 text-yellow-400" />
            </div>
            <p className="text-white text-3xl font-bold tabular-nums">{speechMetrics.averageWPM || 0} <span className="text-xs font-normal text-zinc-500">WPM</span></p>
            <p className="text-[10px] text-zinc-600 mt-1">{isListening ? "Measuring…" : "Start speaking to measure"}</p>
          </div>
          <div className="p-4 rounded-2xl bg-[#161616] border border-white/[0.08]">
            <div className="flex justify-between items-center mb-1.5">
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Fillers</p>
              {speechMetrics.fillerWords.total > 3 ? <AlertTriangle className="w-4 h-4 text-orange-500" /> : <CheckCircle className="w-4 h-4 text-emerald-500" />}
            </div>
            <p className="text-white text-3xl font-bold tabular-nums">{speechMetrics.fillerWords.total}</p>
            <p className="text-[10px] text-zinc-600 mt-1">{speechMetrics.fillerWords.total > 3 ? "Try to reduce these" : "Clean so far"}</p>
          </div>
          <div className="p-4 rounded-2xl bg-yellow-400/5 border border-yellow-400/15">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
              <p className="text-[10px] font-bold text-yellow-400 uppercase tracking-wider">AI Tip</p>
            </div>
            <p className="text-[12px] leading-relaxed text-zinc-300">
              {isListening ? "Speak clearly and at a steady pace. Structure: definition, then an example." : "Click the mic to answer aloud — I'll transcribe it in real time."}
            </p>
          </div>
        </aside>
      </main>

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
