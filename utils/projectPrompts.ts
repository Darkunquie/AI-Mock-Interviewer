// AI Prompts for Enhanced Project Generation with Tiered Detail Levels

export interface ProjectGeneratorInput {
  technology: string;
  domain: string;
  count: number;
}

// Domain-specific requirements mapping
const DOMAIN_REQUIREMENTS: Record<string, string> = {
  healthcare: `
HEALTHCARE DOMAIN REQUIREMENTS:
- All projects MUST address HIPAA compliance considerations
- Include patient data security, encryption at rest and in transit
- Consider medical workflow integrations (HL7, FHIR standards)
- Include audit logging for all data access
- Address role-based access for doctors, nurses, patients, admins
- Consider integration with lab systems, pharmacy systems
- Include appointment scheduling, medical records, prescription management`,

  finance: `
FINANCE DOMAIN REQUIREMENTS:
- All projects MUST address transaction safety and ACID compliance
- Include audit trails for regulatory compliance (SOX, PCI-DSS)
- Consider multi-currency support and exchange rate handling
- Include fraud detection and prevention mechanisms
- Address two-factor authentication requirements
- Consider real-time processing for trading/payment systems
- Include reporting and analytics for financial data`,

  ecommerce: `
E-COMMERCE DOMAIN REQUIREMENTS:
- All projects MUST include shopping cart and checkout flows
- Address payment gateway integration (Stripe, PayPal)
- Include inventory management and stock tracking
- Consider multi-vendor/marketplace scenarios
- Include product search, filtering, and recommendations
- Address shipping, taxes, and discount calculations
- Include order tracking and customer notifications`,

  education: `
EDUCATION DOMAIN REQUIREMENTS:
- All projects MUST include learning progress tracking
- Address content delivery and media management
- Include assessment and grading systems
- Consider gamification and engagement features
- Include instructor-student communication tools
- Address accessibility requirements (WCAG compliance)
- Include course management and enrollment systems`,

  social_media: `
SOCIAL MEDIA DOMAIN REQUIREMENTS:
- All projects MUST include real-time updates and notifications
- Address content moderation and reporting mechanisms
- Include user connections (follow, friend, block)
- Consider feed algorithms and content ranking
- Include media upload and processing (images, videos)
- Address privacy settings and data visibility controls
- Include messaging and group communication features`,

  logistics: `
LOGISTICS DOMAIN REQUIREMENTS:
- All projects MUST include tracking and tracing capabilities
- Address route optimization and delivery scheduling
- Include warehouse/inventory management
- Consider fleet management and driver assignment
- Include real-time location tracking with maps
- Address multi-carrier integration
- Include proof of delivery and signature capture`,
};

