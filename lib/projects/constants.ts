// AI Model Configuration
export const AI_CONFIG = {
  primaryModel: "llama-3.3-70b-versatile",
  fallbackModel: "llama-3.1-8b-instant",
  primaryMaxTokens: 30000,
  fallbackMaxTokens: 8000,
  temperature: 0.6,
} as const;

// Project Generation Defaults
export const PROJECT_DEFAULTS = {
  count: 5,
  features: { min: 6, max: 8 },
  tables: { min: 4, max: 6 },
  endpoints: { min: 8, max: 10 },
  implementationSteps: { min: 6, max: 8 },
} as const;

// Difficulty Distribution
export const DIFFICULTY_DISTRIBUTION = {
  beginner: 2,
  intermediate: 2,
  advanced: 1,
} as const;

// Difficulty Configuration
export const DIFFICULTY_CONFIG = {
  beginner: {
    color: "green",
    badgeClass: "bg-green-500/20 text-green-400 border-green-500/30",
    days: { min: 5, max: 10 },
  },
  intermediate: {
    color: "yellow",
    badgeClass: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    days: { min: 15, max: 25 },
  },
  advanced: {
    color: "red",
    badgeClass: "bg-red-500/20 text-red-400 border-red-500/30",
    days: { min: 30, max: 45 },
  },
} as const;

// HTTP Method Colors for API Display
export const HTTP_METHOD_COLORS = {
  GET: "bg-blue-500/20 text-blue-400",
  POST: "bg-green-500/20 text-green-400",
  PUT: "bg-yellow-500/20 text-yellow-400",
  DELETE: "bg-red-500/20 text-red-400",
  PATCH: "bg-purple-500/20 text-purple-400",
} as const;

// Tech Stack Category Colors
export const TECH_CATEGORY_COLORS: Record<string, string> = {
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

// Logging prefix
export const LOG_PREFIX = "[Projects]";
