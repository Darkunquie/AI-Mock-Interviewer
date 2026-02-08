// Interview Types
export type InterviewRole =
  | "frontend"
  | "backend"
  | "fullstack"
  | "data"
  | "devops"
  | "mobile"
  | "hr"
  // Extended roles based on 191 IT courses
  | "data_engineer"
  | "data_analyst"
  | "data_scientist"
  | "ml_engineer"
  | "ai_engineer"
  | "cloud_engineer"
  | "sre"
  | "mobile_android"
  | "mobile_ios"
  | "mobile_cross"
  | "security_engineer"
  | "qa_engineer"
  | "sap_consultant"
  | "salesforce_dev"
  | "rpa_developer"
  | "blockchain_dev"
  // Oracle Technologies
  | "oracle_dba"
  | "oracle_developer"
  | "oracle_fusion"
  | "oci_engineer"
  // Microsoft Technologies
  | "dotnet_developer"
  | "azure_admin"
  | "azure_developer"
  | "power_bi_developer"
  | "dynamics_consultant"
  | "sql_server_dba"
  // SAP Expanded
  | "sap_abap"
  | "sap_fico"
  | "sap_mm"
  | "sap_hana"
  | "sap_bw"
  // Data & Analytics
  | "tableau_developer"
  | "informatica_developer"
  | "snowflake_engineer"
  | "databricks_engineer"
  // Infrastructure
  | "network_engineer"
  | "linux_admin"
  // Design
  | "ui_ux_designer"
  // Testing
  | "selenium_tester"
  | "automation_tester"
  // Marketing & Business
  | "digital_marketer"
  | "seo_specialist"
  | "scrum_master"
  | "product_manager"
  | "business_analyst";

export type ExperienceLevel = "0-1" | "1-3" | "3-5" | "5+";

export type InterviewType = "technical" | "hr" | "behavioral";

export type InterviewDuration = "15" | "30";

export type InterviewStatus = "pending" | "in_progress" | "completed";

export type Difficulty = "easy" | "medium" | "hard";

export type InterviewMode = "interview" | "practice";

