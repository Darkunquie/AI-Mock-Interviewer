"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";
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
import {
  InterviewRole,
  ExperienceLevel,
  InterviewType,
  ROLE_DISPLAY_NAMES,
  EXPERIENCE_DISPLAY_NAMES,
  INTERVIEW_TYPE_DISPLAY_NAMES,
} from "@/types";

export default function AddNewInterview() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<InterviewRole | "">("");
  const [experience, setExperience] = useState<ExperienceLevel | "">("");
  const [interviewType, setInterviewType] = useState<InterviewType | "">("");

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
      <DialogContent className="border-slate-700 bg-slate-800 text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Mock Interview</DialogTitle>
          <DialogDescription className="text-slate-400">
            Configure your interview settings. The AI will generate personalized questions based on your selection.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          {/* Role Selection */}
          <div className="grid gap-2">
            <Label htmlFor="role" className="text-slate-300">
              Target Role
            </Label>
            <Select value={role} onValueChange={(v) => setRole(v as InterviewRole)}>
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
      </DialogContent>
    </Dialog>
  );
}
