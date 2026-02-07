"use client";

import { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChevronDown,
  ChevronUp,
  Database,
  Server,
  Clock,
  Layers,
  Code2,
  Wrench,
  CheckCircle2,
  Circle,
  BookOpen,
  Target,
  Briefcase,
  GitBranch,
  Shield,
  Lightbulb,
  ExternalLink,
  Workflow,
  Network,
  Users,
  FileCode,
  Rocket,
  Building2,
  Zap,
  Lock,
  Scale,
  Puzzle,
  HelpCircle,
  Globe,
  FileJson,
  BarChart3,
  LineChart,
  Award,
  MessageSquare,
  Image as ImageIcon,
} from "lucide-react";
import {
  ProjectSpecification,
  TechStackItem,
  WorkflowDiagram,
  DomainCovered,
  DataFlowStep,
  KPICategory,
  DashboardSpec,
} from "@/types/project";

interface ProjectCardProps {
  project: ProjectSpecification;
  index: number;
}

// Mermaid Diagram Component - Prioritizes Image URL
function MermaidDiagram({ diagram }: { diagram: WorkflowDiagram }) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Clean mermaid code for fallback display
  const cleanMermaidCode = diagram.mermaidCode
    ?.replace(/\\n/g, "\n")
    .replace(/\\"/g, '"')
    .trim() || "";

  // Priority 1: Use mermaid.ink image URL if available
  if (diagram.imageUrl && !imageError) {
    return (
      <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
        <img
          src={diagram.imageUrl}
          alt={diagram.title}
          className="max-w-full h-auto bg-white rounded"
          onError={() => setImageError(true)}
          onLoad={() => setImageLoaded(true)}
        />
        {!imageLoaded && (
          <div className="text-slate-500 text-sm mt-2">Loading image...</div>
        )}
      </div>
    );
  }

  // Priority 2: Show mermaid code as fallback
  if (cleanMermaidCode) {
    return (
      <div className="bg-slate-900 rounded-lg p-4">
        <div className="text-slate-400 text-sm mb-2">Diagram Code:</div>
        <pre className="text-xs text-slate-300 overflow-x-auto whitespace-pre-wrap bg-slate-800 p-3 rounded font-mono">
          {cleanMermaidCode}
        </pre>
      </div>
    );
  }

  // No diagram available
  return (
    <div className="bg-slate-900 rounded-lg p-4 text-center">
      <div className="text-slate-500 text-sm">No diagram available</div>
    </div>
  );
}

