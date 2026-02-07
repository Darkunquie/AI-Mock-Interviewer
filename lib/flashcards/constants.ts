// Flash Cards AI Configuration

export const FLASHCARD_CONFIG = {
  model: "llama-3.3-70b-versatile",
  fallbackModel: "llama-3.1-8b-instant",
  maxTokens: 8000,
  temperature: 0.7,
  defaultCount: 10,
} as const;

export const LOG_PREFIX = "[FlashCards]";

// Available topics by technology
export const TECH_TOPICS: Record<string, string[]> = {
  "React": ["Hooks", "State Management", "Component Lifecycle", "Performance", "Context API", "Redux", "Testing"],
  "JavaScript": ["ES6+", "Async/Await", "Closures", "Prototypes", "DOM", "Event Loop", "Modules"],
  "TypeScript": ["Types", "Interfaces", "Generics", "Decorators", "Utility Types", "Type Guards"],
  "Node.js": ["Express", "Middleware", "Streams", "File System", "REST API", "Authentication"],
  "Python": ["Data Structures", "OOP", "Decorators", "Generators", "Async", "Testing"],
  "SQL": ["Queries", "Joins", "Indexes", "Transactions", "Normalization", "Performance"],
  "System Design": ["Scalability", "Load Balancing", "Caching", "Databases", "Microservices"],
  "Data Structures": ["Arrays", "Trees", "Graphs", "Hash Tables", "Stacks", "Queues"],
  "Algorithms": ["Sorting", "Searching", "Dynamic Programming", "Recursion", "Big O"],
};
