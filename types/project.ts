// Project Types for AI-Generated Project Specifications

// ==================== TECH STACK TYPES ====================

export interface TechStackItem {
  name: string;
  category: "Core Language" | "Framework" | "Runtime" | "Database" | "Cache" | "DevOps" | "Testing" | "Security" | "State Management" | "Containerization" | "Tools";
  reason: string; // 2-3 sentences explaining why this tech for this domain
  alternatives?: string[];
  learningResources?: string[];
}

export interface EnhancedTechStack {
  frontend?: TechStackItem[];
  backend?: TechStackItem[];
  database?: TechStackItem[];
  devops?: TechStackItem[];
  testing?: TechStackItem[];
  security?: TechStackItem[];
  tools?: TechStackItem[];
}

// Legacy tech stack for backward compatibility
export interface ProjectTechStack {
  frontend?: string[];
  backend?: string[];
  database?: string[];
  tools?: string[];
}

// ==================== PROJECT EXPLANATION (100+ lines - Industry Standard) ====================

// Domain covered in project
export interface DomainCovered {
  domain: string;
  description: string;
}

// Data sources for the project
export interface DataSources {
  systems: string[];      // Source systems (EHR, CRM, ERP, etc.)
  dataFormats: string[];  // CSV, JSON, Parquet, XML, HL7/FHIR, etc.
}

// Technology stack by category
export interface TechnologyStackCategory {
  category: string;        // Cloud Platform, Ingestion, Storage, Processing, etc.
  technologies: string[];
}

// Step-by-step data flow
export interface DataFlowStep {
  step: number;
  title: string;
  description: string;
  details: string[];
  outputExample?: string;
}

// KPIs by category
export interface KPICategory {
  category: string;        // Clinical, Financial, Operational, etc.
  metrics: string[];
}

// Dashboard specification
export interface DashboardSpec {
  name: string;
  metrics: string[];
}

// Security and compliance
export interface SecurityCompliance {
  regulations: string[];     // HIPAA, PCI-DSS, GDPR, SOX, etc.
  accessControl: string[];   // RBAC, role separation, MFA, etc.
  dataProtection: string[];  // Encryption, masking, audit logs, etc.
}

// ENHANCED PROJECT EXPLANATION - 100+ LINES (Industry Standard Structure)
export interface ProjectExplanation {
  // Section 1: Business Problem (8-15 sentences)
  // Why this project exists, challenges organizations face, pain points
  businessProblem: string;

  // Section 2: Business Questions (5-8 questions the project answers)
  businessQuestions: string[];

  // Section 3: Domains Covered (4-6 domains with descriptions)
  domainsCovered: DomainCovered[];

  // Section 4: Data Sources
  dataSources: DataSources;

  // Section 5: Architecture Layers (5-6 layers)
  // Data Sources → Ingestion → Raw → Processed → Warehouse → BI
  architectureLayers: string[];

  // Section 6: Technology Stack by Category
  technologyStack: TechnologyStackCategory[];

  // Section 7: Step-by-Step Data Flow (5-6 detailed steps)
  dataFlow: DataFlowStep[];

  // Section 8: Key Metrics & KPIs (3 categories, 3-4 metrics each)
  kpis: KPICategory[];

  // Section 9: Dashboards (4 dashboards with their metrics)
  dashboards: DashboardSpec[];

  // Section 10: Security & Compliance
  securityCompliance: SecurityCompliance;

  // Section 11: Business Impact (5-6 measurable outcomes)
  businessImpact: string[];

  // Section 12: Interview-Ready Summary (3-4 sentences)
  // Concise pitch explaining the entire project
  interviewSummary: string;
}

// ==================== WORKFLOW DIAGRAMS ====================

export type WorkflowDiagramType = "architecture" | "dataflow" | "userjourney" | "sequence" | "deployment";

export interface WorkflowDiagram {
  title: string;
  type: WorkflowDiagramType;
  description: string;
  mermaidCode: string;
  imageUrl?: string; // Generated from mermaid.ink API
}

// ==================== PROJECT FEATURES ====================

export interface ProjectFeature {
  name: string;
  description: string;
  priority: "must-have" | "nice-to-have";
}

// ==================== DATABASE SCHEMA ====================

export interface DatabaseColumn {
  name: string;
  type: string;
  constraints: string[];
}

export interface DatabaseTable {
  name: string;
  description: string;
  columns: DatabaseColumn[];
  relationships?: string[];
}

// ==================== API ENDPOINTS ====================

export interface ApiEndpoint {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  path: string;
  description: string;
  requestBody?: string;
  responseExample?: string;
}

// ==================== IMPLEMENTATION GUIDE ====================

export interface ImplementationStep {
  step: number;
  title: string;
  description: string;
  estimatedHours: number;
  tips?: string[];
}

// ==================== MAIN PROJECT SPECIFICATION ====================

export type ProjectDifficulty = "beginner" | "intermediate" | "advanced";

export interface ProjectSpecification {
  id: string;
  title: string;
  description: string; // Brief 2-3 sentence overview for card display
  technology: string;
  domain: string;
  difficulty: ProjectDifficulty;
  estimatedDays: number;

  // NEW: 100+ line detailed explanation
  projectExplanation: ProjectExplanation;

  // NEW: Learning outcomes (8-12 skills)
  learningOutcomes: string[];

  // NEW: Prerequisites
  prerequisites: string[];

  // NEW: Industry relevance
  industryRelevance: string;

  // UPDATED: Enhanced tech stack with explanations
  techStack: EnhancedTechStack;

  // NEW: Multiple workflow diagrams
  workflowDiagrams: WorkflowDiagram[];

  // Existing fields
  features: ProjectFeature[];
  databaseSchema: DatabaseTable[];
  apiEndpoints: ApiEndpoint[];
  implementationGuide: ImplementationStep[];
  createdAt: string;
}

// ==================== API REQUEST/RESPONSE TYPES ====================

export interface GenerateProjectsRequest {
  technology: string;
  domain: string;
  count?: number;
}

export interface GenerateProjectsResponse {
  success: boolean;
  projects: ProjectSpecification[];
  cached?: boolean;
  cachedAt?: string;
  error?: string;
}

// Cache interface for localStorage
export interface CachedProjects {
  projects: ProjectSpecification[];
  timestamp: number;
}