// Tech Stack Options per Role
export const TECH_STACK_OPTIONS: Record<string, string[]> = {
  frontend: [
    "React", "Next.js", "Vue.js", "Angular", "TypeScript", "JavaScript",
    "HTML/CSS", "Tailwind CSS", "Redux", "GraphQL", "Webpack", "Vite",
  ],
  backend: [
    "Node.js", "Express.js", "Python", "Django", "FastAPI", "Java",
    "Spring Boot", "Go", "Ruby on Rails", "PostgreSQL", "MongoDB", "Redis",
  ],
  fullstack: [
    "React", "Next.js", "Node.js", "TypeScript", "Python", "PostgreSQL",
    "MongoDB", "GraphQL", "Docker", "AWS", "REST APIs", "Redis",
  ],
  data: [
    "Python", "Pandas", "NumPy", "SQL", "TensorFlow", "PyTorch",
    "Scikit-learn", "Tableau", "Spark", "R", "Machine Learning", "Statistics",
  ],
  devops: [
    "Docker", "Kubernetes", "AWS", "Azure", "GCP", "Terraform",
    "CI/CD", "Jenkins", "Linux", "Ansible", "Prometheus", "Grafana",
  ],
  mobile: [
    "React Native", "Flutter", "Swift", "Kotlin", "iOS", "Android",
    "Dart", "Expo", "Firebase", "REST APIs", "SQLite", "TypeScript",
  ],
  hr: [],
  // Extended roles tech stacks
  data_engineer: [
    "Python", "SQL", "Apache Spark", "Kafka", "Airflow", "Snowflake",
    "Databricks", "AWS Glue", "BigQuery", "Redshift", "ETL/ELT", "Hadoop",
  ],
  data_analyst: [
    "SQL", "Python", "Tableau", "Power BI", "Excel", "Looker",
    "Statistics", "Data Visualization", "R", "Pandas", "Data Modeling",
  ],
  data_scientist: [
    "Python", "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch",
    "Scikit-learn", "NLP", "Computer Vision", "Statistics", "SQL", "Pandas",
  ],
  ml_engineer: [
    "Python", "TensorFlow", "PyTorch", "MLOps", "Kubernetes", "Docker",
    "AWS SageMaker", "Kubeflow", "Feature Engineering", "Model Deployment",
  ],
  ai_engineer: [
    "Python", "LangChain", "OpenAI API", "RAG", "Vector Databases", "LLMs",
    "Prompt Engineering", "Hugging Face", "FastAPI", "Embeddings", "Fine-tuning",
  ],
  cloud_engineer: [
    "AWS", "Azure", "GCP", "Terraform", "CloudFormation", "Kubernetes",
    "Serverless", "VPC", "IAM", "Cloud Security", "Cost Optimization",
  ],
  sre: [
    "Kubernetes", "Docker", "Prometheus", "Grafana", "Terraform", "Python",
    "Go", "Incident Management", "SLO/SLI", "Chaos Engineering", "Linux",
  ],
  mobile_android: [
    "Kotlin", "Java", "Android SDK", "Jetpack Compose", "MVVM", "Room",
    "Retrofit", "Coroutines", "Dagger/Hilt", "Firebase", "Play Store",
  ],
  mobile_ios: [
    "Swift", "SwiftUI", "UIKit", "Xcode", "Core Data", "Combine",
    "MVVM", "CocoaPods", "SPM", "App Store", "Push Notifications",
  ],
  mobile_cross: [
    "React Native", "Flutter", "Dart", "TypeScript", "Expo", "Firebase",
    "State Management", "Native Modules", "App Performance", "CI/CD",
  ],
  security_engineer: [
    "Penetration Testing", "OWASP", "Burp Suite", "Cryptography", "IAM",
    "SIEM", "SOC", "Incident Response", "Network Security", "Cloud Security",
  ],
  qa_engineer: [
    "Selenium", "Cypress", "Playwright", "Jest", "API Testing", "Postman",
    "JMeter", "Performance Testing", "Test Automation", "CI/CD", "Agile",
  ],
  sap_consultant: [
    "SAP FICO", "SAP MM", "SAP SD", "SAP ABAP", "SAP HANA", "SAP S/4HANA",
    "SAP Integration", "SAP Fiori", "SAP BTP", "Business Process",
  ],
  salesforce_dev: [
    "Apex", "Lightning Web Components", "SOQL", "Salesforce Admin", "Flows",
    "Integration", "Salesforce DX", "Visualforce", "Communities", "CPQ",
  ],
  rpa_developer: [
    "UiPath", "Automation Anywhere", "Blue Prism", "Power Automate", "Python",
    "Process Mining", "Bot Development", "OCR", "API Integration",
  ],
  blockchain_dev: [
    "Solidity", "Ethereum", "Web3.js", "Smart Contracts", "Hardhat", "Truffle",
    "DeFi", "NFTs", "Rust", "Blockchain Security", "Consensus Mechanisms",
  ],
  // Oracle Technologies
  oracle_dba: [
    "Oracle SQL", "PL/SQL", "Oracle DBA", "RMAN", "Data Guard", "RAC",
    "ASM", "Performance Tuning", "Oracle 19c", "Oracle Cloud", "Multitenant",
  ],
  oracle_developer: [
    "Oracle SQL", "PL/SQL", "Oracle Forms", "Oracle APEX", "Oracle ADF",
    "Oracle REST", "SQL Developer", "TOAD", "Performance Optimization",
  ],
  oracle_fusion: [
    "Oracle Fusion ERP", "Oracle HCM", "Oracle SCM", "OTBI", "BIP Reports",
    "Oracle Integration Cloud", "FBDI", "Security Roles", "Customization",
  ],
  oci_engineer: [
    "OCI Compute", "OCI Networking", "OCI Storage", "OCI Database", "OKE",
    "OCI Security", "Terraform", "OCI DevOps", "Autonomous Database",
  ],
  // Microsoft Technologies
  dotnet_developer: [
    "C#", ".NET Core", ".NET 6+", "ASP.NET Core", "Entity Framework", "LINQ",
    "Blazor", "Azure", "SQL Server", "REST APIs", "Microservices", "Docker",
  ],
  azure_admin: [
    "Azure VMs", "Azure Networking", "Azure AD", "Azure Storage", "Azure Monitor",
    "Azure Security", "ARM Templates", "Azure Policy", "Cost Management",
  ],
  azure_developer: [
    "Azure Functions", "Azure App Service", "Azure DevOps", "Cosmos DB",
    "Azure Service Bus", "Azure Kubernetes", "Logic Apps", "API Management",
  ],
  power_bi_developer: [
    "Power BI Desktop", "DAX", "Power Query", "Data Modeling", "Visualizations",
    "Power BI Service", "Row-Level Security", "Dataflows", "Paginated Reports",
  ],
  dynamics_consultant: [
    "Dynamics 365 Sales", "Dynamics 365 Finance", "Dynamics 365 CE", "Power Platform",
    "Dataverse", "Plugins", "Workflows", "Integration", "Customization",
  ],
  sql_server_dba: [
    "SQL Server", "T-SQL", "SSMS", "Always On", "Replication", "SSIS",
    "SSRS", "Performance Tuning", "Backup/Recovery", "Security",
  ],
  // SAP Expanded
  sap_abap: [
    "ABAP", "SAP HANA", "CDS Views", "AMDP", "OData Services", "RAP",
    "SAP Fiori", "Enhancement Framework", "ALV Reports", "BAPIs",
  ],
  sap_fico: [
    "SAP FI", "SAP CO", "General Ledger", "Accounts Payable", "Accounts Receivable",
    "Asset Accounting", "Cost Center", "Profit Center", "Financial Reporting",
  ],
  sap_mm: [
    "SAP MM", "Procurement", "Inventory Management", "MRP", "Vendor Master",
    "Purchase Orders", "Goods Receipt", "Invoice Verification", "Pricing",
  ],
  sap_hana: [
    "SAP HANA", "HANA Studio", "Calculation Views", "SQLScript", "XS Advanced",
    "HANA Administration", "Performance Optimization", "Data Provisioning",
  ],
  sap_bw: [
    "SAP BW", "BW/4HANA", "InfoObjects", "DSO", "ADSO", "BEx Queries",
    "Data Extraction", "Transformations", "Process Chains", "SAP Analytics Cloud",
  ],
  // Data & Analytics
  tableau_developer: [
    "Tableau Desktop", "Tableau Server", "Data Visualization", "Calculations",
    "LOD Expressions", "Dashboard Design", "Data Blending", "Tableau Prep",
  ],
  informatica_developer: [
    "Informatica PowerCenter", "ETL", "Mappings", "Transformations", "Workflows",
    "IICS", "Data Quality", "MDM", "API Management", "Performance Tuning",
  ],
  snowflake_engineer: [
    "Snowflake", "SQL", "Data Warehousing", "SnowPipe", "Streams & Tasks",
    "Data Sharing", "Time Travel", "Zero Copy Clone", "Performance Optimization",
  ],
  databricks_engineer: [
    "Databricks", "Apache Spark", "Delta Lake", "PySpark", "SQL", "MLflow",
    "Data Engineering", "Unity Catalog", "Workflows", "Lakehouse Architecture",
  ],
  // Infrastructure
  network_engineer: [
    "Networking", "TCP/IP", "Routing", "Switching", "Firewalls", "VPN",
    "Load Balancing", "CCNA", "Network Security", "Cloud Networking",
  ],
  linux_admin: [
    "Linux", "Bash Scripting", "System Administration", "Package Management",
    "User Management", "Networking", "Security", "Monitoring", "Docker",
  ],
  // Design
  ui_ux_designer: [
    "Figma", "Adobe XD", "UI Design", "UX Research", "Wireframing", "Prototyping",
    "Design Systems", "Usability Testing", "Accessibility", "Interaction Design",
  ],
  // Testing
  selenium_tester: [
    "Selenium", "Java/Python", "TestNG", "Cucumber", "Page Object Model",
    "Cross-Browser Testing", "Selenium Grid", "CI/CD", "Test Automation",
  ],
  automation_tester: [
    "Selenium", "Cypress", "Playwright", "API Testing", "Postman", "JMeter",
    "Test Automation", "CI/CD", "BDD", "Performance Testing",
  ],
  // Marketing & Business
  digital_marketer: [
    "SEO", "SEM", "Google Analytics", "Social Media Marketing", "Content Marketing",
    "Email Marketing", "PPC", "Marketing Automation", "CRO", "Google Ads",
  ],
  seo_specialist: [
    "SEO", "Keyword Research", "On-Page SEO", "Technical SEO", "Link Building",
    "Google Search Console", "Ahrefs", "SEMrush", "Analytics", "Content Strategy",
  ],
  scrum_master: [
    "Scrum", "Agile", "Sprint Planning", "Retrospectives", "Jira", "Kanban",
    "Team Facilitation", "Stakeholder Management", "Continuous Improvement",
  ],
  product_manager: [
    "Product Strategy", "Roadmapping", "User Stories", "Agile", "Stakeholder Management",
    "Analytics", "A/B Testing", "Prioritization", "Market Research", "PRD",
  ],
  business_analyst: [
    "Requirements Gathering", "Business Analysis", "Use Cases", "Process Modeling",
    "BPMN", "SQL", "Data Analysis", "Stakeholder Management", "Documentation",
  ],
};

