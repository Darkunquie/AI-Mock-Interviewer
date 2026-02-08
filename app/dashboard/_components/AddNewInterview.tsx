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
        <div className="flex h-64 cursor-pointer flex-col items-center justify-center gap-4 border-2 border-dashed border-white/[0.08] bg-[#161616] p-6 transition-all hover:border-yellow-400 hover:bg-[#1a1a1a]">
          <div className="flex h-14 w-14 items-center justify-center bg-yellow-400 rotate-45">
            <Plus className="h-7 w-7 text-[#0f0f0f] -rotate-45" />
          </div>
          <div className="text-center">
            <h3 className="font-bold text-white uppercase tracking-wider">Start New Interview</h3>
            <p className="mt-1 text-sm text-zinc-500">
              Practice with AI-powered voice interviews
            </p>
          </div>
        </div>
      </DialogTrigger>
      <DialogContent className="border-white/[0.08] bg-[#161616] text-white sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white font-bold">Create New Mock Interview</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Generate questions with AI or upload your own PDF.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="ai" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-[#0f0f0f] border border-white/[0.08]">
            <TabsTrigger
              value="ai"
              className="data-[state=active]:bg-yellow-400 data-[state=active]:text-[#0f0f0f] font-bold uppercase tracking-wider text-xs"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              AI Generated
            </TabsTrigger>
            <TabsTrigger
              value="pdf"
              className="data-[state=active]:bg-orange-500 data-[state=active]:text-white font-bold uppercase tracking-wider text-xs"
            >
              <FileText className="mr-2 h-4 w-4" />
              Upload PDF
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ai">
            <div className="grid gap-6 py-4">
              {/* Role Selection */}
              <div className="grid gap-2">
                <Label htmlFor="role" className="text-zinc-300 text-[10px] font-black uppercase tracking-widest">
                  Target Role
                </Label>
                <Select value={role} onValueChange={handleRoleChange}>
                  <SelectTrigger className="border-white/[0.08] bg-[#0f0f0f] text-white focus:ring-yellow-400/50">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent className="border-white/[0.08] bg-[#161616]">
                    {Object.entries(ROLE_DISPLAY_NAMES).map(([value, label]) => (
                      <SelectItem key={value} value={value} className="text-white hover:bg-[#0f0f0f]">
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Experience Selection */}
              <div className="grid gap-2">
                <Label htmlFor="experience" className="text-zinc-300 text-[10px] font-black uppercase tracking-widest">
                  Experience Level
                </Label>
                <Select value={experience} onValueChange={(v) => setExperience(v as ExperienceLevel)}>
                  <SelectTrigger className="border-white/[0.08] bg-[#0f0f0f] text-white focus:ring-yellow-400/50">
                    <SelectValue placeholder="Select experience level" />
                  </SelectTrigger>
                  <SelectContent className="border-white/[0.08] bg-[#161616]">
                    {Object.entries(EXPERIENCE_DISPLAY_NAMES).map(([value, label]) => (
                      <SelectItem key={value} value={value} className="text-white hover:bg-[#0f0f0f]">
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Interview Type Selection */}
              <div className="grid gap-2">
                <Label htmlFor="type" className="text-zinc-300 text-[10px] font-black uppercase tracking-widest">
                  Interview Type
                </Label>
                <Select value={interviewType} onValueChange={(v) => setInterviewType(v as InterviewType)}>
                  <SelectTrigger className="border-white/[0.08] bg-[#0f0f0f] text-white focus:ring-yellow-400/50">
                    <SelectValue placeholder="Select interview type" />
                  </SelectTrigger>
                  <SelectContent className="border-white/[0.08] bg-[#161616]">
                    {Object.entries(INTERVIEW_TYPE_DISPLAY_NAMES).map(([value, label]) => (
                      <SelectItem key={value} value={value} className="text-white hover:bg-[#0f0f0f]">
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
                    <Label className="text-zinc-300 text-[10px] font-black uppercase tracking-widest">
                      Tech Stack <span className="text-zinc-500">(optional)</span>
                    </Label>
                    {selectedTechStack.length > 0 && (
                      <span className="text-xs text-yellow-400 bg-yellow-400/10 px-2 py-1 font-bold">
                        {selectedTechStack.length} selected
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500">
                    Select technologies to focus your interview questions on
                  </p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 p-3 border border-white/[0.08] bg-[#0f0f0f] max-h-48 overflow-y-auto">
                    {availableTechStack.map((tech) => (
                      <button
                        key={tech}
                        type="button"
                        onClick={() => toggleTech(tech)}
                        className={`px-3 py-2 text-sm transition-all text-center ${
                          selectedTechStack.includes(tech)
                            ? "bg-yellow-400 text-[#0f0f0f] font-bold border border-yellow-400"
                            : "border border-white/[0.08] bg-[#161616] text-zinc-300 hover:border-yellow-400 hover:text-white hover:bg-[#1a1a1a]"
                        }`}
                      >
                        {tech}
                      </button>
                    ))}
                  </div>
                  {selectedTechStack.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {selectedTechStack.map((tech) => (
                        <span key={tech} className="text-xs bg-yellow-400/20 text-yellow-300 px-2 py-1 font-bold">
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
                  <Label htmlFor="company" className="text-zinc-300 text-[10px] font-black uppercase tracking-widest">
                    Target Company <span className="text-zinc-500">(optional)</span>
                  </Label>
                  <p className="text-xs text-zinc-500">
                    Get questions based on real company interview patterns
                  </p>
                  <Select value={targetCompany} onValueChange={setTargetCompany}>
                    <SelectTrigger className="border-white/[0.08] bg-[#0f0f0f] text-white focus:ring-yellow-400/50">
                      <SelectValue placeholder="Select target company (optional)" />
                    </SelectTrigger>
                    <SelectContent className="border-white/[0.08] bg-[#161616]">
                      <SelectItem value="none" className="text-white hover:bg-[#0f0f0f]">
                        General (No specific company)
                      </SelectItem>
                      <SelectItem value="google" className="text-white hover:bg-[#0f0f0f]">
                        🔵 Google
                      </SelectItem>
                      <SelectItem value="meta" className="text-white hover:bg-[#0f0f0f]">
                        🔵 Meta (Facebook)
                      </SelectItem>
                      <SelectItem value="amazon" className="text-white hover:bg-[#0f0f0f]">
                        🟠 Amazon
                      </SelectItem>
                      <SelectItem value="microsoft" className="text-white hover:bg-[#0f0f0f]">
                        🔵 Microsoft
                      </SelectItem>
                      <SelectItem value="apple" className="text-white hover:bg-[#0f0f0f]">
                        ⚫ Apple
                      </SelectItem>
                      <SelectItem value="netflix" className="text-white hover:bg-[#0f0f0f]">
                        🔴 Netflix
                      </SelectItem>
                      <SelectItem value="uber" className="text-white hover:bg-[#0f0f0f]">
                        ⚫ Uber
                      </SelectItem>
                      <SelectItem value="airbnb" className="text-white hover:bg-[#0f0f0f]">
                        🔴 Airbnb
                      </SelectItem>
                      <SelectItem value="stripe" className="text-white hover:bg-[#0f0f0f]">
                        🟣 Stripe
                      </SelectItem>
                      <SelectItem value="twitter" className="text-white hover:bg-[#0f0f0f]">
                        🔵 Twitter/X
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {targetCompany && targetCompany !== "none" && (
                    <div className="bg-orange-500/10 border border-orange-500/20 p-2">
                      <p className="text-xs text-orange-400">
                        ✨ Questions will match {targetCompany.charAt(0).toUpperCase() + targetCompany.slice(1)}'s interview style
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Duration Selection */}
              <div className="grid gap-2">
                <Label htmlFor="duration" className="text-zinc-300 text-[10px] font-black uppercase tracking-widest">
                  Interview Duration
                </Label>
                <Select value={duration} onValueChange={(v) => setDuration(v as InterviewDuration)}>
                  <SelectTrigger className="border-white/[0.08] bg-[#0f0f0f] text-white focus:ring-yellow-400/50">
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent className="border-white/[0.08] bg-[#161616]">
                    {Object.entries(DURATION_CONFIG).map(([value, config]) => (
                      <SelectItem key={value} value={value} className="text-white hover:bg-[#0f0f0f]">
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
                className="text-zinc-400 hover:text-white hover:bg-[#0f0f0f]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-yellow-400 hover:bg-yellow-300 text-[#0f0f0f] font-bold uppercase tracking-wider"
              >
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