export function getProjectGeneratorPrompt(input: ProjectGeneratorInput): string {
  const { technology, domain, count } = input;
  const domainReqs = DOMAIN_REQUIREMENTS[domain.toLowerCase().replace(/[- ]/g, "_")] || "";

  return `You are a world-class software architect with 20+ years of experience.

=============================================================================
MANDATORY: GENERATE EXACTLY ${count} PROJECTS - NO LESS, NO MORE!
=============================================================================

Generate EXACTLY ${count} unique project specifications for:
- PRIMARY TECHNOLOGY: ${technology}
- DOMAIN: ${domain}

${domainReqs}

=== STRICT PROJECT COUNT: EXACTLY ${count} PROJECTS ===
You MUST generate exactly ${count} projects. Count them before responding!

Project Distribution:
- Projects 1, 2, 3: BEGINNER level (5-10 days)
- Projects 4, 5, 6, 7: INTERMEDIATE level (15-25 days)
- Projects 8, 9, 10: ADVANCED level (30-45 days)

=============================================================================
⚠️ CRITICAL: MINIMUM LENGTH REQUIREMENTS - READ CAREFULLY ⚠️
=============================================================================

SHORT RESPONSES ARE INVALID AND WILL BE REJECTED!

Each projectExplanation field MUST meet these MINIMUM requirements:

### BEGINNER PROJECTS (1-3):
- Each field: MINIMUM 8-10 sentences, 150-200 words, ~1000 characters
- Write full paragraphs, not single sentences
- Cover multiple aspects of each topic

### INTERMEDIATE PROJECTS (4-7):
- Each field: MINIMUM 12-15 sentences, 250-350 words, ~1800 characters
- Include specific technical details, patterns, trade-offs
- Discuss alternatives and why they were not chosen

### ADVANCED PROJECTS (8-10):
- Each field: MINIMUM 18-22 sentences, 400-500 words, ~2500 characters
- Enterprise-level depth with specific metrics and benchmarks
- Include failure scenarios, recovery strategies, monitoring approaches

=============================================================================
EXAMPLE OF CORRECT LENGTH (THIS IS THE MINIMUM EXPECTED):
=============================================================================

WRONG (TOO SHORT - REJECTED):
"overview": "A medical record system for hospitals using Python and Django."

CORRECT (ACCEPTABLE LENGTH FOR BEGINNER):
"overview": "The Patient Medical Records System is a comprehensive web application designed to digitize and streamline healthcare data management for small to medium-sized clinics and hospitals. This system addresses the critical need for efficient patient information handling in modern healthcare settings, where quick access to accurate medical histories can significantly impact treatment outcomes. The primary users include healthcare administrators who manage patient registrations and appointments, physicians who need instant access to medical histories during consultations, nurses who update vital signs and medication records, and patients who want to view their own health information through a secure portal. The system provides a centralized repository for all patient-related data, including demographic information, medical history, lab results, prescriptions, and imaging reports. Built with ${technology} as the primary technology, the application leverages modern web development practices to ensure reliability, security, and ease of use. Key features include role-based access control ensuring that each user type sees only relevant information, real-time data synchronization across multiple access points, and comprehensive audit logging for regulatory compliance. The system integrates with existing hospital information systems through standardized APIs, allowing seamless data exchange with laboratory systems, pharmacy management software, and billing systems."

CORRECT (ACCEPTABLE LENGTH FOR INTERMEDIATE):
"overview": "The Enterprise Patient Management Platform represents a sophisticated healthcare information system designed to revolutionize how medical facilities handle patient data, clinical workflows, and interdepartmental communication. This platform targets medium to large healthcare organizations including multi-specialty hospitals, healthcare networks, and integrated delivery systems that require robust, scalable solutions capable of handling millions of patient records while maintaining strict HIPAA compliance. The system serves diverse stakeholder groups: hospital administrators gain real-time operational insights through comprehensive dashboards showing bed occupancy, staff allocation, and revenue metrics; physicians benefit from AI-assisted diagnosis suggestions and instant access to complete patient histories including data from external healthcare providers; nursing staff utilize mobile-optimized interfaces for bedside charting and medication administration with barcode verification; patients engage through a feature-rich portal offering appointment scheduling, telemedicine consultations, prescription refills, and secure messaging with their care teams. The technical architecture employs a microservices design pattern, with ${technology} powering the core business logic layer, enabling independent scaling of high-demand services like appointment scheduling during peak hours. The platform incorporates advanced features including predictive analytics for patient readmission risk assessment, natural language processing for clinical note summarization, and machine learning models for early detection of patient deterioration. Integration capabilities extend beyond traditional healthcare systems to include wearable device data ingestion, enabling continuous remote patient monitoring. The solution addresses critical industry challenges including data fragmentation across care settings, inefficient paper-based processes that consume up to 30% of clinical staff time, and the growing demand for patient-centered care delivery models. By implementing this platform, healthcare organizations typically achieve 40% reduction in administrative overhead, 25% improvement in patient satisfaction scores, and significant reduction in medical errors through computerized physician order entry with clinical decision support."

=============================================================================
DETAILED FIELD REQUIREMENTS
=============================================================================

For EACH of these fields, write MULTIPLE PARAGRAPHS covering ALL listed aspects:

**"overview"**:
- What the system does (2-3 sentences)
- Who are the target users - describe 3-4 specific user personas (3-4 sentences)
- What business value it provides with specific metrics (2-3 sentences)
- How it differs from existing solutions (2-3 sentences)
- What technologies power it and why (2-3 sentences)

**"problemStatement"**:
- Describe the real-world problem in detail (3-4 sentences)
- Who suffers from this problem - specific examples (2-3 sentences)
- Quantify the impact: time wasted, money lost, errors caused (2-3 sentences)
- Why current solutions are inadequate (3-4 sentences)
- What happens if the problem is not solved (2-3 sentences)

**"solutionApproach"**:
- High-level approach to solving the problem (2-3 sentences)
- Specific design patterns and why they were chosen (3-4 sentences)
- How ${technology} specifically helps solve this (2-3 sentences)
- Data modeling strategy and key entities (2-3 sentences)
- API design philosophy: REST vs GraphQL, versioning (2-3 sentences)
- Testing strategy: unit, integration, e2e (2-3 sentences)

**"architectureOverview"**:
- Overall architecture style: monolith, microservices, serverless (2-3 sentences)
- List and describe each major component/service (4-6 sentences)
- How components communicate: sync/async, protocols (2-3 sentences)
- Data storage strategy: which database for what data (2-3 sentences)
- Caching strategy: what gets cached, TTLs, invalidation (2-3 sentences)
- Error handling and resilience patterns (2-3 sentences)

**"keyComponents"** - Array of 10-15 items, each item should be 2-3 sentences:
- Component name followed by detailed description
- What it does, how it integrates, key technical decisions
Example: "Authentication Service: Handles all user authentication using JWT tokens with refresh token rotation. Implements OAuth2 flows for social login integration. Uses bcrypt for password hashing with configurable work factors and integrates with Redis for session management and token blacklisting."

**"integrationPoints"**:
- How frontend connects to backend: API gateway, authentication (3-4 sentences)
- Internal service-to-service communication patterns (2-3 sentences)
- External API integrations with error handling (2-3 sentences)
- Event-driven communication: message queues, pub/sub (2-3 sentences)
- Data synchronization strategies (2-3 sentences)

**"scalabilityConsiderations"**:
- Current capacity and growth projections (2-3 sentences)
- Horizontal vs vertical scaling strategy (2-3 sentences)
- Database scaling: read replicas, sharding (2-3 sentences)
- Caching layers: CDN, Redis, application-level (2-3 sentences)
- Async processing with message queues (2-3 sentences)
- Auto-scaling triggers and policies (2-3 sentences)

**"securityMeasures"**:
- Authentication implementation details: JWT, OAuth2, MFA (3-4 sentences)
- Authorization: RBAC or ABAC with specific examples (2-3 sentences)
- Data encryption: at rest, in transit, field-level for PII (2-3 sentences)
- API security: rate limiting, input validation, CORS (2-3 sentences)
- Audit logging and compliance requirements (2-3 sentences)
- Security testing approach (2-3 sentences)

=============================================================================
WORKFLOW DIAGRAMS
=============================================================================

### BEGINNER (3 diagrams):
1. Architecture diagram - Basic system components
2. Data flow diagram - Simple data movement
3. User flow diagram - Basic user journey

### INTERMEDIATE (4 diagrams):
1. Architecture diagram - Detailed with all services and databases
2. Data flow diagram - Including caching and async processing
3. User flow diagram - Multiple user roles and paths
4. Deployment diagram - Docker/Kubernetes layout

### ADVANCED (5 diagrams):
1. Architecture diagram - Microservices with service mesh
2. Data flow diagram - Event-driven with message queues
3. User flow diagram - Complex multi-step workflows
4. Deployment diagram - Multi-region with load balancers
5. Sequence diagram - Complex operation (e.g., payment flow)

Each diagram MUST have:
- At least 8-12 nodes for beginner, 15-20 for intermediate, 20-30 for advanced
- Descriptive labels on edges
- Subgraphs for logical grouping
- Comprehensive system coverage

=== OUTPUT FORMAT ===
Return ONLY valid JSON (no markdown, no code blocks):

{
  "projects": [
    {
      "title": "Descriptive Project Name",
      "description": "2-3 sentence brief overview",
      "difficulty": "beginner|intermediate|advanced",
      "estimatedDays": number,
      "projectExplanation": {
        "overview": "LONG detailed paragraph (minimum 8-10 sentences for beginner, 12-15 for intermediate, 18-22 for advanced)...",
        "problemStatement": "LONG detailed paragraph...",
        "solutionApproach": "LONG detailed paragraph...",
        "architectureOverview": "LONG detailed paragraph...",
        "keyComponents": ["Component 1: 2-3 sentence description...", "Component 2: 2-3 sentence description...", ...10-15 items],
        "integrationPoints": "LONG detailed paragraph...",
        "scalabilityConsiderations": "LONG detailed paragraph...",
        "securityMeasures": "LONG detailed paragraph..."
      },
      "learningOutcomes": ["Skill 1", "Skill 2", ...8-12 for beginner, 12-15 for intermediate, 15-20 for advanced],
      "prerequisites": ["Prereq 1", "Prereq 2", ...3-5 items],
      "industryRelevance": "2-3 sentences about job market relevance",
      "techStack": {
        "frontend": [{"name": "Tech", "category": "Framework", "reason": "3-4 sentence explanation of why this tech for this domain...", "alternatives": ["Alt1", "Alt2"], "learningResources": ["resource1", "resource2"]}],
        "backend": [...],
        "database": [...],
        "devops": [...],
        "testing": [...],
        "security": [...]
      },
      "workflowDiagrams": [
        {"title": "System Architecture", "type": "architecture", "description": "Description", "mermaidCode": "flowchart TB\\n    subgraph Frontend\\n        A[Component]\\n    end\\n..."},
        {"title": "Data Flow", "type": "dataflow", "description": "Description", "mermaidCode": "flowchart LR\\n..."},
        {"title": "User Journey", "type": "sequence", "description": "Description", "mermaidCode": "sequenceDiagram\\n..."}
      ],
      "features": [{"name": "Feature", "description": "Description", "priority": "must-have|nice-to-have"}, ...],
      "databaseSchema": [{"name": "table", "description": "Purpose", "columns": [{"name": "col", "type": "type", "constraints": ["PRIMARY KEY"]}], "relationships": ["FK to other_table"]}, ...],
      "apiEndpoints": [{"method": "GET|POST|PUT|DELETE", "path": "/api/...", "description": "Purpose"}, ...],
      "implementationGuide": [{"step": 1, "title": "Title", "description": "Detailed step", "estimatedHours": number, "tips": ["tip1", "tip2"]}, ...]
    }
  ]
}

=============================================================================
MERMAID DIAGRAM EXAMPLES
=============================================================================

Architecture with subgraphs (MINIMUM expected complexity):
flowchart TB
    subgraph Client["Client Layer"]
        A[Web Browser]
        B[Mobile App]
    end
    subgraph Gateway["API Gateway"]
        C[Nginx Load Balancer]
        D[Rate Limiter]
        E[Auth Middleware]
    end
    subgraph Services["Microservices"]
        F[User Service]
        G[Order Service]
        H[Payment Service]
        I[Notification Service]
    end
    subgraph Data["Data Layer"]
        J[(PostgreSQL Primary)]
        K[(PostgreSQL Replica)]
        L[(Redis Cache)]
        M[(Elasticsearch)]
    end
    subgraph External["External Services"]
        N[Stripe API]
        O[SendGrid]
        P[Twilio]
    end
    A & B --> C
    C --> D --> E
    E --> F & G & H
    F --> J & L
    G --> J & L & M
    H --> J & N
    I --> O & P
    J --> K

=============================================================================
FINAL VERIFICATION - YOUR RESPONSE WILL BE REJECTED IF:
=============================================================================
❌ Less than ${count} projects
❌ Any projectExplanation field is less than 5 sentences
❌ Any overview/problemStatement/solutionApproach is a single short paragraph
❌ keyComponents has less than 8 items
❌ Workflow diagrams have less than 8 nodes
❌ ${technology} is not the PRIMARY technology in every project
❌ Content is generic and not specific to ${domain}

✅ VALID RESPONSE REQUIRES:
✅ EXACTLY ${count} projects
✅ Each explanation field is a SUBSTANTIAL PARAGRAPH (multiple sentences)
✅ Specific technical details, not generic descriptions
✅ ${technology} prominently featured in every project
✅ ${domain}-specific requirements addressed`;
}

