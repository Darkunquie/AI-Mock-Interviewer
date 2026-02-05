"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import {
  Upload,
  FileText,
  Loader2,
  Trash2,
  Check,
  X,
  AlertCircle,
  ChevronDown,
  ChevronUp,
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
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  InterviewRole,
  ExperienceLevel,
  ROLE_DISPLAY_NAMES,
  EXPERIENCE_DISPLAY_NAMES,
  Question,
} from "@/types";

interface PdfUploadTabProps {
  onInterviewCreated: (interviewId: string) => void;
  onClose: () => void;
}

type UploadState = "idle" | "uploading" | "parsing" | "preview" | "creating";

// Helper function to filter questions based on experience level
const filterQuestionsByExperience = (
  allQuestions: Question[],
  experienceLevel: ExperienceLevel | ""
): Question[] => {
  if (!experienceLevel || allQuestions.length === 0) {
    return allQuestions;
  }

  const difficultyFilter: Record<ExperienceLevel, string[]> = {
    "0-1": ["easy"],
    "1-3": ["easy", "medium"],
    "3-5": ["medium", "hard"],
    "5+": ["easy", "medium", "hard"], // All difficulties
  };

  const percentageLimit: Record<ExperienceLevel, number> = {
    "0-1": 0.5,  // 50%
    "1-3": 0.65, // 65%
    "3-5": 0.8,  // 80%
    "5+": 1.0,   // 100%
  };

  const allowedDifficulties = difficultyFilter[experienceLevel];
  const percentage = percentageLimit[experienceLevel];

  // Filter by difficulty
  const filtered = allQuestions.filter((q) =>
    allowedDifficulties.includes(q.difficulty)
  );

  // Apply percentage limit
  const limit = Math.ceil(filtered.length * percentage);
  return filtered.slice(0, limit).map((q, i) => ({ ...q, id: i + 1 }));
};