// Practice Topic Options
export const PRACTICE_TOPICS = [
  "Data Structures & Algorithms",
  "System Design",
  "Object-Oriented Programming",
  "Database Design & SQL",
  "REST APIs & Web Services",
  "Design Patterns",
  "Operating Systems",
  "Networking Basics",
  "Security Best Practices",
  "Testing & QA",
  "Git & Version Control",
  "Agile & Scrum",
  "Problem Solving",
  "Code Review & Clean Code",
  "Cloud Computing Basics",
  "Performance Optimization",
];

// Question Types
export interface Question {
  id: number;
  text: string;
  difficulty: Difficulty;
  topic: string;
  expectedTime: number; // seconds
  keywords?: string[]; // Keywords for validation (optional for backward compatibility)
}

export interface GeneratedQuestions {
  questions: Question[];
}

// Evaluation Types
export interface AnswerEvaluation {
  technicalScore: number;
  communicationScore: number;
  depthScore: number;
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  idealAnswer: string;
  followUpTip: string;
  encouragement: string;
  keywordScore?: number; // Keyword coverage score (0-10)
  keywordsCovered?: string[]; // Keywords found in answer
  keywordsMissed?: string[]; // Keywords not found
  keywordValidationPassed?: boolean; // Did answer meet minimum threshold?
  // Speech metrics
  fillerWordCount?: number;
  fillerWords?: Record<string, number>;
  wordsPerMinute?: number;
  speakingTime?: number;
}

