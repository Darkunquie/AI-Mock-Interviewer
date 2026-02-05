"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Loader2, FileText, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  InterviewRole,
  ExperienceLevel,
  InterviewType,
  InterviewDuration,
  ROLE_DISPLAY_NAMES,
  EXPERIENCE_DISPLAY_NAMES,
  INTERVIEW_TYPE_DISPLAY_NAMES,
  DURATION_CONFIG,
  TECH_STACK_OPTIONS,
} from "@/types";
import PdfUploadTab from "./PdfUploadTab";

export default function AddNewInterview() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<InterviewRole | "">("");
  const [experience, setExperience] = useState<ExperienceLevel | "">("");
  const [interviewType, setInterviewType] = useState<InterviewType | "">("");
  const [duration, setDuration] = useState<InterviewDuration>("15");
  const [selectedTechStack, setSelectedTechStack] = useState<string[]>([]);
  const [targetCompany, setTargetCompany] = useState<string>("");

  const availableTechStack = role ? TECH_STACK_OPTIONS[role] || [] : [];
  const showTechStack = role && interviewType === "technical" && availableTechStack.length > 0;

  const toggleTech = (tech: string) => {
    setSelectedTechStack((prev) =>
      prev.includes(tech) ? prev.filter((t) => t !== tech) : [...prev, tech]
    );
  };

  const handleRoleChange = (v: string) => {
    setRole(v as InterviewRole);
    setSelectedTechStack([]);
  };

  const handleSubmit = async () => {
    if (!role || !experience || !interviewType) {
      toast.error("Please fill in all fields");
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
          interviewType,
          duration,
          techStack: selectedTechStack.length > 0 ? selectedTechStack : undefined,
          targetCompany: targetCompany || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create interview");
      }

      toast.success("Interview created! Generating questions...");
      setOpen(false);
      router.push(`/dashboard/interview/${data.interviewId}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div className="flex h-64 cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-slate-700 bg-slate-800/30 p-6 transition-all hover:border-blue-500 hover:bg-slate-800/50">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/10">
            <Plus className="h-8 w-8 text-blue-500" />
          </div>
          <div className="text-center">
            <h3 className="font-semibold text-white">Start New Interview</h3>
            <p className="mt-1 text-sm text-slate-400">
              Practice with AI-powered voice interviews
            </p>
          </div>
        </div>
      </DialogTrigger>
      <DialogContent className="border-slate-700 bg-slate-800 text-white sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Mock Interview</DialogTitle>
          <DialogDescription className="text-slate-400">
            Generate questions with AI or upload your own PDF.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="ai" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-slate-700">
            <TabsTrigger
              value="ai"
              className="data-[state=active]:bg-slate-600 data-[state=active]:text-white"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              AI Generated
            </TabsTrigger>
            <TabsTrigger
              value="pdf"
              className="data-[state=active]:bg-slate-600 data-[state=active]:text-white"
            >
              <FileText className="mr-2 h-4 w-4" />
              Upload PDF
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ai">
            <div className="grid gap-6 py-4">
              {/* Role Selection */}
              <div className="grid gap-2">
                <Label htmlFor="role" className="text-slate-300">
                  Target Role
                </Label>
                <Select value={role} onValueChange={handleRoleChange}>
                  <SelectTrigger className="border-slate-600 bg-slate-700 text-white">
                    <SelectValue placeholder="Select a role" />
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

              {/* Experience Selection */}
              <div className="grid gap-2">
                <Label htmlFor="experience" className="text-slate-300">
                  Experience Level
                </Label>
                <Select value={experience} onValueChange={(v) => setExperience(v as ExperienceLevel)}>
                  <SelectTrigger className="border-slate-600 bg-slate-700 text-white">
                    <SelectValue placeholder="Select experience level" />
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

              {/* Interview Type Selection */}
              <div className="grid gap-2">
                <Label htmlFor="type" className="text-slate-300">
                  Interview Type
                </Label>
                <Select value={interviewType} onValueChange={(v) => setInterviewType(v as InterviewType)}>
                  <SelectTrigger className="border-slate-600 bg-slate-700 text-white">
                    <SelectValue placeholder="Select interview type" />
                  </SelectTrigger>
                  <SelectContent className="border-slate-600 bg-slate-700">
                    {Object.entries(INTERVIEW_TYPE_DISPLAY_NAMES).map(([value, label]) => (
                      <SelectItem key={value} value={value} className="text-white hover:bg-slate-600">
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tech Stack Selection */}
              {showTechStack && (
                <div className="grid gap-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-slate-300">
                      Tech Stack <span className="text-slate-500">(optional)</span>
                    </Label>
                    {selectedTechStack.length > 0 && (
                      <span className="text-xs text-blue-400 bg-blue-500/10 px-2 py-1 rounded-full">
                        {selectedTechStack.length} selected
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    Select technologies to focus your interview questions on
                  </p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 p-3 rounded-lg border border-slate-700 bg-slate-900/50 max-h-48 overflow-y-auto">
                    {availableTechStack.map((tech) => (
                      <button
                        key={tech}
                        type="button"
                        onClick={() => toggleTech(tech)}
                        className={`rounded-lg px-3 py-2 text-sm transition-all text-center ${
                          selectedTechStack.includes(tech)
                            ? "bg-blue-500 text-white border border-blue-400"
                            : "border border-slate-600 bg-slate-800 text-slate-300 hover:border-blue-500 hover:text-white hover:bg-slate-700"
                        }`}
                      >
                        {tech}
                      </button>
                    ))}
                  </div>
                  {selectedTechStack.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {selectedTechStack.map((tech) => (
                        <span key={tech} className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full">
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Target Company Selection */}
              {interviewType === "technical" && (
                <div className="grid gap-2">
                  <Label htmlFor="company" className="text-slate-300">
                    Target Company <span className="text-slate-500">(optional)</span>
                  </Label>
                  <p className="text-xs text-slate-500">
                    Get questions based on real company interview patterns
                  </p>
                  <Select value={targetCompany} onValueChange={setTargetCompany}>
                    <SelectTrigger className="border-slate-600 bg-slate-700 text-white">
                      <SelectValue placeholder="Select target company (optional)" />
                    </SelectTrigger>
                    <SelectContent className="border-slate-600 bg-slate-700">
                      <SelectItem value="none" className="text-white hover:bg-slate-600">
                        General (No specific company)
                      </SelectItem>
                      <SelectItem value="google" className="text-white hover:bg-slate-600">
                        🔵 Google
                      </SelectItem>
                      <SelectItem value="meta" className="text-white hover:bg-slate-600">
                        🔵 Meta (Facebook)
                      </SelectItem>
                      <SelectItem value="amazon" className="text-white hover:bg-slate-600">
                        🟠 Amazon
                      </SelectItem>
                      <SelectItem value="microsoft" className="text-white hover:bg-slate-600">
                        🔵 Microsoft
                      </SelectItem>
                      <SelectItem value="apple" className="text-white hover:bg-slate-600">
                        ⚫ Apple
                      </SelectItem>
                      <SelectItem value="netflix" className="text-white hover:bg-slate-600">
                        🔴 Netflix
                      </SelectItem>
                      <SelectItem value="uber" className="text-white hover:bg-slate-600">
                        ⚫ Uber
                      </SelectItem>
                      <SelectItem value="airbnb" className="text-white hover:bg-slate-600">
                        🔴 Airbnb
                      </SelectItem>
                      <SelectItem value="stripe" className="text-white hover:bg-slate-600">
                        🟣 Stripe
                      </SelectItem>
                      <SelectItem value="twitter" className="text-white hover:bg-slate-600">
                        🔵 Twitter/X
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {targetCompany && targetCompany !== "none" && (
                    <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-2">
                      <p className="text-xs text-blue-400">
                        ✨ Questions will match {targetCompany.charAt(0).toUpperCase() + targetCompany.slice(1)}'s interview style
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Duration Selection */}
              <div className="grid gap-2">
                <Label htmlFor="duration" className="text-slate-300">
                  Interview Duration
                </Label>
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
            <div className="flex justify-end gap-3">
              <Button
                variant="ghost"
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Start Interview"
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="pdf">
            <PdfUploadTab
              onInterviewCreated={(id) => {
                setOpen(false);
                router.push(`/dashboard/interview/${id}`);
              }}
              onClose={() => setOpen(false)}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