export default function PdfUploadTab({
  onInterviewCreated,
  onClose,
}: PdfUploadTabProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [allParsedQuestions, setAllParsedQuestions] = useState<Question[]>([]); // Store ALL questions
  const [parsedQuestions, setParsedQuestions] = useState<Question[]>([]); // Filtered questions
  const [role, setRole] = useState<InterviewRole | "">("");
  const [experience, setExperience] = useState<ExperienceLevel | "">("");
  const [error, setError] = useState<string | null>(null);
  const [showQuestions, setShowQuestions] = useState(false);
  const [isRoleAutoDetected, setIsRoleAutoDetected] = useState(false);

  // Re-filter questions when experience level changes
  useEffect(() => {
    if (allParsedQuestions.length > 0 && uploadState === "preview") {
      const filtered = filterQuestionsByExperience(allParsedQuestions, experience);
      setParsedQuestions(filtered);

      if (experience) {
        toast.success(
          `Adjusted to ${filtered.length} questions for ${experience} years experience`
        );
      }
    }
  }, [experience, allParsedQuestions, uploadState]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (file.type !== "application/pdf") {
      toast.error("Please select a PDF file");
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setSelectedFile(file);
    setError(null);
  };

  const handleUploadAndParse = async () => {
    if (!selectedFile) return;

    setUploadState("uploading");
    setError(null);

    try {
      const formData = new FormData();
      formData.append("pdf", selectedFile);

      setUploadState("parsing");

      const response = await fetch("/api/interview/parse-pdf", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to parse PDF");
      }

      // Store all questions and apply initial filter
      setAllParsedQuestions(data.questions);
      const filtered = filterQuestionsByExperience(data.questions, experience);
      setParsedQuestions(filtered);
      setUploadState("preview");

      // Auto-fill suggested role if detected
      if (data.suggestedRole && !role) {
        setRole(data.suggestedRole as InterviewRole);
        setIsRoleAutoDetected(true);
        toast.success(
          `Detected: ${data.suggestedRole.charAt(0).toUpperCase() + data.suggestedRole.slice(1)} role (${data.questions.length} questions)`
        );
      } else if (experience) {
        toast.success(`Extracted ${data.questions.length} questions, showing ${filtered.length} for your experience level`);
      } else {
        toast.success(`Extracted ${data.questions.length} questions from PDF`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process PDF");
      setUploadState("idle");
      toast.error(err instanceof Error ? err.message : "Failed to process PDF");
    }
  };

  const handleRemoveQuestion = (index: number) => {
    setParsedQuestions((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      // Re-assign IDs
      return updated.map((q, i) => ({ ...q, id: i + 1 }));
    });
  };

  const handleCreateInterview = async () => {
    if (!role || !experience) {
      toast.error("Please select role and experience level");
      return;
    }

    if (parsedQuestions.length === 0) {
      toast.error("No questions to create interview");
      return;
    }

    setUploadState("creating");

    try {
      const response = await fetch("/api/interview/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          experienceLevel: experience,
          interviewType: "technical",
          duration: "15",
          customQuestions: parsedQuestions,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create interview");
      }

      toast.success("Interview created successfully!");
      onInterviewCreated(data.interviewId);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create interview"
      );
      setUploadState("preview");
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setAllParsedQuestions([]);
    setParsedQuestions([]);
    setUploadState("idle");
    setError(null);
    setShowQuestions(false);
    setIsRoleAutoDetected(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "medium":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "hard":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-slate-500/20 text-slate-400";
    }
  };

  // Render based on state
  if (uploadState === "preview" || uploadState === "creating") {
    return (
      <div className="space-y-4 py-4">
        {/* Role and Experience Selection */}
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label className="text-slate-300">Target Role</Label>
              {isRoleAutoDetected && (
                <span className="text-xs text-blue-400">✓ Auto-detected</span>
              )}
            </div>
            <Select
              value={role}
              onValueChange={(v) => {
                setRole(v as InterviewRole);
                setIsRoleAutoDetected(false); // Clear flag when manually changed
              }}
            >
              <SelectTrigger className="border-slate-600 bg-slate-700 text-white">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent className="border-slate-600 bg-slate-700">
                {Object.entries(ROLE_DISPLAY_NAMES).map(([value, label]) => (
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
            <Label className="text-slate-300">Experience</Label>
            <Select
              value={experience}
              onValueChange={(v) => setExperience(v as ExperienceLevel)}
            >
              <SelectTrigger className="border-slate-600 bg-slate-700 text-white">
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent className="border-slate-600 bg-slate-700">
                {Object.entries(EXPERIENCE_DISPLAY_NAMES).map(
                  ([value, label]) => (
                    <SelectItem
                      key={value}
                      value={value}
                      className="text-white hover:bg-slate-600"
                    >
                      {label}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Questions Preview */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label className="text-slate-300">
                {experience && allParsedQuestions.length > parsedQuestions.length ? (
                  <>
                    Showing {parsedQuestions.length} of {allParsedQuestions.length} questions
                    <span className="ml-2 text-xs text-blue-400">
                      (filtered for {experience} years)
                    </span>
                  </>
                ) : (
                  `Extracted Questions (${parsedQuestions.length})`
                )}
              </Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowQuestions(!showQuestions)}
                className="h-7 px-2 text-slate-400 hover:text-white"
              >
                {showQuestions ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    <span className="ml-1 text-xs">Hide</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    <span className="ml-1 text-xs">Show</span>
                  </>
                )}
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="text-slate-400 hover:text-white"
            >
              <Trash2 className="mr-1 h-4 w-4" />
              Start Over
            </Button>
          </div>

          {showQuestions && (
            <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-slate-600 p-2">
              {parsedQuestions.map((q, index) => (
                <Card key={index} className="border-slate-600 bg-slate-700/50">
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm text-white">{q.text}</p>
                        <div className="mt-2 flex gap-2">
                          <Badge className={getDifficultyColor(q.difficulty)}>
                            {q.difficulty}
                          </Badge>
                          <Badge
                            variant="outline"
                            className="border-slate-500 text-slate-300"
                          >
                            {q.topic}
                          </Badge>
                          <Badge
                            variant="outline"
                            className="border-slate-500 text-slate-300"
                          >
                            {q.expectedTime}s
                          </Badge>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveQuestion(index)}
                        className="h-6 w-6 p-0 text-slate-400 hover:text-red-400"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-slate-400 hover:text-white"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateInterview}
            disabled={
              uploadState === "creating" ||
              !role ||
              !experience ||
              parsedQuestions.length === 0
            }
          >
            {uploadState === "creating" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Create Interview ({parsedQuestions.length} questions)
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  // Upload state UI
  return (
    <div className="space-y-4 py-4">
      {/* Drop zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed p-8 transition-all ${
          selectedFile
            ? "border-blue-500 bg-blue-500/10"
            : "border-slate-600 bg-slate-700/30 hover:border-blue-500 hover:bg-slate-700/50"
        }`}
      >
        {selectedFile ? (
          <>
            <FileText className="h-12 w-12 text-blue-500" />
            <div className="text-center">
              <p className="font-medium text-white">{selectedFile.name}</p>
              <p className="text-sm text-slate-400">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </>
        ) : (
          <>
            <Upload className="h-12 w-12 text-slate-400" />
            <div className="text-center">
              <p className="font-medium text-white">Click to upload PDF</p>
              <p className="text-sm text-slate-400">Maximum file size: 5MB</p>
            </div>
          </>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Error display */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-500/10 p-3 text-red-400">
          <AlertCircle className="h-5 w-5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Info text */}
      <p className="text-center text-xs text-slate-500">
        Upload a PDF containing interview questions. The AI will extract and
        classify each question automatically.
      </p>

      {/* Action buttons */}
      <div className="flex justify-end gap-3">
        {selectedFile && (
          <Button
            variant="ghost"
            onClick={handleReset}
            className="text-slate-400 hover:text-white"
          >
            Clear
          </Button>
        )}
        <Button
          onClick={handleUploadAndParse}
          disabled={!selectedFile || uploadState !== "idle"}
        >
          {uploadState === "uploading" || uploadState === "parsing" ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {uploadState === "uploading" ? "Uploading..." : "Parsing..."}
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Parse PDF
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