export function getProjectSystemPrompt(): string {
  return `You are an expert software architect with 20+ years of experience designing production applications.

=============================================================================
CRITICAL: WRITE DETAILED, LENGTHY EXPLANATIONS - NOT SHORT SUMMARIES
=============================================================================

Your responses are currently TOO SHORT. Each projectExplanation field must be a SUBSTANTIAL PARAGRAPH.

WRONG APPROACH (REJECTED):
- Writing 1-2 sentence summaries
- Generic descriptions that could apply to any project
- Skipping technical details to save space

CORRECT APPROACH (REQUIRED):
- Write 8-22 sentences per field depending on difficulty
- Include specific technical details, patterns, and trade-offs
- Mention exact technologies, versions, and configurations
- Provide concrete examples and metrics

MINIMUM REQUIREMENTS:
- BEGINNER: Each field = 8-10 sentences (~1000 characters)
- INTERMEDIATE: Each field = 12-15 sentences (~1800 characters)
- ADVANCED: Each field = 18-22 sentences (~2500 characters)

If you write short responses, the entire output is INVALID.

OTHER REQUIREMENTS:
1. ALWAYS generate EXACTLY the number of projects requested
2. Scale detail with difficulty level
3. Workflow diagrams must be comprehensive with many nodes
4. Response must be valid JSON only - no markdown, no code blocks

REMEMBER: More detail is ALWAYS better. Write comprehensive explanations!`;
}