// Summary Types
export interface InterviewSummaryData {
  overallScore: number;
  rating: string;
  performanceSummary: string;
  strengths: string[];
  weaknesses: string[];
  recommendedTopics: string[];
  actionPlan: string;
  encouragement: string;
  readinessLevel: "Not Ready" | "Almost Ready" | "Ready" | "Well Prepared";
}

// Interview Session State
export interface InterviewSession {
  interviewId: string;
  currentQuestionIndex: number;
  questions: Question[];
  answers: AnswerWithFeedback[];
  status: InterviewStatus;
}

export interface AnswerWithFeedback {
  questionIndex: number;
  questionText: string;
  userAnswer: string;
  evaluation: AnswerEvaluation | null;
}

// Duration Configuration
export const DURATION_CONFIG: Record<InterviewDuration, { label: string; questionCount: number }> = {
  "15": { label: "15 Minutes", questionCount: 10 },
  "30": { label: "30 Minutes", questionCount: 20 },
};

// API Request/Response Types
export interface CreateInterviewRequest {
  role: InterviewRole;
  experienceLevel: ExperienceLevel;
  interviewType: InterviewType;
  duration: InterviewDuration;
  techStack?: string[];
  mode?: InterviewMode;
  topics?: string[];
}

export interface CreateInterviewResponse {
  success: boolean;
  interviewId: string;
  questions: Question[];
}

