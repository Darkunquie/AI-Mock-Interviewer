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
          <div className="flex h-10 w-10 items-center justify-center bg-yellow-400 rotate-45">
            <GraduationCap className="h-5 w-5 text-[#0f0f0f] -rotate-45" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500">Learning Center</p>
            <h1 className="text-3xl font-bold text-white">Learning & Practice</h1>
          </div>
        </div>
        <p className="text-zinc-500 text-sm">
          Choose your role to see a structured learning path with 191+ IT topics, or select specific topics to practice.
        </p>
      </div>

      {/* Role & Settings Selection */}
      <div className="mb-8 grid gap-6 md:grid-cols-3">
        <div className="grid gap-2">
          <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Target Role</Label>
          <Select value={role} onValueChange={(v) => setRole(v as ExtendedRole)}>
            <SelectTrigger className="border-white/[0.08] bg-[#161616] text-white hover:border-yellow-400/50 transition-colors">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent className="border-white/[0.08] bg-[#161616] max-h-96 min-w-[320px]">
              <div className="px-2 py-1 text-[10px] text-yellow-400 font-black uppercase tracking-widest">Core Roles</div>
              {["frontend", "backend", "fullstack"].map((r) => (
                <SelectItem key={r} value={r} className="text-white hover:bg-[#1a1a1a]">
                  {EXTENDED_ROLE_NAMES[r as ExtendedRole]}
                </SelectItem>
              ))}
              <div className="px-2 py-1 text-[10px] text-orange-500 font-black uppercase tracking-widest mt-2">Data & AI</div>
              {["data_engineer", "data_analyst", "data_scientist", "ml_engineer", "ai_engineer"].map((r) => (
                <SelectItem key={r} value={r} className="text-white hover:bg-[#1a1a1a]">
                  {EXTENDED_ROLE_NAMES[r as ExtendedRole]}
                </SelectItem>
              ))}
              <div className="px-2 py-1 text-[10px] text-orange-500 font-black uppercase tracking-widest mt-2">DevOps & Cloud</div>
              {["devops", "cloud_engineer", "sre"].map((r) => (
                <SelectItem key={r} value={r} className="text-white hover:bg-[#1a1a1a]">
                  {EXTENDED_ROLE_NAMES[r as ExtendedRole]}
                </SelectItem>
              ))}
              <div className="px-2 py-1 text-[10px] text-orange-500 font-black uppercase tracking-widest mt-2">Mobile</div>
              {["mobile_android", "mobile_ios", "mobile_cross"].map((r) => (
                <SelectItem key={r} value={r} className="text-white hover:bg-[#1a1a1a]">
                  {EXTENDED_ROLE_NAMES[r as ExtendedRole]}
                </SelectItem>
              ))}
              <div className="px-2 py-1 text-[10px] text-orange-500 font-black uppercase tracking-widest mt-2">Specialized</div>
              {["security_engineer", "qa_engineer", "sap_consultant", "salesforce_dev", "rpa_developer", "blockchain_dev"].map((r) => (
                <SelectItem key={r} value={r} className="text-white hover:bg-[#1a1a1a]">
                  {EXTENDED_ROLE_NAMES[r as ExtendedRole]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Experience Level</Label>
          <Select
            value={experience}
            onValueChange={(v) => setExperience(v as ExperienceLevel)}
          >
            <SelectTrigger className="border-white/[0.08] bg-[#161616] text-white hover:border-yellow-400/50 transition-colors">
              <SelectValue placeholder="Select level" />
            </SelectTrigger>
            <SelectContent className="border-white/[0.08] bg-[#161616]">
              {Object.entries(EXPERIENCE_DISPLAY_NAMES).map(([value, label]) => (
                <SelectItem
                  key={value}
                  value={value}
                  className="text-white hover:bg-[#1a1a1a]"
                >
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Duration</Label>
          <Select
            value={duration}
            onValueChange={(v) => setDuration(v as InterviewDuration)}
          >
            <SelectTrigger className="border-white/[0.08] bg-[#161616] text-white hover:border-yellow-400/50 transition-colors">
              <SelectValue placeholder="Select duration" />
            </SelectTrigger>
            <SelectContent className="border-white/[0.08] bg-[#161616]">
              {Object.entries(DURATION_CONFIG).map(([value, config]) => (
                <SelectItem
                  key={value}
                  value={value}
                  className="text-white hover:bg-[#1a1a1a]"
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
        <Card className="mb-8 border-white/[0.08] bg-[#161616]">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="h-5 w-5 text-yellow-400" />
              <h3 className="text-lg font-bold text-white">
                Tech Stack for {EXTENDED_ROLE_NAMES[role]}
              </h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {getRoleTopics().map((category) => (
                <div key={category.name} className="border border-white/[0.08] bg-[#0f0f0f] p-4">
                  <h4 className="text-[10px] font-black text-yellow-400 mb-2 flex items-center gap-2 uppercase tracking-widest">
                    <Target className="h-4 w-4" />
                    {category.name}
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {category.topics.map((topic) => (
                      <Badge
                        key={topic}
                        variant="secondary"
                        className="bg-zinc-800 text-zinc-300 text-xs hover:bg-yellow-400/20 hover:text-yellow-400 cursor-default"
                      >
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {getRoleTopics().length === 0 && (
              <p className="text-zinc-500 text-sm">No specific tech stack defined for this role yet.</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Learning Path / Topics Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "topics" | "learning-path" | "tech-deep-dive")} className="mb-8">
          <TabsList className="bg-[#161616] border border-white/[0.08]">
            <TabsTrigger value="learning-path" className="data-[state=active]:bg-yellow-400 data-[state=active]:text-[#0f0f0f] font-bold uppercase text-xs tracking-wider">
              <GraduationCap className="h-4 w-4 mr-2" />
              Learning Path
            </TabsTrigger>
            <TabsTrigger value="topics" className="data-[state=active]:bg-yellow-400 data-[state=active]:text-[#0f0f0f] font-bold uppercase text-xs tracking-wider">
              <Layers className="h-4 w-4 mr-2" />
              All Topics
            </TabsTrigger>
            <TabsTrigger value="tech-deep-dive" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white font-bold uppercase text-xs tracking-wider">
              <Zap className="h-4 w-4 mr-2" />
              Tech Deep Dive
            </TabsTrigger>
          </TabsList>

          {/* Learning Path Tab */}
          <TabsContent value="learning-path" className="mt-6">
            {learningPath ? (
              <div className="space-y-6">
                {/* Path Overview Card */}
                <Card className="border-white/[0.08] bg-[#161616]">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-4">
                        <span className="text-4xl">{learningPath.icon}</span>
                        <div>
                          <h2 className="text-xl font-bold text-white">{learningPath.roleName}</h2>
                          <p className="text-zinc-500 text-sm">{learningPath.description}</p>
                        </div>
                      </div>
                      <div className="flex gap-6 text-center">
                        <div>
                          <div className="text-2xl font-black text-yellow-400">{learningPath.totalTopics}</div>
                          <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Topics</div>
                        </div>
                        <div>
                          <div className="text-2xl font-black text-orange-500">{learningPath.phases.length}</div>
                          <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Phases</div>
                        </div>
                        <div>
                          <div className="text-2xl font-black text-emerald-500">{learningPath.estimatedWeeks}</div>
                          <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Weeks</div>
                        </div>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    {progressLoaded && getRoleProgress(role) && (
                      <div className="mt-4 pt-4 border-t border-white/[0.08]">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Your Progress</span>
                          <span className="text-sm font-bold text-yellow-400">
                            {getRoleProgress(role)?.completedTopics || 0} / {learningPath.totalTopics} topics ({getRoleProgressPercentage(role)}%)
                          </span>
                        </div>
                        <Progress value={getRoleProgressPercentage(role)} className="h-2 bg-zinc-800" />
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
                      className={`flex items-center gap-2 px-4 py-2 border whitespace-nowrap transition-all text-sm font-bold ${
                        selectedPhase === phase.phase
                          ? "border-yellow-400 bg-yellow-400/10 text-yellow-400"
                          : "border-white/[0.08] bg-[#161616] text-zinc-400 hover:border-yellow-400/50"
                      }`}
                    >
                      <span className="flex h-6 w-6 items-center justify-center bg-zinc-800 text-xs font-black">
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
                    <Card key={phase.phase} className="border-white/[0.08] bg-[#161616]">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="flex items-center gap-2 text-white">
                              Phase {phase.phase}: {phase.name}
                            </CardTitle>
                            <CardDescription className="text-zinc-500">
                              {phase.description}
                            </CardDescription>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => selectPhaseTopics(phase)}
                            className="border-yellow-400 text-yellow-400 hover:bg-yellow-400/20"
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
                                className={`border p-4 text-left transition-all relative ${
                                  selectedTopics.includes(topic.name)
                                    ? "border-yellow-400 bg-yellow-400/10"
                                    : isCompleted
                                    ? "border-emerald-500/50 bg-emerald-500/5"
                                    : isInProgress
                                    ? "border-orange-500/50 bg-orange-500/5"
                                    : "border-white/[0.08] bg-[#0f0f0f] hover:border-yellow-400/50"
                                }`}
                              >
                                {/* Status indicator */}
                                {isCompleted && (
                                  <div className="absolute -top-2 -right-2 bg-emerald-500 p-1">
                                    <CheckCircle2 className="h-3 w-3 text-white" />
                                  </div>
                                )}
                                <div className="flex items-start justify-between mb-2">
                                  <span className={`text-sm font-medium ${
                                    selectedTopics.includes(topic.name) ? "text-yellow-400" :
                                    isCompleted ? "text-emerald-400" :
                                    isInProgress ? "text-orange-400" : "text-white"
                                  }`}>
                                    {topic.name}
                                  </span>
                                  {selectedTopics.includes(topic.name) ? (
                                    <CheckCircle2 className="h-5 w-5 text-yellow-400 shrink-0" />
                                  ) : (
                                    <Circle className="h-5 w-5 text-zinc-700 shrink-0" />
                                  )}
                                </div>
                                <p className="text-xs text-zinc-600 mb-2 line-clamp-2">
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
              <Card className="border-white/[0.08] bg-[#161616]">
                <CardContent className="py-12 text-center">
                  <GraduationCap className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
                  {!role ? (
                    <>
                      <h3 className="text-lg font-bold text-white mb-2">Select a Role to Begin</h3>
                      <p className="text-zinc-500 max-w-md mx-auto text-sm">
                        Choose your target role above to see a structured learning path, or use the Tech Deep Dive tab to explore technologies directly.
                      </p>
                    </>
                  ) : (
                    <p className="text-zinc-500 text-sm">
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
              <Card className="border-white/[0.08] bg-[#161616]">
                <CardContent className="py-12 text-center">
                  <Target className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-white mb-2">Select a Role First</h3>
                  <p className="text-zinc-500 max-w-md mx-auto text-sm">
                    Choose your target role above to see tech stack topics, or use the Tech Deep Dive tab to explore technologies directly.
                  </p>
                </CardContent>
              </Card>
            ) : (
            <Card className="border-white/[0.08] bg-[#161616]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Sparkles className="h-5 w-5 text-yellow-400" />
                  Tech Stack for {EXTENDED_ROLE_NAMES[role]}
                </CardTitle>
                <CardDescription className="text-zinc-500">
                  Select topics from your role's tech stack. Questions will be tailored to these areas.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {getRoleTopics().length > 0 ? (
                  <div className="space-y-6">
                    {getRoleTopics().map((category) => (
                      <div key={category.name}>
                        <h3 className="text-[10px] font-black text-yellow-400 mb-3 flex items-center gap-2 uppercase tracking-widest">
                          <Target className="h-4 w-4" />
                          {category.name}
                        </h3>
                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                          {category.topics.map((topic) => (
                            <button
                              key={topic}
                              type="button"
                              onClick={() => toggleTopic(topic)}
                              className={`border p-3 text-left text-sm transition-all ${
                                selectedTopics.includes(topic)
                                  ? "border-yellow-400 bg-yellow-400/10 text-yellow-400"
                                  : "border-white/[0.08] bg-[#0f0f0f] text-zinc-300 hover:border-yellow-400/50"
                              }`}
                            >
                              <span className="flex items-center gap-2">
                                <span
                                  className={`flex h-5 w-5 shrink-0 items-center justify-center border text-xs ${
                                    selectedTopics.includes(topic)
                                      ? "border-yellow-400 bg-yellow-400 text-[#0f0f0f]"
                                      : "border-zinc-700"
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
                  <p className="text-center text-zinc-500 py-8 text-sm">
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
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search courses... (e.g., Python, React, AWS, Blockchain)"
                  value={techSearchQuery}
                  onChange={(e) => setTechSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 border border-white/[0.08] bg-[#161616] text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                {techSearchQuery && (
                  <button
                    onClick={() => setTechSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>

              {/* Category Filter */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setTechCategory("all")}
                  className={`flex items-center gap-2 px-4 py-2 border transition-all text-sm font-bold ${
                    techCategory === "all"
                      ? "border-orange-500 bg-orange-500/20 text-orange-400"
                      : "border-white/[0.08] bg-[#161616] text-zinc-400 hover:border-orange-500/50"
                  }`}
                >
                  <Filter className="h-4 w-4" />
                  All
                </button>
                {TECH_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setTechCategory(cat.id)}
                    className={`flex items-center gap-2 px-4 py-2 border transition-all text-sm font-bold ${
                      techCategory === cat.id
                        ? "border-orange-500 bg-orange-500/20 text-orange-400"
                        : "border-white/[0.08] bg-[#161616] text-zinc-400 hover:border-orange-500/50"
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
                      className="border border-white/[0.08] bg-[#161616] p-6 text-left transition-all hover:border-orange-500/50 hover:bg-[#1a1a1a]"
                    >
                      <TechIcon techId={tech.id} size={48} />
                      <h3 className="mt-3 font-bold text-white">{tech.name}</h3>
                      <p className="mt-1 text-xs text-zinc-500 line-clamp-2">{tech.description}</p>
                      <div className="mt-3 flex items-center gap-3 text-[10px] text-zinc-600 uppercase tracking-wider font-bold">
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
                  <Card className="border-white/[0.08] bg-[#161616]">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => setSelectedTech(null)}
                            className="text-zinc-500 hover:text-yellow-400 font-bold"
                          >
                            ← Back
                          </button>
                          <TechIcon techId={selectedTech.id} size={48} />
                          <div>
                            <h2 className="text-xl font-bold text-white">{selectedTech.name}</h2>
                            <p className="text-zinc-500 text-sm">{selectedTech.description}</p>
                          </div>
                        </div>
                        <div className="flex gap-6 text-center">
                          <div>
                            <div className="text-2xl font-black text-orange-500">{selectedTech.totalSubtopics}</div>
                            <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Topics</div>
                          </div>
                          <div>
                            <div className="text-2xl font-black text-emerald-500">{selectedTech.estimatedWeeks}</div>
                            <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Weeks</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Company Target Selector */}
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-orange-500" />
                      <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Target Company:</Label>
                    </div>
                    <Select value={targetCompany} onValueChange={setTargetCompany}>
                      <SelectTrigger className="w-48 border-white/[0.08] bg-[#161616] text-white hover:border-orange-500/50 transition-colors">
                        <SelectValue placeholder="Select company" />
                      </SelectTrigger>
                      <SelectContent className="border-white/[0.08] bg-[#161616]">
                        <SelectItem value="general" className="text-white hover:bg-[#1a1a1a]">General</SelectItem>
                        {selectedTech.companyPatterns.map((cp) => (
                          <SelectItem key={cp.company} value={cp.company} className="text-white hover:bg-[#1a1a1a]">
                            {cp.company}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {targetCompany && targetCompany !== "general" && (
                      <div className="bg-orange-500/10 border border-orange-500/20 px-3 py-1">
                        <p className="text-xs text-orange-400">
                          ✨ Questions styled for {targetCompany} interviews
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Experience Level for Tech Deep Dive */}
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-orange-500" />
                      <Label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Experience Level: <span className="text-red-400">*</span></Label>
                    </div>
                    <Select value={experience} onValueChange={(v) => setExperience(v as ExperienceLevel)}>
                      <SelectTrigger className={`w-48 border-white/[0.08] bg-[#161616] text-white ${!experience ? "border-red-500/50" : ""}`}>
                        <SelectValue placeholder="Select level (required)" />
                      </SelectTrigger>
                      <SelectContent className="border-white/[0.08] bg-[#161616]">
                        {Object.entries(EXPERIENCE_DISPLAY_NAMES).map(([value, label]) => (
                          <SelectItem key={value} value={value} className="text-white hover:bg-[#1a1a1a]">
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {!experience && (
                      <div className="bg-red-500/10 border border-red-500/20 px-3 py-1">
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
                      className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/20"
                    >
                      Select All Beginner
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => selectAllByDifficulty("intermediate")}
                      className="border-yellow-400/50 text-yellow-400 hover:bg-yellow-400/20"
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
                      className="border-orange-500/50 text-orange-400 hover:bg-orange-500/20"
                    >
                      <Sparkles className="h-4 w-4 mr-1" />
                      Interview Essentials
                    </Button>
                    {selectedSubtopics.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedSubtopics([])}
                        className="text-zinc-500 hover:text-white"
                      >
                        Clear All
                      </Button>
                    )}
                  </div>

                  {/* Subtopics Grid */}
                  <Card className="border-white/[0.08] bg-[#161616]">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between text-white">
                        <span className="flex items-center gap-2">
                          <Layers className="h-5 w-5 text-orange-500" />
                          Subtopics
                        </span>
                        {selectedSubtopics.length > 0 && (
                          <Badge className="bg-orange-500/20 text-orange-400">
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
                            className={`border p-4 text-left transition-all ${
                              selectedSubtopics.includes(subtopic.name)
                                ? "border-orange-500 bg-orange-500/10"
                                : "border-white/[0.08] bg-[#0f0f0f] hover:border-orange-500/50"
                            }`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <span className={`text-sm font-medium ${
                                selectedSubtopics.includes(subtopic.name) ? "text-orange-400" : "text-white"
                              }`}>
                                {subtopic.name}
                              </span>
                              {selectedSubtopics.includes(subtopic.name) ? (
                                <CheckCircle2 className="h-5 w-5 text-orange-500 shrink-0" />
                              ) : (
                                <Circle className="h-5 w-5 text-zinc-700 shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-zinc-600 mb-2 line-clamp-2">
                              {subtopic.description}
                            </p>
                            <div className="flex items-center justify-between">
                              <Badge className={getDifficultyColor(subtopic.difficulty)}>
                                {subtopic.difficulty}
                              </Badge>
                              <span className="flex items-center text-xs text-zinc-600">
                                <Clock className="h-3 w-3 mr-1" />
                                {subtopic.estimatedHours}h
                              </span>
                            </div>
                            {subtopic.companyFocus && subtopic.companyFocus.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {subtopic.companyFocus.map((company) => (
                                  <span
                                    key={company}
                                    className="text-[10px] px-1.5 py-0.5 bg-zinc-800 text-zinc-500"
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
        <Card className="mb-8 border-yellow-400/30 bg-yellow-400/5">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-yellow-400" />
                <span className="text-yellow-400 font-bold">
                  {selectedTopics.length} topic{selectedTopics.length > 1 ? "s" : ""} selected
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedTopics([])}
                  className="text-sm text-zinc-500 hover:text-white font-bold"
                >
                  Clear all
                </button>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedTopics.slice(0, 8).map((topic) => (
                <Badge key={topic} variant="secondary" className="bg-yellow-400/20 text-yellow-400">
                  {topic}
                </Badge>
              ))}
              {selectedTopics.length > 8 && (
                <Badge variant="secondary" className="bg-zinc-800 text-zinc-400">
                  +{selectedTopics.length - 8} more
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selected Subtopics Summary - Tech Deep Dive */}
      {selectedSubtopics.length > 0 && activeTab === "tech-deep-dive" && (
        <Card className="mb-8 border-orange-500/30 bg-orange-500/5">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-orange-500" />
                <span className="text-orange-400 font-bold">
                  {selectedSubtopics.length} subtopic{selectedSubtopics.length > 1 ? "s" : ""} selected
                  {selectedTech && <span className="text-zinc-500 ml-2">in {selectedTech.name}</span>}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedSubtopics([])}
                  className="text-sm text-zinc-500 hover:text-white font-bold"
                >
                  Clear all
                </button>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedSubtopics.slice(0, 8).map((topic) => (
                <Badge key={topic} variant="secondary" className="bg-orange-500/20 text-orange-400">
                  {topic}
                </Badge>
              ))}
              {selectedSubtopics.length > 8 && (
                <Badge variant="secondary" className="bg-zinc-800 text-zinc-400">
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
          className={`gap-2 px-10 py-6 font-black uppercase tracking-widest ${
            activeTab === "tech-deep-dive"
              ? "bg-orange-500 hover:bg-orange-600 text-white"
              : "bg-yellow-400 hover:bg-yellow-300 text-[#0f0f0f]"
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Creating Session...
            </>
          ) : (
            <>
              {activeTab === "tech-deep-dive" ? (
                <Zap className="h-5 w-5" />
              ) : (
                <BookOpen className="h-5 w-5" />
              )}
              {activeTab === "tech-deep-dive" ? "Start Tech Deep Dive" : "Start Practice"}
              <ArrowRight className="h-4 w-4 ml-1" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
