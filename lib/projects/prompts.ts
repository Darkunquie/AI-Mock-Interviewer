import { PROJECT_DEFAULTS } from "./constants";

/**
 * Build the system prompt for AI
 */
export function buildSystemPrompt(): string {
  return `You are a senior software architect. Generate comprehensive project specifications.
Return ONLY valid JSON with no markdown formatting or code blocks.
Each project must have detailed projectExplanation with all 12 sections.`;
}

/**
 * Build the user prompt for project generation
 */
export function buildUserPrompt(technology: string, domain: string): string {
  return `Generate ${PROJECT_DEFAULTS.count} ${technology} projects for ${domain} domain.

Mix: 2 Beginner, 2 Intermediate, 1 Advanced

IMPORTANT - Make these sections DETAILED and REALISTIC:

0. projectExplanation (COMPREHENSIVE TEXT SECTIONS):
   - detailedOverview: 8-10 sentences explaining the project comprehensively - what it does, why it matters, how it works technically, problems solved, who benefits, what makes it unique
   - keyObjectives: 5 specific measurable goals the project achieves
   - targetAudience: 2-3 sentences about primary users and their interaction
   - realWorldApplications: 3 specific industry use cases where this project applies
   - businessProblem: 5+ sentences about the core problem being solved
   - All other 12 sections as specified below

1. features (${PROJECT_DEFAULTS.features.min}-${PROJECT_DEFAULTS.features.max} features per project):
   - Real features specific to ${domain} domain
   - Include authentication, CRUD operations, reporting, notifications etc.
   - Mix of must-have and nice-to-have

2. databaseSchema (${PROJECT_DEFAULTS.tables.min}-${PROJECT_DEFAULTS.tables.max} tables per project):
   - Real table names relevant to ${domain}
   - Include proper columns with realistic types (uuid, varchar, timestamp, jsonb, etc.)
   - Include constraints (PRIMARY KEY, NOT NULL, UNIQUE, FOREIGN KEY)
   - Include relationships between tables

3. apiEndpoints (${PROJECT_DEFAULTS.endpoints.min}-${PROJECT_DEFAULTS.endpoints.max} endpoints per project):
   - RESTful endpoints with proper HTTP methods
   - Include auth endpoints (login, register, logout)
   - Include CRUD for main resources
   - Include search/filter endpoints

4. implementationGuide (${PROJECT_DEFAULTS.implementationSteps.min}-${PROJECT_DEFAULTS.implementationSteps.max} steps per project):
   - Step-by-step development guide
   - Include: Project setup, Database setup, Auth implementation, Core features, Testing, Deployment
   - Realistic hour estimates

5. workflowDiagrams (EXACTLY 3 diagrams per project):
   - Diagram 1: System Architecture (flowchart) - Show components and data flow
   - Diagram 2: Database ER Diagram (erDiagram) - Show table relationships
   - Diagram 3: Sequence Diagram (sequenceDiagram) - Show user interaction flow
   - Use valid Mermaid.js syntax with proper escaping (\\n for newlines)

Return ONLY valid JSON:
{
  "projects": [
    {
      "title": "Descriptive Project Title",
      "description": "2-3 sentence overview",
      "difficulty": "beginner|intermediate|advanced",
      "estimatedDays": 10,
      "projectExplanation": {
        "detailedOverview": "8-10 sentence comprehensive overview explaining what this project does, why it matters, how it works technically, what problems it solves, who benefits from it, and what makes it unique. Include specific technical details about the architecture and implementation approach.",
        "keyObjectives": ["Objective 1: Specific measurable goal", "Objective 2: Another goal", "Objective 3: Technical objective", "Objective 4: User-facing objective", "Objective 5: Business objective"],
        "targetAudience": "2-3 sentences describing the primary users, their technical level, and how they will interact with the system.",
        "realWorldApplications": ["Application 1: Specific use case in industry", "Application 2: Another real scenario", "Application 3: Third example"],
        "businessProblem": "5+ sentence problem description specific to ${domain}...",
        "businessQuestions": ["Question 1?", "Question 2?", "Question 3?", "Question 4?", "Question 5?"],
        "domainsCovered": [{"domain": "Domain Name", "description": "What it covers"}],
        "dataSources": {"systems": ["System1", "System2", "System3"], "dataFormats": ["JSON", "CSV", "XML"]},
        "architectureLayers": ["Frontend", "API Gateway", "Business Logic", "Data Layer", "Database"],
        "technologyStack": [{"category": "Backend", "technologies": ["${technology}", "Express/FastAPI"]}],
        "dataFlow": [{"step": 1, "title": "Data Ingestion", "description": "How data enters", "details": ["Detail1", "Detail2"], "outputExample": "/data/raw/"}],
        "kpis": [{"category": "Performance", "metrics": ["Response Time", "Throughput", "Error Rate"]}],
        "dashboards": [{"name": "Admin Dashboard", "metrics": ["Users", "Revenue", "Activity"]}],
        "securityCompliance": {"regulations": ["GDPR", "SOC2"], "accessControl": ["RBAC", "JWT"], "dataProtection": ["AES-256", "TLS"]},
        "businessImpact": ["Reduce costs by 30%", "Improve efficiency by 50%", "Better decisions", "Faster processing"],
        "interviewSummary": "2-3 sentence elevator pitch..."
      },
      "learningOutcomes": ["${technology} fundamentals", "REST API design", "Database modeling", "Authentication"],
      "prerequisites": ["Basic ${technology}", "SQL basics", "Git"],
      "industryRelevance": "High demand skill in ${domain} sector...",
      "techStack": {
        "frontend": [{"name": "React", "category": "Framework", "reason": "Component-based UI", "alternatives": ["Vue", "Angular"], "learningResources": []}],
        "backend": [{"name": "${technology}", "category": "Core", "reason": "Primary backend language", "alternatives": [], "learningResources": []}],
        "database": [{"name": "PostgreSQL", "category": "Database", "reason": "Relational data", "alternatives": ["MySQL"], "learningResources": []}],
        "devops": [],
        "testing": []
      },
      "workflowDiagrams": [
        {"title": "System Architecture", "type": "architecture", "description": "High-level system flow", "mermaidCode": "flowchart TB\\n    A[Client] --> B[API Gateway]\\n    B --> C[Auth Service]\\n    B --> D[Business Logic]\\n    D --> E[(PostgreSQL)]\\n    D --> F[(Redis Cache)]"},
        {"title": "Database ER Diagram", "type": "er-diagram", "description": "Entity relationships", "mermaidCode": "erDiagram\\n    USERS ||--o{ PROFILES : has\\n    USERS ||--o{ ORDERS : places\\n    ORDERS ||--|{ ORDER_ITEMS : contains\\n    PRODUCTS ||--o{ ORDER_ITEMS : included_in"},
        {"title": "User Flow Sequence", "type": "sequence", "description": "Authentication flow", "mermaidCode": "sequenceDiagram\\n    User->>+API: POST /login\\n    API->>+DB: Validate credentials\\n    DB-->>-API: User data\\n    API-->>-User: JWT Token"}
      ],
      "features": [
        {"name": "User Authentication", "description": "JWT-based login, register, password reset", "priority": "must-have"},
        {"name": "Dashboard", "description": "Overview with key metrics and charts", "priority": "must-have"},
        {"name": "CRUD Operations", "description": "Create, read, update, delete main entities", "priority": "must-have"},
        {"name": "Search & Filter", "description": "Advanced search with multiple filters", "priority": "must-have"},
        {"name": "Export Data", "description": "Export to CSV/PDF formats", "priority": "nice-to-have"},
        {"name": "Notifications", "description": "Email and in-app notifications", "priority": "nice-to-have"}
      ],
      "databaseSchema": [
        {"name": "users", "description": "User accounts", "columns": [{"name": "id", "type": "uuid", "constraints": ["PRIMARY KEY"]}, {"name": "email", "type": "varchar(255)", "constraints": ["UNIQUE", "NOT NULL"]}, {"name": "password_hash", "type": "varchar(255)", "constraints": ["NOT NULL"]}, {"name": "created_at", "type": "timestamp", "constraints": ["DEFAULT NOW()"]}], "relationships": []},
        {"name": "profiles", "description": "User profiles", "columns": [{"name": "id", "type": "uuid", "constraints": ["PRIMARY KEY"]}, {"name": "user_id", "type": "uuid", "constraints": ["FOREIGN KEY"]}, {"name": "full_name", "type": "varchar(255)", "constraints": []}], "relationships": ["users.id"]}
      ],
      "apiEndpoints": [
        {"method": "POST", "path": "/api/auth/register", "description": "Register new user"},
        {"method": "POST", "path": "/api/auth/login", "description": "Login and get JWT token"},
        {"method": "GET", "path": "/api/users/me", "description": "Get current user profile"},
        {"method": "GET", "path": "/api/resources", "description": "List all resources with pagination"},
        {"method": "POST", "path": "/api/resources", "description": "Create new resource"},
        {"method": "GET", "path": "/api/resources/:id", "description": "Get resource by ID"},
        {"method": "PUT", "path": "/api/resources/:id", "description": "Update resource"},
        {"method": "DELETE", "path": "/api/resources/:id", "description": "Delete resource"}
      ],
      "implementationGuide": [
        {"step": 1, "title": "Project Setup", "description": "Initialize ${technology} project with dependencies", "estimatedHours": 2, "tips": ["Use latest stable version", "Configure linting"]},
        {"step": 2, "title": "Database Setup", "description": "Create tables and set up ORM", "estimatedHours": 3, "tips": ["Use migrations", "Add indexes"]},
        {"step": 3, "title": "Authentication", "description": "Implement JWT auth with register/login", "estimatedHours": 4, "tips": ["Hash passwords", "Refresh tokens"]},
        {"step": 4, "title": "Core CRUD", "description": "Build main resource endpoints", "estimatedHours": 6, "tips": ["Validate input", "Handle errors"]},
        {"step": 5, "title": "Frontend Integration", "description": "Connect UI to API", "estimatedHours": 8, "tips": ["Use axios/fetch", "Handle loading states"]},
        {"step": 6, "title": "Testing", "description": "Write unit and integration tests", "estimatedHours": 4, "tips": ["Test edge cases", "Mock external services"]}
      ]
    }
  ]
}

Return exactly ${PROJECT_DEFAULTS.count} projects with ALL sections properly filled. Make content specific to ${domain} domain and ${technology} technology.`;
}