export interface EvaluateAnswerRequest {
  interviewId: string;
  questionIndex: number;
  questionText: string;
  userAnswer: string;
}

export interface EvaluateAnswerResponse {
  success: boolean;
  evaluation: AnswerEvaluation;
}

// Role Display Names
export const ROLE_DISPLAY_NAMES: Record<InterviewRole, string> = {
  frontend: "Frontend Developer",
  backend: "Backend Developer",
  fullstack: "Full Stack Developer",
  data: "Data Scientist / Analyst",
  devops: "DevOps Engineer",
  mobile: "Mobile Developer",
  hr: "HR / General",
  // Extended roles
  data_engineer: "Data Engineer",
  data_analyst: "Data Analyst",
  data_scientist: "Data Scientist",
  ml_engineer: "ML Engineer",
  ai_engineer: "AI/LLM Engineer",
  cloud_engineer: "Cloud Engineer",
  sre: "Site Reliability Engineer",
  mobile_android: "Android Developer",
  mobile_ios: "iOS Developer",
  mobile_cross: "Cross-Platform Mobile Dev",
  security_engineer: "Security Engineer",
  qa_engineer: "QA/Test Engineer",
  sap_consultant: "SAP Consultant",
  salesforce_dev: "Salesforce Developer",
  rpa_developer: "RPA Developer",
  blockchain_dev: "Blockchain Developer",
  // Oracle Technologies
  oracle_dba: "Oracle DBA",
  oracle_developer: "Oracle Developer",
  oracle_fusion: "Oracle Fusion Consultant",
  oci_engineer: "OCI Cloud Engineer",
  // Microsoft Technologies
  dotnet_developer: ".NET Developer",
  azure_admin: "Azure Administrator",
  azure_developer: "Azure Developer",
  power_bi_developer: "Power BI Developer",
  dynamics_consultant: "Dynamics 365 Consultant",
  sql_server_dba: "SQL Server DBA",
  // SAP Expanded
  sap_abap: "SAP ABAP Developer",
  sap_fico: "SAP FICO Consultant",
  sap_mm: "SAP MM Consultant",
  sap_hana: "SAP HANA Developer",
  sap_bw: "SAP BW Consultant",
  // Data & Analytics
  tableau_developer: "Tableau Developer",
  informatica_developer: "Informatica Developer",
  snowflake_engineer: "Snowflake Engineer",
  databricks_engineer: "Databricks Engineer",
  // Infrastructure
  network_engineer: "Network Engineer",
  linux_admin: "Linux Administrator",
  // Design
  ui_ux_designer: "UI/UX Designer",
  // Testing
  selenium_tester: "Selenium Tester",
  automation_tester: "Automation Test Engineer",
  // Marketing & Business
  digital_marketer: "Digital Marketer",
  seo_specialist: "SEO Specialist",
  scrum_master: "Scrum Master",
  product_manager: "Product Manager",
  business_analyst: "Business Analyst",
};

export const EXPERIENCE_DISPLAY_NAMES: Record<ExperienceLevel, string> = {
  "0-1": "Fresher (0-1 years)",
  "1-3": "Junior (1-3 years)",
  "3-5": "Mid-Level (3-5 years)",
  "5+": "Senior (5+ years)",
};

export const INTERVIEW_TYPE_DISPLAY_NAMES: Record<InterviewType, string> = {
  technical: "Technical Interview",
  hr: "HR Interview",
  behavioral: "Behavioral Interview",
};

// PDF Upload Types
export interface PdfParseResponse {
  success: boolean;
  questions: Question[];
  totalExtracted: number;
  error?: string;
}

export interface CreateInterviewFromPdfRequest {
  role: InterviewRole;
  experienceLevel: ExperienceLevel;
  customQuestions: Question[];
}