// Tech Stack Item Component
function TechStackItemCard({ item }: { item: TechStackItem }) {
  const [showDetails, setShowDetails] = useState(false);

  const categoryColors: Record<string, string> = {
    "Core Language": "bg-purple-500/20 text-purple-400 border-purple-500/30",
    Framework: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    Runtime: "bg-green-500/20 text-green-400 border-green-500/30",
    Database: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    Cache: "bg-red-500/20 text-red-400 border-red-500/30",
    DevOps: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    Testing: "bg-pink-500/20 text-pink-400 border-pink-500/30",
    Security: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    "State Management": "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
    Containerization: "bg-teal-500/20 text-teal-400 border-teal-500/30",
    Tools: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  };

  return (
    <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700 hover:border-orange-500/30 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-white font-medium">{item.name}</span>
            <Badge
              variant="outline"
              className={`text-xs ${categoryColors[item.category] || categoryColors.Tools}`}
            >
              {item.category}
            </Badge>
          </div>
          <p className="text-slate-400 text-sm mt-1">{item.reason}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowDetails(!showDetails)}
          className="text-slate-400 hover:text-white shrink-0"
        >
          {showDetails ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </div>

      {showDetails && (
        <div className="mt-3 pt-3 border-t border-slate-700 space-y-2">
          {item.alternatives && item.alternatives.length > 0 && (
            <div>
              <span className="text-xs text-slate-500 uppercase tracking-wide">
                Alternatives:
              </span>
              <div className="flex flex-wrap gap-1 mt-1">
                {item.alternatives.map((alt, i) => (
                  <Badge
                    key={i}
                    variant="secondary"
                    className="bg-slate-700/50 text-slate-300 text-xs"
                  >
                    {alt}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {item.learningResources && item.learningResources.length > 0 && (
            <div>
              <span className="text-xs text-slate-500 uppercase tracking-wide">
                Learn:
              </span>
              <div className="flex flex-wrap gap-2 mt-1">
                {item.learningResources.map((resource, i) => (
                  <a
                    key={i}
                    href={resource.startsWith("http") ? resource : `https://${resource}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1"
                  >
                    {resource}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ProjectCard({ project, index }: ProjectCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState("explanation");

  const difficultyConfig = {
    beginner: {
      color: "bg-green-500/20 text-green-400 border-green-500/30",
      label: "Beginner",
    },
    intermediate: {
      color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      label: "Intermediate",
    },
    advanced: {
      color: "bg-red-500/20 text-red-400 border-red-500/30",
      label: "Advanced",
    },
  };

  const methodColors: Record<string, string> = {
    GET: "bg-blue-500/20 text-blue-400",
    POST: "bg-green-500/20 text-green-400",
    PUT: "bg-yellow-500/20 text-yellow-400",
    DELETE: "bg-red-500/20 text-red-400",
    PATCH: "bg-purple-500/20 text-purple-400",
  };

  const diagramTypeIcons: Record<string, React.ReactNode> = {
    architecture: <Network className="h-4 w-4" />,
    dataflow: <Workflow className="h-4 w-4" />,
    sequence: <Users className="h-4 w-4" />,
    userjourney: <Users className="h-4 w-4" />,
    deployment: <Rocket className="h-4 w-4" />,
  };

  // Count tech stack items
  const techStackCount = Object.values(project.techStack || {}).reduce(
    (acc, items) => acc + (items?.length || 0),
    0
  );

  // Check if using new explanation structure (has businessProblem) or old (has overview)
  const explanation = project.projectExplanation;
  const isNewStructure = explanation && "businessProblem" in explanation;

  return (
    <Card className="border-slate-700 bg-slate-800/50 hover:border-orange-500/50 transition-colors">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="text-white flex items-center gap-2 flex-wrap">
              <span className="text-orange-400 font-bold">
                Project {index + 1}:
              </span>
              <span>{project.title}</span>
            </CardTitle>
            <CardDescription className="text-slate-400 mt-2 text-sm leading-relaxed">
              {project.description}
            </CardDescription>
          </div>
          <Badge
            className={`${difficultyConfig[project.difficulty].color} border shrink-0`}
          >
            {difficultyConfig[project.difficulty].label}
          </Badge>
        </div>

        <div className="flex items-center gap-4 mt-4 text-sm text-slate-400 flex-wrap">
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4 text-orange-400" />
            {project.estimatedDays} days
          </span>
          <span className="flex items-center gap-1">
            <Code2 className="h-4 w-4 text-orange-400" />
            {techStackCount} technologies
          </span>
          <span className="flex items-center gap-1">
            <Layers className="h-4 w-4 text-orange-400" />
            {project.features?.length || 0} features
          </span>
          <span className="flex items-center gap-1">
            <Database className="h-4 w-4 text-orange-400" />
            {project.databaseSchema?.length || 0} tables
          </span>
          <span className="flex items-center gap-1">
            <Server className="h-4 w-4 text-orange-400" />
            {project.apiEndpoints?.length || 0} endpoints
          </span>
          {project.workflowDiagrams && project.workflowDiagrams.length > 0 && (
            <span className="flex items-center gap-1">
              <GitBranch className="h-4 w-4 text-orange-400" />
              {project.workflowDiagrams.length} diagrams
            </span>
          )}
        </div>

        {/* Industry Relevance Banner */}
        {project.industryRelevance && (
          <div className="mt-4 bg-gradient-to-r from-orange-500/10 to-yellow-500/10 border border-orange-500/20 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Briefcase className="h-4 w-4 text-orange-400 mt-0.5 shrink-0" />
              <p className="text-sm text-slate-300">{project.industryRelevance}</p>
            </div>
          </div>
        )}

        {/* Interview Summary (New Structure) - Highlighted at top */}
        {isNewStructure && (explanation as unknown as { interviewSummary?: string }).interviewSummary && (
          <div className="mt-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <MessageSquare className="h-4 w-4 text-green-400 mt-0.5 shrink-0" />
              <div>
                <span className="text-xs text-green-400 font-semibold uppercase">Interview-Ready Summary</span>
                <p className="text-sm text-slate-300 mt-1">{(explanation as unknown as { interviewSummary: string }).interviewSummary}</p>
              </div>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent>
        <Button
          variant="outline"
          onClick={() => setExpanded(!expanded)}
          className="w-full border-orange-500/50 text-orange-400 hover:bg-orange-500/10 hover:text-orange-300"
        >
          {expanded ? (
            <>
              <ChevronUp className="h-4 w-4 mr-2" />
              Hide Details
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-2" />
              View Full Specification (100+ Lines)
            </>
          )}
        </Button>

        {expanded && (
          <div className="mt-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-slate-900/50 p-1">
                <TabsTrigger value="explanation" className="flex-1 min-w-[100px] text-xs">
                  <BookOpen className="h-3 w-3 mr-1" />
                  Explanation
                </TabsTrigger>
                <TabsTrigger value="techstack" className="flex-1 min-w-[100px] text-xs">
                  <Code2 className="h-3 w-3 mr-1" />
                  Tech Stack
                </TabsTrigger>
                <TabsTrigger value="diagrams" className="flex-1 min-w-[100px] text-xs">
                  <GitBranch className="h-3 w-3 mr-1" />
                  Diagrams
                </TabsTrigger>
                <TabsTrigger value="features" className="flex-1 min-w-[100px] text-xs">
                  <Layers className="h-3 w-3 mr-1" />
                  Features
                </TabsTrigger>
                <TabsTrigger value="database" className="flex-1 min-w-[100px] text-xs">
                  <Database className="h-3 w-3 mr-1" />
                  Database
                </TabsTrigger>
                <TabsTrigger value="api" className="flex-1 min-w-[100px] text-xs">
                  <Server className="h-3 w-3 mr-1" />
                  API
                </TabsTrigger>
                <TabsTrigger value="guide" className="flex-1 min-w-[100px] text-xs">
                  <Wrench className="h-3 w-3 mr-1" />
                  Guide
                </TabsTrigger>
              </TabsList>

              {/* Project Explanation Tab - NEW 12 SECTION STRUCTURE */}
              <TabsContent value="explanation" className="mt-4 space-y-4">
                {/* Learning Outcomes */}
                {project.learningOutcomes && project.learningOutcomes.length > 0 && (
                  <div className="bg-slate-900/50 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-orange-300 mb-3 flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      What You&apos;ll Learn ({project.learningOutcomes.length} skills)
                    </h4>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {project.learningOutcomes.map((outcome, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-green-400 mt-0.5 shrink-0" />
                          <span className="text-slate-300">{outcome}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Prerequisites */}
                {project.prerequisites && project.prerequisites.length > 0 && (
                  <div className="bg-slate-900/50 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-orange-300 mb-3 flex items-center gap-2">
                      <FileCode className="h-4 w-4" />
                      Prerequisites
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {project.prerequisites.map((prereq, i) => (
                        <Badge
                          key={i}
                          variant="secondary"
                          className="bg-slate-700/50 text-slate-300 text-xs"
                        >
                          {prereq}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* NEW STRUCTURE - Detailed Project Explanation */}
                {isNewStructure && explanation && (
                  <div className="space-y-4">
                    {/* Detailed Overview - Main Project Description */}
                    {(explanation as unknown as { detailedOverview?: string }).detailedOverview && (
                      <div className="bg-gradient-to-r from-orange-500/10 to-slate-900/50 rounded-lg p-5 border border-orange-500/20">
                        <h4 className="text-base font-semibold text-orange-300 mb-3 flex items-center gap-2">
                          <FileCode className="h-5 w-5" />
                          Project Overview
                        </h4>
                        <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-line">
                          {(explanation as unknown as { detailedOverview: string }).detailedOverview}
                        </p>
                      </div>
                    )}

                    {/* Key Objectives */}
                    {(explanation as unknown as { keyObjectives?: string[] }).keyObjectives &&
                      (explanation as unknown as { keyObjectives: string[] }).keyObjectives.length > 0 && (
                        <div className="bg-slate-900/50 rounded-lg p-4">
                          <h4 className="text-sm font-semibold text-orange-300 mb-3 flex items-center gap-2">
                            <Target className="h-4 w-4" />
                            Key Objectives
                          </h4>
                          <div className="space-y-2">
                            {(explanation as unknown as { keyObjectives: string[] }).keyObjectives.map((obj, i) => (
                              <div key={i} className="flex items-start gap-3 text-sm">
                                <span className="bg-orange-500/20 text-orange-300 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0">
                                  {i + 1}
                                </span>
                                <span className="text-slate-300">{obj}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* Target Audience */}
                    {(explanation as unknown as { targetAudience?: string }).targetAudience && (
                      <div className="bg-slate-900/50 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-orange-300 mb-3 flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Target Audience
                        </h4>
                        <p className="text-slate-300 text-sm leading-relaxed">
                          {(explanation as unknown as { targetAudience: string }).targetAudience}
                        </p>
                      </div>
                    )}

                    {/* Real World Applications */}
                    {(explanation as unknown as { realWorldApplications?: string[] }).realWorldApplications &&
                      (explanation as unknown as { realWorldApplications: string[] }).realWorldApplications.length > 0 && (
                        <div className="bg-slate-900/50 rounded-lg p-4">
                          <h4 className="text-sm font-semibold text-orange-300 mb-3 flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            Real World Applications
                          </h4>
                          <div className="grid gap-2 sm:grid-cols-1">
                            {(explanation as unknown as { realWorldApplications: string[] }).realWorldApplications.map((app, i) => (
                              <div key={i} className="flex items-start gap-2 text-sm bg-slate-800/50 rounded-lg p-3">
                                <Briefcase className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
                                <span className="text-slate-300">{app}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* Business Problem */}
                    {(explanation as unknown as { businessProblem?: string }).businessProblem && (
                      <div className="bg-slate-900/50 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-orange-300 mb-3 flex items-center gap-2">
                          <Lightbulb className="h-4 w-4" />
                          Business Problem
                        </h4>
                        <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">
                          {(explanation as unknown as { businessProblem: string }).businessProblem}
                        </p>
                      </div>
                    )}

                    {/* Business Questions */}
                    {(explanation as unknown as { businessQuestions?: string[] }).businessQuestions &&
                      (explanation as unknown as { businessQuestions: string[] }).businessQuestions.length > 0 && (
                        <div className="bg-slate-900/50 rounded-lg p-4">
                          <h4 className="text-sm font-semibold text-orange-300 mb-3 flex items-center gap-2">
                            <HelpCircle className="h-4 w-4" />
                            Business Questions This System Answers
                          </h4>
                          <div className="space-y-2">
                            {(explanation as unknown as { businessQuestions: string[] }).businessQuestions.map((q, i) => (
                              <div key={i} className="flex items-start gap-2 text-sm">
                                <span className="text-orange-400 font-mono shrink-0">Q{i + 1}.</span>
                                <span className="text-slate-300">{q}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* Section 3: Domains Covered */}
                    {(explanation as unknown as { domainsCovered?: DomainCovered[] }).domainsCovered &&
                      (explanation as unknown as { domainsCovered: DomainCovered[] }).domainsCovered.length > 0 && (
                        <div className="bg-slate-900/50 rounded-lg p-4">
                          <h4 className="text-sm font-semibold text-orange-300 mb-3 flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            Domains Covered
                          </h4>
                          <div className="grid gap-3 sm:grid-cols-2">
                            {(explanation as unknown as { domainsCovered: DomainCovered[] }).domainsCovered.map((d, i) => (
                              <div key={i} className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                                <span className="text-white font-medium text-sm">{d.domain}</span>
                                <p className="text-slate-400 text-xs mt-1">{d.description}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* Section 4: Data Sources */}
                    {(explanation as unknown as { dataSources?: { systems?: string[]; dataFormats?: string[] } }).dataSources && (
                      <div className="bg-slate-900/50 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-orange-300 mb-3 flex items-center gap-2">
                          <FileJson className="h-4 w-4" />
                          Data Sources
                        </h4>
                        <div className="grid gap-4 sm:grid-cols-2">
                          {(explanation as unknown as { dataSources: { systems?: string[] } }).dataSources.systems &&
                            (explanation as unknown as { dataSources: { systems: string[] } }).dataSources.systems.length > 0 && (
                              <div>
                                <span className="text-xs text-slate-500 uppercase tracking-wide">Source Systems</span>
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {(explanation as unknown as { dataSources: { systems: string[] } }).dataSources.systems.map((s, i) => (
                                    <Badge key={i} variant="secondary" className="bg-blue-500/20 text-blue-300 text-xs">
                                      {s}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          {(explanation as unknown as { dataSources: { dataFormats?: string[] } }).dataSources.dataFormats &&
                            (explanation as unknown as { dataSources: { dataFormats: string[] } }).dataSources.dataFormats.length > 0 && (
                              <div>
                                <span className="text-xs text-slate-500 uppercase tracking-wide">Data Formats</span>
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {(explanation as unknown as { dataSources: { dataFormats: string[] } }).dataSources.dataFormats.map((f, i) => (
                                    <Badge key={i} variant="secondary" className="bg-green-500/20 text-green-300 text-xs">
                                      {f}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                        </div>
                      </div>
                    )}

                    {/* Section 5: Architecture Layers */}
                    {(explanation as unknown as { architectureLayers?: string[] }).architectureLayers &&
                      (explanation as unknown as { architectureLayers: string[] }).architectureLayers.length > 0 && (
                        <div className="bg-slate-900/50 rounded-lg p-4">
                          <h4 className="text-sm font-semibold text-orange-300 mb-3 flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            Architecture Layers
                          </h4>
                          <div className="flex flex-wrap items-center gap-2">
                            {(explanation as unknown as { architectureLayers: string[] }).architectureLayers.map((layer, i) => (
                              <div key={i} className="flex items-center">
                                <Badge className="bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                  {layer}
                                </Badge>
                                {i < (explanation as unknown as { architectureLayers: string[] }).architectureLayers.length - 1 && (
                                  <span className="text-slate-500 mx-2">→</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* Section 6: Technology Stack by Category */}
                    {(explanation as unknown as { technologyStack?: { category: string; technologies: string[] }[] }).technologyStack &&
                      (explanation as unknown as { technologyStack: { category: string; technologies: string[] }[] }).technologyStack.length > 0 && (
                        <div className="bg-slate-900/50 rounded-lg p-4">
                          <h4 className="text-sm font-semibold text-orange-300 mb-3 flex items-center gap-2">
                            <Code2 className="h-4 w-4" />
                            Technology Stack by Category
                          </h4>
                          <div className="grid gap-3 sm:grid-cols-2">
                            {(explanation as unknown as { technologyStack: { category: string; technologies: string[] }[] }).technologyStack.map((cat, i) => (
                              <div key={i} className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                                <span className="text-white font-medium text-sm">{cat.category}</span>
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {cat.technologies.map((tech, j) => (
                                    <Badge key={j} variant="outline" className="text-xs text-slate-300 border-slate-600">
                                      {tech}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* Section 7: Data Flow Steps */}
                    {(explanation as unknown as { dataFlow?: DataFlowStep[] }).dataFlow &&
                      (explanation as unknown as { dataFlow: DataFlowStep[] }).dataFlow.length > 0 && (
                        <div className="bg-slate-900/50 rounded-lg p-4">
                          <h4 className="text-sm font-semibold text-orange-300 mb-3 flex items-center gap-2">
                            <Workflow className="h-4 w-4" />
                            Step-by-Step Data Flow
                          </h4>
                          <div className="space-y-4">
                            {(explanation as unknown as { dataFlow: DataFlowStep[] }).dataFlow.map((step) => (
                              <div key={step.step} className="relative pl-8 border-l-2 border-orange-500/30">
                                <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-orange-500/20 border-2 border-orange-500" />
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-orange-400 font-bold text-sm">Step {step.step}:</span>
                                    <span className="text-white font-medium text-sm">{step.title}</span>
                                  </div>
                                  <p className="text-slate-400 text-sm mt-1">{step.description}</p>
                                  {step.details && step.details.length > 0 && (
                                    <ul className="mt-2 space-y-1">
                                      {step.details.map((detail, i) => (
                                        <li key={i} className="text-xs text-slate-400 flex items-start gap-2">
                                          <span className="text-orange-400">•</span>
                                          {detail}
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                  {step.outputExample && (
                                    <div className="mt-2 bg-slate-800/50 rounded p-2">
                                      <span className="text-xs text-slate-500">Output: </span>
                                      <code className="text-xs text-green-300">{step.outputExample}</code>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* Section 8: KPIs */}
                    {(explanation as unknown as { kpis?: KPICategory[] }).kpis &&
                      (explanation as unknown as { kpis: KPICategory[] }).kpis.length > 0 && (
                        <div className="bg-slate-900/50 rounded-lg p-4">
                          <h4 className="text-sm font-semibold text-orange-300 mb-3 flex items-center gap-2">
                            <BarChart3 className="h-4 w-4" />
                            Key Metrics & KPIs
                          </h4>
                          <div className="grid gap-3 sm:grid-cols-3">
                            {(explanation as unknown as { kpis: KPICategory[] }).kpis.map((kpi, i) => (
                              <div key={i} className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                                <span className="text-white font-medium text-sm">{kpi.category}</span>
                                <div className="mt-2 space-y-1">
                                  {kpi.metrics.map((metric, j) => (
                                    <div key={j} className="text-xs text-slate-400 flex items-center gap-2">
                                      <LineChart className="h-3 w-3 text-orange-400" />
                                      {metric}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* Section 9: Dashboards */}
                    {(explanation as unknown as { dashboards?: DashboardSpec[] }).dashboards &&
                      (explanation as unknown as { dashboards: DashboardSpec[] }).dashboards.length > 0 && (
                        <div className="bg-slate-900/50 rounded-lg p-4">
                          <h4 className="text-sm font-semibold text-orange-300 mb-3 flex items-center gap-2">
                            <ImageIcon className="h-4 w-4" />
                            Dashboards
                          </h4>
                          <div className="grid gap-3 sm:grid-cols-2">
                            {(explanation as unknown as { dashboards: DashboardSpec[] }).dashboards.map((dash, i) => (
                              <div key={i} className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                                <span className="text-white font-medium text-sm">{dash.name}</span>
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {dash.metrics.map((metric, j) => (
                                    <Badge key={j} variant="outline" className="text-xs text-slate-400 border-slate-600">
                                      {metric}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* Section 10: Security & Compliance */}
                    {(explanation as unknown as { securityCompliance?: { regulations?: string[]; accessControl?: string[]; dataProtection?: string[] } }).securityCompliance && (
                      <div className="bg-slate-900/50 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-orange-300 mb-3 flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Security & Compliance
                        </h4>
                        <div className="grid gap-4 sm:grid-cols-3">
                          {(explanation as unknown as { securityCompliance: { regulations?: string[] } }).securityCompliance.regulations &&
                            (explanation as unknown as { securityCompliance: { regulations: string[] } }).securityCompliance.regulations.length > 0 && (
                              <div>
                                <span className="text-xs text-slate-500 uppercase tracking-wide">Regulations</span>
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {(explanation as unknown as { securityCompliance: { regulations: string[] } }).securityCompliance.regulations.map((r, i) => (
                                    <Badge key={i} className="bg-red-500/20 text-red-300 border border-red-500/30 text-xs">
                                      {r}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          {(explanation as unknown as { securityCompliance: { accessControl?: string[] } }).securityCompliance.accessControl &&
                            (explanation as unknown as { securityCompliance: { accessControl: string[] } }).securityCompliance.accessControl.length > 0 && (
                              <div>
                                <span className="text-xs text-slate-500 uppercase tracking-wide">Access Control</span>
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {(explanation as unknown as { securityCompliance: { accessControl: string[] } }).securityCompliance.accessControl.map((a, i) => (
                                    <Badge key={i} className="bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 text-xs">
                                      {a}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          {(explanation as unknown as { securityCompliance: { dataProtection?: string[] } }).securityCompliance.dataProtection &&
                            (explanation as unknown as { securityCompliance: { dataProtection: string[] } }).securityCompliance.dataProtection.length > 0 && (
                              <div>
                                <span className="text-xs text-slate-500 uppercase tracking-wide">Data Protection</span>
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {(explanation as unknown as { securityCompliance: { dataProtection: string[] } }).securityCompliance.dataProtection.map((d, i) => (
                                    <Badge key={i} className="bg-green-500/20 text-green-300 border border-green-500/30 text-xs">
                                      {d}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                        </div>
                      </div>
                    )}

                    {/* Section 11: Business Impact */}
                    {(explanation as unknown as { businessImpact?: string[] }).businessImpact &&
                      (explanation as unknown as { businessImpact: string[] }).businessImpact.length > 0 && (
                        <div className="bg-slate-900/50 rounded-lg p-4">
                          <h4 className="text-sm font-semibold text-orange-300 mb-3 flex items-center gap-2">
                            <Award className="h-4 w-4" />
                            Business Impact
                          </h4>
                          <div className="grid gap-2 sm:grid-cols-2">
                            {(explanation as unknown as { businessImpact: string[] }).businessImpact.map((impact, i) => (
                              <div key={i} className="flex items-start gap-2 text-sm bg-green-500/10 rounded-lg p-2 border border-green-500/20">
                                <CheckCircle2 className="h-4 w-4 text-green-400 mt-0.5 shrink-0" />
                                <span className="text-slate-300">{impact}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                )}

                {/* OLD STRUCTURE - Backward Compatibility */}
                {!isNewStructure && explanation && (
                  <div className="space-y-4">
                    {/* Overview */}
                    {(explanation as unknown as { overview?: string }).overview && (
                      <div className="bg-slate-900/50 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-orange-300 mb-3 flex items-center gap-2">
                          <Rocket className="h-4 w-4" />
                          Project Overview
                        </h4>
                        <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">
                          {(explanation as unknown as { overview: string }).overview}
                        </p>
                      </div>
                    )}

                    {/* Problem Statement */}
                    {(explanation as unknown as { problemStatement?: string }).problemStatement && (
                      <div className="bg-slate-900/50 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-orange-300 mb-3 flex items-center gap-2">
                          <Lightbulb className="h-4 w-4" />
                          Problem Statement
                        </h4>
                        <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">
                          {(explanation as unknown as { problemStatement: string }).problemStatement}
                        </p>
                      </div>
                    )}

                    {/* Solution Approach */}
                    {(explanation as unknown as { solutionApproach?: string }).solutionApproach && (
                      <div className="bg-slate-900/50 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-orange-300 mb-3 flex items-center gap-2">
                          <Zap className="h-4 w-4" />
                          Solution Approach
                        </h4>
                        <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">
                          {(explanation as unknown as { solutionApproach: string }).solutionApproach}
                        </p>
                      </div>
                    )}

                    {/* Architecture Overview */}
                    {(explanation as unknown as { architectureOverview?: string }).architectureOverview && (
                      <div className="bg-slate-900/50 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-orange-300 mb-3 flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          Architecture Overview
                        </h4>
                        <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">
                          {(explanation as unknown as { architectureOverview: string }).architectureOverview}
                        </p>
                      </div>
                    )}

                    {/* Key Components */}
                    {(explanation as unknown as { keyComponents?: string[] }).keyComponents &&
                      (explanation as unknown as { keyComponents: string[] }).keyComponents.length > 0 && (
                        <div className="bg-slate-900/50 rounded-lg p-4">
                          <h4 className="text-sm font-semibold text-orange-300 mb-3 flex items-center gap-2">
                            <Puzzle className="h-4 w-4" />
                            Key Components
                          </h4>
                          <div className="space-y-2">
                            {(explanation as unknown as { keyComponents: string[] }).keyComponents.map((component, i) => (
                              <div key={i} className="flex items-start gap-2 text-sm">
                                <span className="text-orange-400 font-mono shrink-0">
                                  {i + 1}.
                                </span>
                                <span className="text-slate-300">{component}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* Integration Points */}
                    {(explanation as unknown as { integrationPoints?: string }).integrationPoints && (
                      <div className="bg-slate-900/50 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-orange-300 mb-3 flex items-center gap-2">
                          <Network className="h-4 w-4" />
                          Integration Points
                        </h4>
                        <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">
                          {(explanation as unknown as { integrationPoints: string }).integrationPoints}
                        </p>
                      </div>
                    )}

                    {/* Scalability */}
                    {(explanation as unknown as { scalabilityConsiderations?: string }).scalabilityConsiderations && (
                      <div className="bg-slate-900/50 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-orange-300 mb-3 flex items-center gap-2">
                          <Scale className="h-4 w-4" />
                          Scalability Considerations
                        </h4>
                        <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">
                          {(explanation as unknown as { scalabilityConsiderations: string }).scalabilityConsiderations}
                        </p>
                      </div>
                    )}

                    {/* Security */}
                    {(explanation as unknown as { securityMeasures?: string }).securityMeasures && (
                      <div className="bg-slate-900/50 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-orange-300 mb-3 flex items-center gap-2">
                          <Lock className="h-4 w-4" />
                          Security Measures
                        </h4>
                        <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">
                          {(explanation as unknown as { securityMeasures: string }).securityMeasures}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>

              {/* Tech Stack Tab */}
              <TabsContent value="techstack" className="mt-4 space-y-4">
                {Object.entries(project.techStack || {}).map(([category, items]) => {
                  if (!items || items.length === 0) return null;

                  const categoryTitles: Record<string, string> = {
                    frontend: "Frontend",
                    backend: "Backend",
                    database: "Database & Cache",
                    devops: "DevOps & Infrastructure",
                    testing: "Testing",
                    security: "Security",
                    tools: "Tools & Utilities",
                  };

                  const categoryIcons: Record<string, React.ReactNode> = {
                    frontend: <Code2 className="h-4 w-4" />,
                    backend: <Server className="h-4 w-4" />,
                    database: <Database className="h-4 w-4" />,
                    devops: <Rocket className="h-4 w-4" />,
                    testing: <CheckCircle2 className="h-4 w-4" />,
                    security: <Shield className="h-4 w-4" />,
                    tools: <Wrench className="h-4 w-4" />,
                  };

                  return (
                    <div key={category} className="bg-slate-900/50 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-orange-300 mb-3 flex items-center gap-2">
                        {categoryIcons[category] || <Code2 className="h-4 w-4" />}
                        {categoryTitles[category] || category}
                      </h4>
                      <div className="space-y-3">
                        {items.map((item: TechStackItem, i: number) => (
                          <TechStackItemCard key={i} item={item} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </TabsContent>

              {/* Workflow Diagrams Tab */}
              <TabsContent value="diagrams" className="mt-4 space-y-4">
                {project.workflowDiagrams && project.workflowDiagrams.length > 0 ? (
                  project.workflowDiagrams.map((diagram, i) => (
                    <div key={i} className="bg-slate-900/50 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-orange-300 mb-2 flex items-center gap-2">
                        {diagramTypeIcons[diagram.type] || <GitBranch className="h-4 w-4" />}
                        {diagram.title}
                        <Badge variant="outline" className="text-xs text-slate-400 border-slate-600 ml-auto">
                          {diagram.type}
                        </Badge>
                      </h4>
                      <p className="text-slate-400 text-sm mb-4">{diagram.description}</p>
                      <MermaidDiagram diagram={diagram} />
                    </div>
                  ))
                ) : (
                  <div className="text-center text-slate-400 py-8">
                    No workflow diagrams available for this project.
                  </div>
                )}
              </TabsContent>

              {/* Features Tab */}
              <TabsContent value="features" className="mt-4">
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-orange-300 mb-3 flex items-center gap-2">
                    <Layers className="h-4 w-4" />
                    Key Features
                  </h4>
                  <div className="space-y-2">
                    {project.features?.map((feature, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        {feature.priority === "must-have" ? (
                          <CheckCircle2 className="h-4 w-4 text-green-400 mt-0.5 shrink-0" />
                        ) : (
                          <Circle className="h-4 w-4 text-slate-500 mt-0.5 shrink-0" />
                        )}
                        <div>
                          <span className="text-white font-medium">{feature.name}</span>
                          <span className="text-slate-400 ml-1">- {feature.description}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* Database Tab */}
              <TabsContent value="database" className="mt-4">
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-orange-300 mb-3 flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    Database Schema
                  </h4>
                  <div className="space-y-4">
                    {project.databaseSchema?.map((table, i) => (
                      <div key={i} className="border border-slate-700 rounded-lg overflow-hidden">
                        <div className="bg-slate-800 px-3 py-2 border-b border-slate-700">
                          <span className="text-white font-mono text-sm font-medium">
                            {table.name}
                          </span>
                          <span className="text-slate-500 text-xs ml-2">
                            {table.description}
                          </span>
                        </div>
                        <div className="p-3">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="text-slate-500 uppercase">
                                <th className="text-left pb-2">Column</th>
                                <th className="text-left pb-2">Type</th>
                                <th className="text-left pb-2">Constraints</th>
                              </tr>
                            </thead>
                            <tbody className="text-slate-300">
                              {table.columns.map((col, j) => (
                                <tr key={j} className="border-t border-slate-800">
                                  <td className="py-1 font-mono text-blue-300">
                                    {col.name}
                                  </td>
                                  <td className="py-1 font-mono text-green-300">
                                    {col.type}
                                  </td>
                                  <td className="py-1 text-slate-400">
                                    {(col.constraints || []).join(", ") || "-"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {table.relationships && table.relationships.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-slate-800">
                              <span className="text-slate-500 text-xs">
                                Relationships:{" "}
                              </span>
                              <span className="text-slate-400 text-xs">
                                {table.relationships.join(", ")}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* API Tab */}
              <TabsContent value="api" className="mt-4">
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-orange-300 mb-3 flex items-center gap-2">
                    <Server className="h-4 w-4" />
                    API Endpoints
                  </h4>
                  <div className="space-y-2">
                    {project.apiEndpoints?.map((endpoint, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 text-sm bg-slate-800/50 rounded px-3 py-2"
                      >
                        <Badge
                          className={`${methodColors[endpoint.method]} text-xs font-mono shrink-0`}
                        >
                          {endpoint.method}
                        </Badge>
                        <code className="text-blue-300 font-mono text-xs">
                          {endpoint.path}
                        </code>
                        <span className="text-slate-500 text-xs ml-auto hidden sm:inline">
                          {endpoint.description}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* Implementation Guide Tab */}
              <TabsContent value="guide" className="mt-4">
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-orange-300 mb-3 flex items-center gap-2">
                    <Wrench className="h-4 w-4" />
                    Implementation Guide
                  </h4>
                  <div className="space-y-4">
                    {project.implementationGuide?.map((step) => (
                      <div key={step.step} className="relative pl-8">
                        <div className="absolute left-0 top-0 w-6 h-6 rounded-full bg-orange-500/20 border border-orange-500/50 flex items-center justify-center">
                          <span className="text-orange-400 text-xs font-bold">
                            {step.step}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h5 className="text-white font-medium text-sm">
                              {step.title}
                            </h5>
                            <Badge
                              variant="outline"
                              className="text-xs text-slate-400 border-slate-600"
                            >
                              ~{step.estimatedHours}h
                            </Badge>
                          </div>
                          <p className="text-slate-400 text-sm mt-1">
                            {step.description}
                          </p>
                          {step.tips && step.tips.length > 0 && (
                            <div className="mt-2">
                              <span className="text-xs text-slate-500">Tips: </span>
                              <span className="text-xs text-slate-400">
                                {step.tips.join(" • ")}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
