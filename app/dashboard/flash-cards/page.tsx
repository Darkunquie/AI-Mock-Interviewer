"use client";

import { useState } from "react";
import { Loader2, Layers, ChevronRight, RotateCcw, ChevronLeft, Sparkles, BookOpen, Check, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FlashCard, StudySession } from "@/types/flashcard";
import { TECH_TOPICS } from "@/lib/flashcards/constants";

// Flash Card Component with flip animation
function FlashCardDisplay({
  card,
  isFlipped,
  onFlip,
}: {
  card: FlashCard;
  isFlipped: boolean;
  onFlip: () => void;
}) {
  return (
    <div
      className="perspective-1000 w-full max-w-2xl mx-auto cursor-pointer"
      onClick={onFlip}
    >
      <div
        className={`relative w-full min-h-[300px] transition-transform duration-500 transform-style-preserve-3d ${
          isFlipped ? "rotate-y-180" : ""
        }`}
        style={{
          transformStyle: "preserve-3d",
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 backface-hidden bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700 flex flex-col"
          style={{ backfaceVisibility: "hidden" }}
        >
          <div className="flex items-center justify-between mb-4">
            <Badge
              variant="outline"
              className={`text-xs ${
                card.difficulty === "easy"
                  ? "border-green-500 text-green-400"
                  : card.difficulty === "medium"
                  ? "border-yellow-500 text-yellow-400"
                  : "border-red-500 text-red-400"
              }`}
            >
              {card.difficulty}
            </Badge>
            <span className="text-xs text-slate-500">Click to flip</span>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <p className="text-lg text-white text-center leading-relaxed">{card.front}</p>
          </div>
          {card.hint && (
            <p className="text-sm text-slate-400 text-center mt-4 italic">
              Hint: {card.hint}
            </p>
          )}
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 backface-hidden bg-gradient-to-br from-green-900/30 to-slate-900 rounded-xl p-6 border border-green-500/30 flex flex-col"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <Badge variant="outline" className="border-green-500 text-green-400 text-xs">
              Answer
            </Badge>
            <span className="text-xs text-slate-500">Click to flip back</span>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center">
            <p className="text-white text-center leading-relaxed">{card.back}</p>
            {card.codeSnippet && (
              <pre className="mt-4 bg-slate-950 p-3 rounded-lg text-sm text-green-300 overflow-x-auto w-full">
                <code>{card.codeSnippet.replace(/\\n/g, "\n")}</code>
              </pre>
            )}
          </div>
          <div className="flex flex-wrap gap-2 mt-4 justify-center">
            {card.tags.map((tag, i) => (
              <Badge key={i} variant="secondary" className="bg-slate-700 text-slate-300 text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FlashCardsPage() {
  const [technology, setTechnology] = useState<string>("");
  const [topic, setTopic] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<StudySession | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const technologies = Object.keys(TECH_TOPICS);
  const topics = technology ? TECH_TOPICS[technology] || [] : [];

  const generateCards = async () => {
    if (!technology || !topic) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/flashcards/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ technology, topic, count: 10 }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to generate flash cards");
      }

      setSession({
        technology,
        topic,
        cards: data.cards,
        currentIndex: 0,
        stats: {
          total: data.cards.length,
          reviewed: 0,
          correct: 0,
          incorrect: 0,
        },
      });
      setIsFlipped(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const nextCard = (wasCorrect?: boolean) => {
    if (!session) return;

    const newStats = { ...session.stats };
    // Always count as reviewed (including skips)
    newStats.reviewed++;
    if (wasCorrect === true) newStats.correct++;
    else if (wasCorrect === false) newStats.incorrect++;
    // Skip (undefined) = reviewed but neither correct nor incorrect

    if (session.currentIndex < session.cards.length - 1) {
      setSession({
        ...session,
        currentIndex: session.currentIndex + 1,
        stats: newStats,
      });
      setIsFlipped(false);
    } else {
      // Session complete - update stats to trigger completion screen
      setSession({ ...session, stats: newStats });
    }
  };

  const prevCard = () => {
    if (!session || session.currentIndex === 0) return;
    setSession({ ...session, currentIndex: session.currentIndex - 1 });
    setIsFlipped(false);
  };

  const resetSession = () => {
    if (!session) return;
    setSession({
      ...session,
      currentIndex: 0,
      stats: { total: session.cards.length, reviewed: 0, correct: 0, incorrect: 0 },
    });
    setIsFlipped(false);
  };

  const endSession = () => {
    // Show results before ending
    setShowResults(true);
  };

  const finalEndSession = () => {
    setSession(null);
    setIsFlipped(false);
    setShowResults(false);
  };

  // Study mode
  if (session) {
    const currentCard = session.cards[session.currentIndex];
    const isComplete = session.stats.reviewed === session.cards.length;

    // Show results screen when complete OR when user clicks "End Session"
    if (isComplete || showResults) {
      const reviewed = session.stats.reviewed || 0;
      const correct = session.stats.correct || 0;
      const incorrect = session.stats.incorrect || 0;
      const skipped = reviewed - correct - incorrect;
      const percentage = reviewed > 0 ? Math.round((correct / reviewed) * 100) : 0;

      return (
        <div className="mx-auto max-w-4xl">
          <Card className="border-slate-700 bg-slate-800/50">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-white">
                {isComplete ? "Session Complete!" : "Session Summary"}
              </CardTitle>
              <CardDescription>
                {session.technology} - {session.topic}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="text-6xl font-bold text-white mb-2">{percentage}%</div>
                <p className="text-slate-400">Accuracy</p>
              </div>

              <div className="grid grid-cols-4 gap-3 text-center">
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-white">{session.stats.total}</div>
                  <p className="text-xs text-slate-400">Total</p>
                </div>
                <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/20">
                  <div className="text-2xl font-bold text-green-400">{correct}</div>
                  <p className="text-xs text-slate-400">Correct</p>
                </div>
                <div className="bg-red-500/10 rounded-lg p-4 border border-red-500/20">
                  <div className="text-2xl font-bold text-red-400">{incorrect}</div>
                  <p className="text-xs text-slate-400">Wrong</p>
                </div>
                <div className="bg-yellow-500/10 rounded-lg p-4 border border-yellow-500/20">
                  <div className="text-2xl font-bold text-yellow-400">{skipped}</div>
                  <p className="text-xs text-slate-400">Skipped</p>
                </div>
              </div>

              {!isComplete && (
                <div className="text-center text-sm text-slate-400">
                  You reviewed {reviewed} of {session.stats.total} cards
                </div>
              )}

              <div className="flex gap-3 justify-center">
                <Button onClick={resetSession} variant="outline" className="border-slate-600 text-slate-300 hover:text-white">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Study Again
                </Button>
                <Button onClick={finalEndSession} className="bg-blue-600 hover:bg-blue-700 text-white">
                  New Topic
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Layers className="h-6 w-6 text-blue-400" />
              {session.technology} - {session.topic}
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Card {session.currentIndex + 1} of {session.cards.length}
            </p>
          </div>
          <Button onClick={endSession} variant="ghost" className="text-slate-400 hover:text-white">
            End Session
          </Button>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-slate-800 rounded-full mb-6 overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${((session.currentIndex + 1) / session.cards.length) * 100}%` }}
          />
        </div>

        {/* Flash Card */}
        <div className="mb-6">
          <FlashCardDisplay
            card={currentCard}
            isFlipped={isFlipped}
            onFlip={() => setIsFlipped(!isFlipped)}
          />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          <Button
            onClick={prevCard}
            variant="outline"
            className="border-slate-600 text-slate-300 hover:text-white"
            disabled={session.currentIndex === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>

          {isFlipped ? (
            <>
              <Button
                onClick={() => nextCard(false)}
                variant="outline"
                className="border-red-500/50 text-red-400 hover:bg-red-500/10"
              >
                <X className="h-4 w-4 mr-1" />
                Incorrect
              </Button>
              <Button
                onClick={() => nextCard(true)}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Check className="h-4 w-4 mr-1" />
                Correct
              </Button>
            </>
          ) : (
            <Button
              onClick={() => nextCard()}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:text-white"
            >
              Skip
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="mt-6 flex justify-center gap-6 text-sm">
          <span className="text-green-400">
            <Check className="h-4 w-4 inline mr-1" />
            {session.stats.correct} correct
          </span>
          <span className="text-red-400">
            <X className="h-4 w-4 inline mr-1" />
            {session.stats.incorrect} incorrect
          </span>
        </div>
      </div>
    );
  }

  // Selection mode
  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Layers className="h-8 w-8 text-blue-400" />
          Flash Cards
        </h1>
        <p className="mt-2 text-slate-400">
          Master interview concepts with AI-generated flash cards
        </p>
      </div>

      {/* Selection Card */}
      <Card className="border-slate-700 bg-slate-800/50 mb-6">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-400" />
            Generate Flash Cards
          </CardTitle>
          <CardDescription>
            Select a technology and topic to generate interview flash cards
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Technology</label>
              <Select value={technology} onValueChange={(v) => { setTechnology(v); setTopic(""); }}>
                <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                  <SelectValue placeholder="Select technology" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  {technologies.map((tech) => (
                    <SelectItem key={tech} value={tech} className="text-white hover:bg-slate-800 focus:bg-slate-800 focus:text-white">
                      {tech}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Topic</label>
              <Select value={topic} onValueChange={setTopic} disabled={!technology}>
                <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                  <SelectValue placeholder={technology ? "Select topic" : "Select technology first"} />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  {topics.map((t) => (
                    <SelectItem key={t} value={t} className="text-white hover:bg-slate-800 focus:bg-slate-800 focus:text-white">
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <Button
            onClick={generateCards}
            disabled={!technology || !topic || loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating Cards...
              </>
            ) : (
              <>
                <BookOpen className="h-4 w-4 mr-2" />
                Generate 10 Flash Cards
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Quick Topics */}
      <Card className="border-slate-700 bg-slate-800/50">
        <CardHeader>
          <CardTitle className="text-white text-lg">Popular Topics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { tech: "React", topic: "Hooks" },
              { tech: "JavaScript", topic: "ES6+" },
              { tech: "TypeScript", topic: "Types" },
              { tech: "Node.js", topic: "REST API" },
              { tech: "SQL", topic: "Joins" },
              { tech: "System Design", topic: "Scalability" },
            ].map(({ tech, topic: t }) => (
              <button
                key={`${tech}-${t}`}
                onClick={() => { setTechnology(tech); setTopic(t); }}
                className="p-3 bg-slate-900/50 rounded-lg border border-slate-700 hover:border-blue-500/50 hover:bg-slate-900 transition-colors text-left"
              >
                <div className="font-medium text-white">{tech}</div>
                <div className="text-sm text-slate-400">{t}</div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
