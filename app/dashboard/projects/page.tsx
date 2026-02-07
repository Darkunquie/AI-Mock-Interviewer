"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  FolderKanban,
  Loader2,
  Sparkles,
  CheckCircle2,
  Database,
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
import { Badge } from "@/components/ui/badge";
import {
  TECH_STACK_DEEP_DIVE,
  TECH_CATEGORIES,
} from "@/data/techStackTopics";
import { PROJECT_DOMAINS } from "@/data/projectDomains";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { ProjectSpecification } from "@/types/project";

export default function ProjectsPage() {
  // Projects state
  const [projectTech, setProjectTech] = useState<string>("");
  const [projectDomain, setProjectDomain] = useState<string>("");
  const [generatedProjects, setGeneratedProjects] = useState<ProjectSpecification[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);

  // Combination check state (for disabling button if already generated)
  const [combinationExists, setCombinationExists] = useState(false);
  const [checkingCombination, setCheckingCombination] = useState(false);
  const [isCached, setIsCached] = useState(false);

  // Generate projects function
  const handleGenerateProjects = useCallback(async () => {
    if (!projectTech || !projectDomain) {
      toast.error("Please select both technology and domain");
      return;
    }

    setProjectsLoading(true);
    setGeneratedProjects([]);

    try {
      const response = await fetch("/api/projects/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          technology: projectTech,
          domain: projectDomain,
          count: 5,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate projects");
      }

      setGeneratedProjects(data.projects);
      setIsCached(data.cached || false);

      if (data.cached) {
        toast.success("Loaded cached projects from database");
        setCombinationExists(true);
      } else {
        toast.success("Projects generated and saved successfully!");
        setCombinationExists(true); // Now it exists after generation
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong";
      toast.error(message);
    } finally {
      setProjectsLoading(false);
    }
  }, [projectTech, projectDomain]);

  // Check if combination exists in database when tech or domain changes
  useEffect(() => {
    const checkCombination = async () => {
      if (!projectTech || !projectDomain) {
        setCombinationExists(false);
        setGeneratedProjects([]);
        setIsCached(false);
        return;
      }

      setCheckingCombination(true);

      try {
        const res = await fetch(
          `/api/projects/generate?technology=${encodeURIComponent(projectTech)}&domain=${encodeURIComponent(projectDomain)}`
        );
        const data = await res.json();
        setCombinationExists(data.exists);

        // If combination exists in DB, auto-fetch the cached projects
        if (data.exists) {
          handleGenerateProjects();
        } else {
          // Clear projects when selecting a new combination
          setGeneratedProjects([]);
          setIsCached(false);
        }
      } catch (error) {
        console.error("Error checking combination:", error);
        setCombinationExists(false);
      } finally {
        setCheckingCombination(false);
      }
    };

    checkCombination();
  }, [projectTech, projectDomain, handleGenerateProjects]);

  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500/10">
            <FolderKanban className="h-5 w-5 text-orange-500" />
          </div>
          <h1 className="text-3xl font-bold text-white">Projects</h1>
        </div>
        <p className="text-slate-400">
          Generate 5 AI-powered project ideas with detailed explanations. Each project includes tech stack, workflow diagrams, database schemas, API endpoints, and implementation guides.
        </p>
      </div>

      <div className="space-y-6">
        {/* Technology & Domain Selection */}
        <Card className="border-slate-700 bg-slate-800/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <FolderKanban className="h-5 w-5 text-orange-400" />
              Generate Project Ideas
            </CardTitle>
            <CardDescription className="text-slate-400">
              Select a technology and domain to generate AI-powered project specifications with full implementation details.
              <span className="block mt-1 text-xs text-slate-500">
                Projects are generated once per combination and saved permanently.
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              {/* Technology Dropdown */}
              <div className="grid gap-2">
                <Label className="text-slate-300">Technology / Course</Label>
                <Select value={projectTech} onValueChange={setProjectTech}>
                  <SelectTrigger className="border-slate-600 bg-slate-700 text-white">
                    <SelectValue placeholder="Select technology" />
                  </SelectTrigger>
                  <SelectContent className="border-slate-600 bg-slate-700 max-h-80">
                    {TECH_CATEGORIES.map((category) => (
                      <div key={category.id}>
                        <div className="px-2 py-1 text-xs text-slate-400 font-semibold mt-2 first:mt-0">
                          {category.icon} {category.name}
                        </div>
                        {TECH_STACK_DEEP_DIVE.filter((t) => t.category === category.id).map((tech) => (
                          <SelectItem
                            key={tech.id}
                            value={tech.name}
                            className="text-white hover:bg-slate-600"
                          >
                            {tech.icon} {tech.name}
                          </SelectItem>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Domain Dropdown */}
              <div className="grid gap-2">
                <Label className="text-slate-300">Domain / Industry</Label>
                <Select value={projectDomain} onValueChange={setProjectDomain}>
                  <SelectTrigger className="border-slate-600 bg-slate-700 text-white">
                    <SelectValue placeholder="Select domain" />
                  </SelectTrigger>
                  <SelectContent className="border-slate-600 bg-slate-700">
                    {PROJECT_DOMAINS.map((domain) => (
                      <SelectItem
                        key={domain.id}
                        value={domain.id}
                        className="text-white hover:bg-slate-600"
                      >
                        <span className="flex items-center gap-2">
                          <span>{domain.icon}</span>
                          <span>{domain.name}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Selected info badges */}
            {(projectTech || projectDomain) && (
              <div className="flex flex-wrap gap-2 mt-4">
                {projectTech && (
                  <Badge className="bg-orange-500/20 text-orange-300 border border-orange-500/30">
                    {projectTech}
                  </Badge>
                )}
                {projectDomain && (
                  <Badge className="bg-orange-500/20 text-orange-300 border border-orange-500/30">
                    {PROJECT_DOMAINS.find((d) => d.id === projectDomain)?.name || projectDomain}
                  </Badge>
                )}
                {combinationExists && !projectsLoading && (
                  <Badge className="bg-green-500/20 text-green-300 border border-green-500/30">
                    <Database className="h-3 w-3 mr-1" />
                    Saved in Database
                  </Badge>
                )}
              </div>
            )}

            {/* Generate Button - Disabled if combination already exists */}
            <Button
              className={`mt-6 w-full ${
                combinationExists && !projectsLoading
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-orange-600 hover:bg-orange-700"
              }`}
              onClick={handleGenerateProjects}
              disabled={!projectTech || !projectDomain || projectsLoading || checkingCombination || (combinationExists && generatedProjects.length > 0)}
            >
              {projectsLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isCached ? "Loading Cached Projects..." : "Generating Projects..."}
                </>
              ) : checkingCombination ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : combinationExists && generatedProjects.length > 0 ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Already Generated
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Project Ideas
                </>
              )}
            </Button>

            {/* Info message for already generated combinations */}
            {combinationExists && generatedProjects.length > 0 && !projectsLoading && (
              <p className="text-xs text-slate-500 mt-2 text-center">
                This combination has already been generated. Select a different technology or domain to generate new projects.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Loading State */}
        {projectsLoading && (
          <Card className="border-slate-700 bg-slate-800/50">
            <CardContent className="py-12 text-center">
              <Loader2 className="h-12 w-12 animate-spin text-orange-500 mx-auto" />
              <p className="text-slate-300 mt-4 font-medium">
                {isCached ? "Loading cached projects..." : "Generating 5 project specifications with detailed explanations..."}
              </p>
              <p className="text-slate-500 text-sm mt-2">
                {isCached ? "Loading from database..." : "This may take 30-60 seconds. Each project includes 100+ lines of explanation."}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!projectsLoading && generatedProjects.length === 0 && (
          <Card className="border-slate-700 bg-slate-800/50">
            <CardContent className="py-12 text-center">
              <FolderKanban className="h-12 w-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Generate Your First Project</h3>
              <p className="text-slate-400 max-w-md mx-auto">
                Select a technology and domain above, then click &quot;Generate Project Ideas&quot; to get AI-powered project specifications with detailed explanations.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Project Cards - NO REGENERATE BUTTON */}
        {!projectsLoading && generatedProjects.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Generated Projects for {projectTech} in {PROJECT_DOMAINS.find((d) => d.id === projectDomain)?.name}
                </h3>
                <p className="text-sm text-slate-500">
                  {generatedProjects.length} projects with detailed explanations
                </p>
              </div>
              {isCached && (
                <Badge className="bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  <Database className="h-3 w-3 mr-1" />
                  From Database
                </Badge>
              )}
            </div>

            {generatedProjects.map((project, index) => (
              <ProjectCard key={project.id} project={project} index={index} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
