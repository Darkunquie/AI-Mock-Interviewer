"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BookOpen, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  InterviewRole,
  ExperienceLevel,
  InterviewDuration,
  ROLE_DISPLAY_NAMES,
  EXPERIENCE_DISPLAY_NAMES,
  DURATION_CONFIG,
  PRACTICE_TOPICS,
} from "@/types";

export default function PracticePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<InterviewRole | "">("");
  const [experience, setExperience] = useState<ExperienceLevel | "">("");
  const [duration, setDuration] = useState<InterviewDuration>("15");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

  const toggleTopic = (topic: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  };

  const handleStart = async () => {
    if (!role || !experience) {
      toast.error("Please select a role and experience level");
      return;
    }
    if (selectedTopics.length === 0) {
      toast.error("Please select at least one topic to practice");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/interview/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          experienceLevel: experience,
          interviewType: "technical",
          duration,
          mode: "practice",
          topics: selectedTopics,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create practice session");
      }

      toast.success("Practice session created!");
      router.push(`/dashboard/interview/${data.interviewId}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/10">
            <BookOpen className="h-5 w-5 text-purple-500" />
          </div>
          <h1 className="text-3xl font-bold text-white">Topic Practice</h1>
        </div>
        <p className="text-slate-400">
          Focus your practice on specific topics. Select the areas you want to improve and get
          targeted questions.
        </p>
      </div>

      {/* Settings */}
      <div className="mb-8 grid gap-6 md:grid-cols-3">
        <div className="grid gap-2">
          <Label className="text-slate-300">Target Role</Label>
          <Select value={role} onValueChange={(v) => setRole(v as InterviewRole)}>
            <SelectTrigger className="border-slate-600 bg-slate-700 text-white">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent className="border-slate-600 bg-slate-700">
              {Object.entries(ROLE_DISPLAY_NAMES).map(([value, label]) => (
                <SelectItem key={value} value={value} className="text-white hover:bg-slate-600">
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label className="text-slate-300">Experience Level</Label>
          <Select value={experience} onValueChange={(v) => setExperience(v as ExperienceLevel)}>
            <SelectTrigger className="border-slate-600 bg-slate-700 text-white">
              <SelectValue placeholder="Select level" />
            </SelectTrigger>
            <SelectContent className="border-slate-600 bg-slate-700">
              {Object.entries(EXPERIENCE_DISPLAY_NAMES).map(([value, label]) => (
                <SelectItem key={value} value={value} className="text-white hover:bg-slate-600">
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label className="text-slate-300">Duration</Label>
          <Select value={duration} onValueChange={(v) => setDuration(v as InterviewDuration)}>
            <SelectTrigger className="border-slate-600 bg-slate-700 text-white">
              <SelectValue placeholder="Select duration" />
            </SelectTrigger>
            <SelectContent className="border-slate-600 bg-slate-700">
              {Object.entries(DURATION_CONFIG).map(([value, config]) => (
                <SelectItem key={value} value={value} className="text-white hover:bg-slate-600">
                  {config.label} ({config.questionCount} questions)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Topic Selection */}
      <Card className="mb-8 border-slate-700 bg-slate-800/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Sparkles className="h-5 w-5 text-purple-400" />
            Select Topics to Practice
          </CardTitle>
          <CardDescription className="text-slate-400">
            Choose one or more topics. The AI will generate focused questions on these areas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {PRACTICE_TOPICS.map((topic) => (
              <button
                key={topic}
                type="button"
                onClick={() => toggleTopic(topic)}
                className={`rounded-lg border p-3 text-left text-sm transition-all ${
                  selectedTopics.includes(topic)
                    ? "border-purple-500 bg-purple-500/10 text-purple-300"
                    : "border-slate-700 bg-slate-800/30 text-slate-300 hover:border-purple-500/50 hover:bg-slate-800"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs ${
                      selectedTopics.includes(topic)
                        ? "border-purple-500 bg-purple-500 text-white"
                        : "border-slate-600"
                    }`}
                  >
                    {selectedTopics.includes(topic) ? "✓" : ""}
                  </span>
                  {topic}
                </span>
              </button>
            ))}
          </div>
          {selectedTopics.length > 0 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-purple-400">
                {selectedTopics.length} topic{selectedTopics.length > 1 ? "s" : ""} selected
              </p>
              <button
                type="button"
                onClick={() => setSelectedTopics([])}
                className="text-xs text-slate-500 hover:text-slate-300"
              >
                Clear all
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Start Button */}
      <div className="flex justify-center">
        <Button
          size="lg"
          onClick={handleStart}
          disabled={loading || !role || !experience || selectedTopics.length === 0}
          className="gap-2 bg-purple-600 hover:bg-purple-700"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Creating Practice Session...
            </>
          ) : (
            <>
              <BookOpen className="h-5 w-5" />
              Start Practice Session
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
