"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  BookOpen,
  Loader2,
  Sparkles,
  GraduationCap,
  CheckCircle2,
  Circle,
  Clock,
  Target,
  Layers,
  ArrowRight,
  Zap,
  Building2,
  Filter,
  Search,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  ExperienceLevel,
  InterviewDuration,
  EXPERIENCE_DISPLAY_NAMES,
  DURATION_CONFIG,
} from "@/types";
import {
  LEARNING_PATHS,
  ROLE_TECH_STACKS,
  EXTENDED_ROLE_NAMES,
  ExtendedRole,
  LearningPath,
  LearningPhase,
} from "@/data/learningPaths";
import { useLearningProgress } from "@/hooks/useLearningProgress";
import { Progress } from "@/components/ui/progress";
import {
  TECH_STACK_DEEP_DIVE,
  TechStackDeepDive,
  TechCategory,
  TECH_CATEGORIES,
} from "@/data/techStackTopics";
import { TechIcon, CategoryIcon } from "@/components/TechIcon";

export default function PracticePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<ExtendedRole | "">("");
  const [experience, setExperience] = useState<ExperienceLevel | "">("");
  const [duration, setDuration] = useState<InterviewDuration>("15");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"topics" | "learning-path" | "tech-deep-dive">("learning-path");
  const [selectedPhase, setSelectedPhase] = useState<number>(1);
  const [learningPath, setLearningPath] = useState<LearningPath | null>(null);

  // Tech Deep Dive state
  const [selectedTech, setSelectedTech] = useState<TechStackDeepDive | null>(null);
  const [techCategory, setTechCategory] = useState<TechCategory | "all">("all");
  const [selectedSubtopics, setSelectedSubtopics] = useState<string[]>([]);
  const [targetCompany, setTargetCompany] = useState<string>("");
  const [techSearchQuery, setTechSearchQuery] = useState<string>("");

  // Progress tracking
  const {
    isLoaded: progressLoaded,
    initializeRole,
    getRoleProgress,
    getRoleProgressPercentage,
    getTopicStatus,
    getTopicProgress,
  } = useLearningProgress();

  // Update learning path when role changes
  useEffect(() => {
    if (role) {
      const path = LEARNING_PATHS.find((p) => p.roleId === role);
      setLearningPath(path || null);
      setSelectedPhase(1);
      setSelectedTopics([]);

      // Initialize progress tracking for this role
      if (path && progressLoaded) {
        initializeRole(role, path.roleName, path.totalTopics);
      }
    } else {
      setLearningPath(null);
    }
  }, [role, progressLoaded, initializeRole]);

  // Get topics for current role
  const getRoleTopics = () => {
    const roleStack = ROLE_TECH_STACKS.find((r) => r.roleId === role);
    return roleStack?.categories || [];
  };

  const toggleTopic = (topic: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  };

  const selectPhaseTopics = (phase: LearningPhase) => {
    const phaseTopics = phase.topics.map((t) => t.name);
    setSelectedTopics(phaseTopics);
  };

  // Tech Deep Dive helper functions
  const filteredTechStacks = TECH_STACK_DEEP_DIVE.filter((t) => {
    const matchesCategory = techCategory === "all" || t.category === techCategory;
    const matchesSearch = !techSearchQuery ||
      t.name.toLowerCase().includes(techSearchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(techSearchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleSubtopic = (subtopicName: string) => {
    setSelectedSubtopics((prev) =>
      prev.includes(subtopicName)
        ? prev.filter((s) => s !== subtopicName)
        : [...prev, subtopicName]
    );
  };

  const selectAllByDifficulty = (difficulty: "beginner" | "intermediate" | "advanced") => {
    if (!selectedTech) return;
    const topics = selectedTech.subtopics
      .filter((s) => s.difficulty === difficulty)
      .map((s) => s.name);
    setSelectedSubtopics(topics);
  };

  const selectInterviewEssentials = () => {
    if (!selectedTech) return;
    const topics = selectedTech.subtopics
      .filter((s) => s.companyFocus && s.companyFocus.length > 0)
      .map((s) => s.name);
    setSelectedSubtopics(topics);
  };

  const handleTechSelect = (tech: TechStackDeepDive) => {
    setSelectedTech(tech);
    setSelectedSubtopics([]);
    setTargetCompany("");
  };

  const handleStart = async () => {
    // Tech Deep Dive mode
    if (activeTab === "tech-deep-dive") {
      if (!selectedTech) {
        toast.error("Please select a technology");
        return;
      }
      if (!experience) {
        toast.error("Please select an experience level");
        return;
      }
      if (selectedSubtopics.length === 0) {
        toast.error("Please select at least one subtopic to practice");
        return;
      }

      setLoading(true);
      try {
        const response = await fetch("/api/interview/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            role: "fullstack", // Default role for tech deep dive
            experienceLevel: experience,
            interviewType: "technical",
            duration,
            mode: "practice",
            topics: selectedSubtopics,
            techDeepDive: {
              technology: selectedTech.name,
              subtopics: selectedSubtopics,
              targetCompany: targetCompany || undefined,
            },
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to create practice session");
        }

        toast.success("Tech Deep Dive session created!");
        router.push(`/dashboard/interview/${data.interviewId}`);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Something went wrong"
        );
      } finally {
        setLoading(false);
      }
      return;
    }

    // Regular practice mode
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
          role: role.includes("_") ? role.split("_")[0] : role, // Map to base role for API
          experienceLevel: experience,
          interviewType: "technical",
          duration,
          mode: "practice",
          topics: selectedTopics,
          specificRole: role, // Send the specific role for better question generation
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create practice session");
      }

      toast.success("Practice session created!");
      router.push(`/dashboard/interview/${data.interviewId}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "intermediate":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "advanced":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-slate-500/20 text-slate-400 border-slate-500/30";
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/10">
            <GraduationCap className="h-5 w-5 text-purple-500" />
          </div>
          <h1 className="text-3xl font-bold text-white">Learning & Practice</h1>
        </div>
        <p className="text-slate-400">
          Choose your role to see a structured learning path with 191+ IT topics, or select specific topics to practice.
        </p>
      </div>

      {/* Role & Settings Selection */}
      <div className="mb-8 grid gap-6 md:grid-cols-3">
        <div className="grid gap-2">
          <Label className="text-slate-300">Target Role</Label>
          <Select value={role} onValueChange={(v) => setRole(v as ExtendedRole)}>
            <SelectTrigger className="border-slate-600 bg-slate-700 text-white">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent className="border-slate-600 bg-slate-700 max-h-96 min-w-[320px]">
              <div className="px-2 py-1 text-xs text-slate-400 font-semibold">Core Roles</div>
              {["frontend", "backend", "fullstack"].map((r) => (
                <SelectItem key={r} value={r} className="text-white hover:bg-slate-600">
                  {EXTENDED_ROLE_NAMES[r as ExtendedRole]}
                </SelectItem>
              ))}
              <div className="px-2 py-1 text-xs text-slate-400 font-semibold mt-2">Data & AI</div>
              {["data_engineer", "data_analyst", "data_scientist", "ml_engineer", "ai_engineer"].map((r) => (
                <SelectItem key={r} value={r} className="text-white hover:bg-slate-600">
                  {EXTENDED_ROLE_NAMES[r as ExtendedRole]}
                </SelectItem>
              ))}
              <div className="px-2 py-1 text-xs text-slate-400 font-semibold mt-2">DevOps & Cloud</div>
              {["devops", "cloud_engineer", "sre"].map((r) => (
                <SelectItem key={r} value={r} className="text-white hover:bg-slate-600">
                  {EXTENDED_ROLE_NAMES[r as ExtendedRole]}
                </SelectItem>
              ))}
              <div className="px-2 py-1 text-xs text-slate-400 font-semibold mt-2">Mobile</div>
              {["mobile_android", "mobile_ios", "mobile_cross"].map((r) => (
                <SelectItem key={r} value={r} className="text-white hover:bg-slate-600">
                  {EXTENDED_ROLE_NAMES[r as ExtendedRole]}
                </SelectItem>
              ))}
              <div className="px-2 py-1 text-xs text-slate-400 font-semibold mt-2">Specialized</div>
              {["security_engineer", "qa_engineer", "sap_consultant", "salesforce_dev", "rpa_developer", "blockchain_dev"].map((r) => (
                <SelectItem key={r} value={r} className="text-white hover:bg-slate-600">
                  {EXTENDED_ROLE_NAMES[r as ExtendedRole]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label className="text-slate-300">Experience Level</Label>
          <Select
            value={experience}
            onValueChange={(v) => setExperience(v as ExperienceLevel)}
          >
            <SelectTrigger className="border-slate-600 bg-slate-700 text-white">
              <SelectValue placeholder="Select level" />
            </SelectTrigger>
            <SelectContent className="border-slate-600 bg-slate-700">
              {Object.entries(EXPERIENCE_DISPLAY_NAMES).map(([value, label]) => (
                <SelectItem
                  key={value}
                  value={value}
                  className="text-white hover:bg-slate-600"
                >
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label className="text-slate-300">Duration</Label>
          <Select
            value={duration}
            onValueChange={(v) => setDuration(v as InterviewDuration)}
          >
            <SelectTrigger className="border-slate-600 bg-slate-700 text-white">
              <SelectValue placeholder="Select duration" />
            </SelectTrigger>
            <SelectContent className="border-slate-600 bg-slate-700">
              {Object.entries(DURATION_CONFIG).map(([value, config]) => (
                <SelectItem
                  key={value}
                  value={value}
                  className="text-white hover:bg-slate-600"
                >
                  {config.label} ({config.questionCount} questions)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tech Stack Display for Selected Role */}
      {role && (
        <Card className="mb-8 border-slate-700 bg-gradient-to-r from-purple-900/20 to-slate-800/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="h-5 w-5 text-purple-400" />
              <h3 className="text-lg font-semibold text-white">
                Tech Stack for {EXTENDED_ROLE_NAMES[role]}
              </h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {getRoleTopics().map((category) => (
                <div key={category.name} className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
                  <h4 className="text-sm font-medium text-purple-300 mb-2 flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    {category.name}
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {category.topics.map((topic) => (
                      <Badge
                        key={topic}
                        variant="secondary"
                        className="bg-slate-700/50 text-slate-300 text-xs hover:bg-purple-500/20 hover:text-purple-300 cursor-default"
                      >
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {getRoleTopics().length === 0 && (
              <p className="text-slate-400 text-sm">No specific tech stack defined for this role yet.</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Learning Path / Topics Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "topics" | "learning-path" | "tech-deep-dive")} className="mb-8">
          <TabsList className="bg-slate-800 border border-slate-700">
            <TabsTrigger value="learning-path" className="data-[state=active]:bg-purple-600">
              <GraduationCap className="h-4 w-4 mr-2" />
              Learning Path
            </TabsTrigger>
            <TabsTrigger value="topics" className="data-[state=active]:bg-purple-600">
              <Layers className="h-4 w-4 mr-2" />
              All Topics
            </TabsTrigger>
            <TabsTrigger value="tech-deep-dive" className="data-[state=active]:bg-blue-600">
              <Zap className="h-4 w-4 mr-2" />
              Tech Deep Dive
            </TabsTrigger>
          </TabsList>

          {/* Learning Path Tab */}
          <TabsContent value="learning-path" className="mt-6">
            {learningPath ? (
              <div className="space-y-6">
                {/* Path Overview Card */}
                <Card className="border-slate-700 bg-gradient-to-r from-purple-900/30 to-slate-800/50">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-4">
                        <span className="text-4xl">{learningPath.icon}</span>
                        <div>
                          <h2 className="text-xl font-bold text-white">{learningPath.roleName}</h2>
                          <p className="text-slate-400">{learningPath.description}</p>
                        </div>
                      </div>
                      <div className="flex gap-6 text-center">
                        <div>
                          <div className="text-2xl font-bold text-purple-400">{learningPath.totalTopics}</div>
                          <div className="text-xs text-slate-400">Topics</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-blue-400">{learningPath.phases.length}</div>
                          <div className="text-xs text-slate-400">Phases</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-green-400">{learningPath.estimatedWeeks}</div>
                          <div className="text-xs text-slate-400">Weeks</div>
                        </div>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    {progressLoaded && getRoleProgress(role) && (
                      <div className="mt-4 pt-4 border-t border-slate-700">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-slate-400">Your Progress</span>
                          <span className="text-sm font-medium text-purple-400">
                            {getRoleProgress(role)?.completedTopics || 0} / {learningPath.totalTopics} topics ({getRoleProgressPercentage(role)}%)
                          </span>
                        </div>
                        <Progress value={getRoleProgressPercentage(role)} className="h-2 bg-slate-700" />
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Phase Selection */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {learningPath.phases.map((phase) => (
                    <button
                      key={phase.phase}
                      onClick={() => setSelectedPhase(phase.phase)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border whitespace-nowrap transition-all ${
                        selectedPhase === phase.phase
                          ? "border-purple-500 bg-purple-500/20 text-purple-300"
                          : "border-slate-700 bg-slate-800/50 text-slate-400 hover:border-purple-500/50"
                      }`}
                    >
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-700 text-xs font-bold">
                        {phase.phase}
                      </span>
                      {phase.name}
                    </button>
                  ))}
                </div>

                {/* Phase Content */}
                {learningPath.phases
                  .filter((p) => p.phase === selectedPhase)
                  .map((phase) => (
                    <Card key={phase.phase} className="border-slate-700 bg-slate-800/50">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="flex items-center gap-2 text-white">
                              Phase {phase.phase}: {phase.name}
                            </CardTitle>
                            <CardDescription className="text-slate-400">
                              {phase.description}
                            </CardDescription>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => selectPhaseTopics(phase)}
                            className="border-purple-500 text-purple-400 hover:bg-purple-500/20"
                          >
                            Select All Phase Topics
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          {phase.topics.map((topic) => {
                            const topicStatus = getTopicStatus(role, topic.id);
                            const topicProgressData = getTopicProgress(role, topic.id);
                            const isCompleted = topicStatus === "completed";
                            const isInProgress = topicStatus === "in_progress";

                            return (
                              <button
                                key={topic.id}
                                type="button"
                                onClick={() => toggleTopic(topic.name)}
                                className={`rounded-lg border p-4 text-left transition-all relative ${
                                  selectedTopics.includes(topic.name)
                                    ? "border-purple-500 bg-purple-500/10"
                                    : isCompleted
                                    ? "border-green-500/50 bg-green-500/5"
                                    : isInProgress
                                    ? "border-yellow-500/50 bg-yellow-500/5"
                                    : "border-slate-700 bg-slate-800/30 hover:border-purple-500/50"
                                }`}
                              >
                                {/* Status indicator */}
                                {isCompleted && (
                                  <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1">
                                    <CheckCircle2 className="h-3 w-3 text-white" />
                                  </div>
                                )}
                                <div className="flex items-start justify-between mb-2">
                                  <span className={`text-sm font-medium ${
                                    selectedTopics.includes(topic.name) ? "text-purple-300" :
                                    isCompleted ? "text-green-300" :
                                    isInProgress ? "text-yellow-300" : "text-white"
                                  }`}>
                                    {topic.name}
                                  </span>
                                  {selectedTopics.includes(topic.name) ? (
                                    <CheckCircle2 className="h-5 w-5 text-purple-400 shrink-0" />
                                  ) : (
                                    <Circle className="h-5 w-5 text-slate-600 shrink-0" />
                                  )}
                                </div>
                                <p className="text-xs text-slate-500 mb-2 line-clamp-2">
                                  {topic.description}
                                </p>
                                <div className="flex items-center justify-between">
                                  <Badge className={getDifficultyColor(topic.difficulty)}>
                                    {topic.difficulty}
                                  </Badge>
                                  <span className="flex items-center text-xs text-slate-500">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {topic.estimatedHours}h
                                  </span>
                                </div>
                                {topicProgressData && topicProgressData.bestScore !== null && (
                                  <div className="mt-2 flex items-center justify-between text-xs">
                                    <span className="text-green-400">Best: {topicProgressData.bestScore}%</span>
                                    <span className="text-slate-500">Practiced {topicProgressData.practiceCount}x</span>
                                  </div>
                                )}
                                {topic.prerequisites && topic.prerequisites.length > 0 && !topicProgressData && (
                                  <div className="mt-2 text-xs text-slate-500">
                                    Prereq: {topic.prerequisites.join(", ")}
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            ) : (
              <Card className="border-slate-700 bg-slate-800/50">
                <CardContent className="py-12 text-center">
                  <GraduationCap className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                  {!role ? (
                    <>
                      <h3 className="text-lg font-semibold text-white mb-2">Select a Role to Begin</h3>
                      <p className="text-slate-400 max-w-md mx-auto">
                        Choose your target role above to see a structured learning path, or use the Tech Deep Dive tab to explore technologies directly.
                      </p>
                    </>
                  ) : (
                    <p className="text-slate-400">
                      Learning path not available for this role yet.
                      <br />
                      Use the "All Topics" tab to select topics manually.
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Topics Tab */}
          <TabsContent value="topics" className="mt-6">
            {!role ? (
              <Card className="border-slate-700 bg-slate-800/50">
                <CardContent className="py-12 text-center">
                  <Target className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">Select a Role First</h3>
                  <p className="text-slate-400 max-w-md mx-auto">
                    Choose your target role above to see tech stack topics, or use the Tech Deep Dive tab to explore technologies directly.
                  </p>
                </CardContent>
              </Card>
            ) : (
            <Card className="border-slate-700 bg-slate-800/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Sparkles className="h-5 w-5 text-purple-400" />
                  Tech Stack for {EXTENDED_ROLE_NAMES[role]}
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Select topics from your role's tech stack. Questions will be tailored to these areas.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {getRoleTopics().length > 0 ? (
                  <div className="space-y-6">
                    {getRoleTopics().map((category) => (
                      <div key={category.name}>
                        <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                          <Target className="h-4 w-4 text-purple-400" />
                          {category.name}
                        </h3>
                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                          {category.topics.map((topic) => (
                            <button
                              key={topic}
                              type="button"
                              onClick={() => toggleTopic(topic)}
                              className={`rounded-lg border p-3 text-left text-sm transition-all ${
                                selectedTopics.includes(topic)
                                  ? "border-purple-500 bg-purple-500/10 text-purple-300"
                                  : "border-slate-700 bg-slate-800/30 text-slate-300 hover:border-purple-500/50"
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
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-slate-400 py-8">
                    No specific tech stack defined for this role. Select from the learning path.
                  </p>
                )}
              </CardContent>
            </Card>
            )}
          </TabsContent>

          {/* Tech Deep Dive Tab */}
          <TabsContent value="tech-deep-dive" className="mt-6">
            <div className="space-y-6">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search courses... (e.g., Python, React, AWS, Blockchain)"
                  value={techSearchQuery}
                  onChange={(e) => setTechSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 rounded-lg border border-slate-600 bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {techSearchQuery && (
                  <button
                    onClick={() => setTechSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>

              {/* Category Filter */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setTechCategory("all")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                    techCategory === "all"
                      ? "border-blue-500 bg-blue-500/20 text-blue-300"
                      : "border-slate-700 bg-slate-800/50 text-slate-400 hover:border-blue-500/50"
                  }`}
                >
                  <Filter className="h-4 w-4" />
                  All
                </button>
                {TECH_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setTechCategory(cat.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                      techCategory === cat.id
                        ? "border-blue-500 bg-blue-500/20 text-blue-300"
                        : "border-slate-700 bg-slate-800/50 text-slate-400 hover:border-blue-500/50"
                    }`}
                  >
                    <CategoryIcon categoryId={cat.id} size={16} />
                    {cat.name}
                  </button>
                ))}
              </div>

              {/* Technology Grid */}
              {!selectedTech && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {filteredTechStacks.map((tech) => (
                    <button
                      key={tech.id}
                      onClick={() => handleTechSelect(tech)}
                      className="rounded-xl border border-slate-700 bg-slate-800/50 p-6 text-left transition-all hover:border-blue-500/50 hover:bg-slate-800"
                    >
                      <TechIcon techId={tech.id} size={48} />
                      <h3 className="mt-3 font-semibold text-white">{tech.name}</h3>
                      <p className="mt-1 text-xs text-slate-400 line-clamp-2">{tech.description}</p>
                      <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
                        <span>{tech.totalSubtopics} topics</span>
                        <span>•</span>
                        <span>{tech.estimatedWeeks} weeks</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Selected Tech Panel */}
              {selectedTech && (
                <div className="space-y-6">
                  {/* Tech Overview Card */}
                  <Card className="border-slate-700 bg-gradient-to-r from-blue-900/30 to-slate-800/50">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => setSelectedTech(null)}
                            className="text-slate-400 hover:text-white"
                          >
                            ← Back
                          </button>
                          <TechIcon techId={selectedTech.id} size={48} />
                          <div>
                            <h2 className="text-xl font-bold text-white">{selectedTech.name}</h2>
                            <p className="text-slate-400">{selectedTech.description}</p>
                          </div>
                        </div>
                        <div className="flex gap-6 text-center">
                          <div>
                            <div className="text-2xl font-bold text-blue-400">{selectedTech.totalSubtopics}</div>
                            <div className="text-xs text-slate-400">Topics</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-green-400">{selectedTech.estimatedWeeks}</div>
                            <div className="text-xs text-slate-400">Weeks</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Company Target Selector */}
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-blue-400" />
                      <Label className="text-slate-300">Target Company:</Label>
                    </div>
                    <Select value={targetCompany} onValueChange={setTargetCompany}>
                      <SelectTrigger className="w-48 border-slate-600 bg-slate-700 text-white">
                        <SelectValue placeholder="Select company" />
                      </SelectTrigger>
                      <SelectContent className="border-slate-600 bg-slate-700">
                        <SelectItem value="general" className="text-white hover:bg-slate-600">General</SelectItem>
                        {selectedTech.companyPatterns.map((cp) => (
                          <SelectItem key={cp.company} value={cp.company} className="text-white hover:bg-slate-600">
                            {cp.company}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {targetCompany && targetCompany !== "general" && (
                      <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 px-3 py-1">
                        <p className="text-xs text-blue-400">
                          ✨ Questions styled for {targetCompany} interviews
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Experience Level for Tech Deep Dive */}
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-blue-400" />
                      <Label className="text-slate-300">Experience Level: <span className="text-red-400">*</span></Label>
                    </div>
                    <Select value={experience} onValueChange={(v) => setExperience(v as ExperienceLevel)}>
                      <SelectTrigger className={`w-48 border-slate-600 bg-slate-700 text-white ${!experience ? "border-red-500/50" : ""}`}>
                        <SelectValue placeholder="Select level (required)" />
                      </SelectTrigger>
                      <SelectContent className="border-slate-600 bg-slate-700">
                        {Object.entries(EXPERIENCE_DISPLAY_NAMES).map(([value, label]) => (
                          <SelectItem key={value} value={value} className="text-white hover:bg-slate-600">
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {!experience && (
                      <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-1">
                        <p className="text-xs text-red-400">Required to start</p>
                      </div>
                    )}
                  </div>

                  {/* Quick Actions */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => selectAllByDifficulty("beginner")}
                      className="border-green-500/50 text-green-400 hover:bg-green-500/20"
                    >
                      Select All Beginner
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => selectAllByDifficulty("intermediate")}
                      className="border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/20"
                    >
                      Select All Intermediate
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => selectAllByDifficulty("advanced")}
                      className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                    >
                      Select All Advanced
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={selectInterviewEssentials}
                      className="border-blue-500/50 text-blue-400 hover:bg-blue-500/20"
                    >
                      <Sparkles className="h-4 w-4 mr-1" />
                      Interview Essentials
                    </Button>
                    {selectedSubtopics.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedSubtopics([])}
                        className="text-slate-400 hover:text-white"
                      >
                        Clear All
                      </Button>
                    )}
                  </div>

                  {/* Subtopics Grid */}
                  <Card className="border-slate-700 bg-slate-800/50">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between text-white">
                        <span className="flex items-center gap-2">
                          <Layers className="h-5 w-5 text-blue-400" />
                          Subtopics
                        </span>
                        {selectedSubtopics.length > 0 && (
                          <Badge className="bg-blue-500/20 text-blue-300">
                            {selectedSubtopics.length} selected
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {selectedTech.subtopics.map((subtopic) => (
                          <button
                            key={subtopic.id}
                            type="button"
                            onClick={() => toggleSubtopic(subtopic.name)}
                            className={`rounded-lg border p-4 text-left transition-all ${
                              selectedSubtopics.includes(subtopic.name)
                                ? "border-blue-500 bg-blue-500/10"
                                : "border-slate-700 bg-slate-800/30 hover:border-blue-500/50"
                            }`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <span className={`text-sm font-medium ${
                                selectedSubtopics.includes(subtopic.name) ? "text-blue-300" : "text-white"
                              }`}>
                                {subtopic.name}
                              </span>
                              {selectedSubtopics.includes(subtopic.name) ? (
                                <CheckCircle2 className="h-5 w-5 text-blue-400 shrink-0" />
                              ) : (
                                <Circle className="h-5 w-5 text-slate-600 shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-slate-500 mb-2 line-clamp-2">
                              {subtopic.description}
                            </p>
                            <div className="flex items-center justify-between">
                              <Badge className={getDifficultyColor(subtopic.difficulty)}>
                                {subtopic.difficulty}
                              </Badge>
                              <span className="flex items-center text-xs text-slate-500">
                                <Clock className="h-3 w-3 mr-1" />
                                {subtopic.estimatedHours}h
                              </span>
                            </div>
                            {subtopic.companyFocus && subtopic.companyFocus.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {subtopic.companyFocus.map((company) => (
                                  <span
                                    key={company}
                                    className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-400"
                                  >
                                    {company}
                                  </span>
                                ))}
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

      {/* Selected Topics Summary - Role-based */}
      {selectedTopics.length > 0 && activeTab !== "tech-deep-dive" && (
        <Card className="mb-8 border-purple-500/30 bg-purple-500/5">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-purple-400" />
                <span className="text-purple-300 font-medium">
                  {selectedTopics.length} topic{selectedTopics.length > 1 ? "s" : ""} selected
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedTopics([])}
                  className="text-sm text-slate-500 hover:text-slate-300"
                >
                  Clear all
                </button>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedTopics.slice(0, 8).map((topic) => (
                <Badge key={topic} variant="secondary" className="bg-purple-500/20 text-purple-300">
                  {topic}
                </Badge>
              ))}
              {selectedTopics.length > 8 && (
                <Badge variant="secondary" className="bg-slate-700 text-slate-300">
                  +{selectedTopics.length - 8} more
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selected Subtopics Summary - Tech Deep Dive */}
      {selectedSubtopics.length > 0 && activeTab === "tech-deep-dive" && (
        <Card className="mb-8 border-blue-500/30 bg-blue-500/5">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-blue-400" />
                <span className="text-blue-300 font-medium">
                  {selectedSubtopics.length} subtopic{selectedSubtopics.length > 1 ? "s" : ""} selected
                  {selectedTech && <span className="text-slate-400 ml-2">in {selectedTech.name}</span>}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedSubtopics([])}
                  className="text-sm text-slate-500 hover:text-slate-300"
                >
                  Clear all
                </button>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedSubtopics.slice(0, 8).map((topic) => (
                <Badge key={topic} variant="secondary" className="bg-blue-500/20 text-blue-300">
                  {topic}
                </Badge>
              ))}
              {selectedSubtopics.length > 8 && (
                <Badge variant="secondary" className="bg-slate-700 text-slate-300">
                  +{selectedSubtopics.length - 8} more
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Start Button */}
      <div className="flex justify-center">
        <Button
          size="lg"
          onClick={handleStart}
          disabled={
            loading ||
            !experience ||
            (activeTab === "tech-deep-dive"
              ? !selectedTech || selectedSubtopics.length === 0
              : !role || selectedTopics.length === 0)
          }
          className={`gap-2 px-8 ${
            activeTab === "tech-deep-dive"
              ? "bg-blue-600 hover:bg-blue-700"
              : "bg-purple-600 hover:bg-purple-700"
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Creating Practice Session...
            </>
          ) : (
            <>
              {activeTab === "tech-deep-dive" ? (
                <Zap className="h-5 w-5" />
              ) : (
                <BookOpen className="h-5 w-5" />
              )}
              {activeTab === "tech-deep-dive" ? "Start Tech Deep Dive" : "Start Practice Session"}
              <ArrowRight className="h-4 w-4 ml-1" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
