// Comprehensive Learning Paths with 191 IT Courses
// Each role has a structured learning path with phases

export interface LearningTopic {
  id: string;
  name: string;
  category: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedHours: number;
  prerequisites?: string[];
  description: string;
}

export interface LearningPhase {
  phase: number;
  name: string;
  description: string;
  topics: LearningTopic[];
}

export interface LearningPath {
  roleId: string;
  roleName: string;
  icon: string;
  description: string;
  totalTopics: number;
  estimatedWeeks: number;
  phases: LearningPhase[];
}

export interface RoleTechStack {
  roleId: string;
  roleName: string;
  categories: {
    name: string;
    topics: string[];
  }[];
}

// Extended Role Types
export type ExtendedRole =
  | "frontend"
  | "backend"
  | "fullstack"
  | "data_engineer"
  | "data_analyst"
  | "data_scientist"
  | "ml_engineer"
  | "ai_engineer"
  | "devops"
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
  | "blockchain_dev";

// Role Display Names (Extended)
export const EXTENDED_ROLE_NAMES: Record<ExtendedRole, string> = {
  frontend: "Frontend Developer",
  backend: "Backend Developer",
  fullstack: "Full Stack Developer",
  data_engineer: "Data Engineer",
  data_analyst: "Data Analyst",
  data_scientist: "Data Scientist",
  ml_engineer: "ML Engineer",
  ai_engineer: "AI/LLM Engineer",
  devops: "DevOps Engineer",
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
};

// Complete Tech Stack per Role (from 191 courses)
export const ROLE_TECH_STACKS: RoleTechStack[] = [
  {
    roleId: "frontend",
    roleName: "Frontend Developer",
    categories: [
      {
        name: "Core Languages",
        topics: ["HTML5", "CSS3", "JavaScript", "TypeScript"],
      },
      {
        name: "Frameworks",
        topics: ["React", "Angular", "Vue", "Next.js"],
      },
      {
        name: "State & Architecture",
        topics: ["State Management", "UI Architecture", "Design Patterns"],
      },
      {
        name: "Performance",
        topics: ["Web Performance Optimization", "Progressive Web Apps"],
      },
      {
        name: "Testing",
        topics: ["Frontend Testing", "Cypress", "Playwright"],
      },
      {
        name: "Foundations",
        topics: ["Data Structures & Algorithms", "OOPS", "System Design"],
      },
    ],
  },
  {
    roleId: "backend",
    roleName: "Backend Developer",
    categories: [
      {
        name: "Languages",
        topics: ["Python", "Java", "Go", "C#", "Node.js", "Rust"],
      },
      {
        name: "Frameworks",
        topics: ["Spring Boot", "Django", "FastAPI", "ASP.NET Core", "Express.js"],
      },
      {
        name: "APIs",
        topics: ["REST API Development", "GraphQL", "gRPC"],
      },
      {
        name: "Architecture",
        topics: ["Microservices", "Event-Driven Architecture", "Distributed Systems", "Design Patterns"],
      },
      {
        name: "Databases",
        topics: ["PostgreSQL", "MySQL", "MongoDB", "Redis", "Cassandra"],
      },
      {
        name: "Foundations",
        topics: ["Data Structures & Algorithms", "System Design", "Operating Systems", "Computer Networks"],
      },
    ],
  },
  {
    roleId: "fullstack",
    roleName: "Full Stack Developer",
    categories: [
      {
        name: "Frontend Stack",
        topics: ["React", "Next.js", "TypeScript", "Vue", "Angular"],
      },
      {
        name: "Backend Stack",
        topics: ["Node.js", "Python", "Spring Boot", "Django", "FastAPI"],
      },
      {
        name: "Full Stack Frameworks",
        topics: ["MERN", "MEAN", "Java Full Stack", "Python Full Stack", ".NET Full Stack"],
      },
      {
        name: "Databases",
        topics: ["PostgreSQL", "MongoDB", "MySQL", "Redis"],
      },
      {
        name: "DevOps Basics",
        topics: ["Docker", "Git", "CI/CD", "AWS"],
      },
      {
        name: "Foundations",
        topics: ["Data Structures & Algorithms", "System Design", "OOPS", "Design Patterns"],
      },
    ],
  },
  {
    roleId: "data_engineer",
    roleName: "Data Engineer",
    categories: [
      {
        name: "Languages",
        topics: ["Python", "SQL Advanced", "Scala", "Java"],
      },
      {
        name: "Big Data",
        topics: ["Apache Spark", "Hadoop", "Kafka", "Airflow"],
      },
      {
        name: "Data Warehousing",
        topics: ["Snowflake", "Databricks", "BigQuery", "Redshift"],
      },
      {
        name: "ETL/ELT",
        topics: ["ETL / ELT", "Data Modeling", "AWS Glue", "Azure Data Factory"],
      },
      {
        name: "Streaming",
        topics: ["Streaming Data Engineering", "Kafka", "Apache Spark"],
      },
      {
        name: "Foundations",
        topics: ["Data Structures & Algorithms", "System Design", "Distributed Systems"],
      },
    ],
  },
  {
    roleId: "data_analyst",
    roleName: "Data Analyst",
    categories: [
      {
        name: "Core Skills",
        topics: ["Data Analytics", "SQL Advanced", "Advanced Excel", "Statistics"],
      },
      {
        name: "BI Tools",
        topics: ["Tableau", "Power BI", "Looker", "Qlik"],
      },
      {
        name: "Programming",
        topics: ["Python", "R", "Pandas"],
      },
      {
        name: "Enterprise BI",
        topics: ["SAP BusinessObjects", "SAP Analytics Cloud", "IBM Cognos", "Oracle OBIEE"],
      },
      {
        name: "Visualization",
        topics: ["MicroStrategy", "TIBCO Spotfire", "Business Intelligence"],
      },
    ],
  },
  {
    roleId: "data_scientist",
    roleName: "Data Scientist",
    categories: [
      {
        name: "Programming",
        topics: ["Python", "R", "SQL Advanced"],
      },
      {
        name: "ML Fundamentals",
        topics: ["Machine Learning", "Statistics", "Deep Learning"],
      },
      {
        name: "Specialized ML",
        topics: ["NLP", "Computer Vision", "Reinforcement Learning"],
      },
      {
        name: "Tools & Frameworks",
        topics: ["Pandas", "Scikit-learn", "TensorFlow", "PyTorch"],
      },
      {
        name: "Data Engineering",
        topics: ["Data Modeling", "Apache Spark", "Data Warehousing"],
      },
      {
        name: "Visualization",
        topics: ["Tableau", "Power BI", "Data Analytics"],
      },
    ],
  },
  {
    roleId: "ml_engineer",
    roleName: "ML Engineer",
    categories: [
      {
        name: "ML Core",
        topics: ["Machine Learning", "Deep Learning", "NLP", "Computer Vision"],
      },
      {
        name: "MLOps",
        topics: ["MLOps", "AI Deployment", "Docker", "Kubernetes"],
      },
      {
        name: "Frameworks",
        topics: ["TensorFlow", "PyTorch", "Scikit-learn"],
      },
      {
        name: "Programming",
        topics: ["Python", "SQL Advanced", "Scala"],
      },
      {
        name: "Infrastructure",
        topics: ["AWS", "Google Cloud", "Apache Spark", "Kafka"],
      },
      {
        name: "Foundations",
        topics: ["Data Structures & Algorithms", "System Design", "Distributed Systems"],
      },
    ],
  },
  {
    roleId: "ai_engineer",
    roleName: "AI/LLM Engineer",
    categories: [
      {
        name: "AI/ML Core",
        topics: ["Machine Learning", "Deep Learning", "NLP"],
      },
      {
        name: "Generative AI",
        topics: ["Generative AI", "LLM Engineering", "Prompt Engineering"],
      },
      {
        name: "RAG & Agents",
        topics: ["RAG", "Agentic AI", "Multi-Agent Systems", "LangChain", "CrewAI"],
      },
      {
        name: "Deployment",
        topics: ["AI Deployment", "MLOps", "AI Governance"],
      },
      {
        name: "Programming",
        topics: ["Python", "TypeScript", "FastAPI"],
      },
      {
        name: "Infrastructure",
        topics: ["Docker", "Kubernetes", "AWS", "Vector Databases"],
      },
    ],
  },
  {
    roleId: "devops",
    roleName: "DevOps Engineer",
    categories: [
      {
        name: "Containerization",
        topics: ["Docker", "Kubernetes", "Helm"],
      },
      {
        name: "IaC & Config",
        topics: ["Terraform", "Ansible", "CloudFormation"],
      },
      {
        name: "CI/CD",
        topics: ["Jenkins", "GitHub Actions", "CI/CD"],
      },
      {
        name: "Observability",
        topics: ["Observability (Prometheus, Grafana)", "Site Reliability Engineering"],
      },
      {
        name: "Cloud Platforms",
        topics: ["AWS", "Microsoft Azure", "Google Cloud"],
      },
      {
        name: "Scripting",
        topics: ["Shell Scripting", "Python", "PowerShell", "Linux"],
      },
      {
        name: "Foundations",
        topics: ["Operating Systems", "Computer Networks", "System Design"],
      },
    ],
  },
  {
    roleId: "cloud_engineer",
    roleName: "Cloud Engineer",
    categories: [
      {
        name: "Cloud Platforms",
        topics: ["AWS", "Microsoft Azure", "Google Cloud"],
      },
      {
        name: "Architecture",
        topics: ["Cloud Architecture", "Multi-Cloud Strategy", "Serverless"],
      },
      {
        name: "Security",
        topics: ["Cloud Security", "Zero Trust Architecture"],
      },
      {
        name: "Containers",
        topics: ["Docker", "Kubernetes", "Terraform"],
      },
      {
        name: "Cost Management",
        topics: ["FinOps", "Cloud Architecture"],
      },
      {
        name: "Foundations",
        topics: ["Computer Networks", "Operating Systems", "System Design"],
      },
    ],
  },
  {
    roleId: "sre",
    roleName: "Site Reliability Engineer",
    categories: [
      {
        name: "SRE Core",
        topics: ["Site Reliability Engineering", "Platform Engineering"],
      },
      {
        name: "Observability",
        topics: ["Observability (Prometheus, Grafana)", "SIEM (Splunk, QRadar)"],
      },
      {
        name: "Infrastructure",
        topics: ["Kubernetes", "Docker", "Terraform"],
      },
      {
        name: "Programming",
        topics: ["Python", "Go", "Shell Scripting"],
      },
      {
        name: "Cloud",
        topics: ["AWS", "Google Cloud", "Microsoft Azure"],
      },
      {
        name: "Foundations",
        topics: ["Operating Systems", "Computer Networks", "Distributed Systems"],
      },
    ],
  },
  {
    roleId: "mobile_android",
    roleName: "Android Developer",
    categories: [
      {
        name: "Core",
        topics: ["Android (Kotlin)", "Kotlin", "Java"],
      },
      {
        name: "Architecture",
        topics: ["Mobile Architecture", "Design Patterns", "OOPS"],
      },
      {
        name: "Backend Integration",
        topics: ["REST API Development", "GraphQL", "Firebase"],
      },
      {
        name: "Testing",
        topics: ["Appium", "Mobile App Security", "Testing & QA"],
      },
      {
        name: "Foundations",
        topics: ["Data Structures & Algorithms", "System Design"],
      },
    ],
  },
  {
    roleId: "mobile_ios",
    roleName: "iOS Developer",
    categories: [
      {
        name: "Core",
        topics: ["iOS (Swift)", "Swift", "Objective-C"],
      },
      {
        name: "Architecture",
        topics: ["Mobile Architecture", "Design Patterns", "OOPS"],
      },
      {
        name: "Backend Integration",
        topics: ["REST API Development", "GraphQL", "Firebase"],
      },
      {
        name: "Testing",
        topics: ["Appium", "Mobile App Security", "Testing & QA"],
      },
      {
        name: "Foundations",
        topics: ["Data Structures & Algorithms", "System Design"],
      },
    ],
  },
  {
    roleId: "mobile_cross",
    roleName: "Cross-Platform Mobile Developer",
    categories: [
      {
        name: "Frameworks",
        topics: ["React Native", "Flutter", "Dart"],
      },
      {
        name: "Web Technologies",
        topics: ["TypeScript", "JavaScript", "React"],
      },
      {
        name: "Architecture",
        topics: ["Mobile Architecture", "Design Patterns", "State Management"],
      },
      {
        name: "Backend",
        topics: ["REST API Development", "GraphQL", "Firebase"],
      },
      {
        name: "Testing",
        topics: ["Appium", "Cypress", "Mobile App Security"],
      },
      {
        name: "Foundations",
        topics: ["Data Structures & Algorithms", "OOPS"],
      },
    ],
  },
  {
    roleId: "security_engineer",
    roleName: "Security Engineer",
    categories: [
      {
        name: "Offensive Security",
        topics: ["Ethical Hacking", "Penetration Testing"],
      },
      {
        name: "Defensive Security",
        topics: ["SOC Analyst", "SIEM (Splunk, QRadar)", "Zero Trust Architecture"],
      },
      {
        name: "Application Security",
        topics: ["Application Security", "DevSecOps", "Cloud Security (Cyber)"],
      },
      {
        name: "Network Security",
        topics: ["Network Security", "Computer Networks"],
      },
      {
        name: "Certifications",
        topics: ["CISSP", "CEH"],
      },
      {
        name: "Foundations",
        topics: ["Operating Systems", "Python", "Shell Scripting"],
      },
    ],
  },
  {
    roleId: "qa_engineer",
    roleName: "QA/Test Engineer",
    categories: [
      {
        name: "Manual Testing",
        topics: ["Manual Testing", "Testing & QA"],
      },
      {
        name: "Automation - Web",
        topics: ["Selenium", "Cypress", "Playwright"],
      },
      {
        name: "Automation - Mobile",
        topics: ["Appium"],
      },
      {
        name: "Performance",
        topics: ["JMeter", "LoadRunner", "Performance Testing"],
      },
      {
        name: "API Testing",
        topics: ["API Testing", "REST API Development"],
      },
      {
        name: "Tools & Process",
        topics: ["Jira", "Git & Version Control", "Agile & Scrum"],
      },
    ],
  },
  {
    roleId: "sap_consultant",
    roleName: "SAP Consultant",
    categories: [
      {
        name: "SAP Core Modules",
        topics: ["SAP FICO", "SAP MM", "SAP SD", "SAP PP"],
      },
      {
        name: "SAP Technical",
        topics: ["SAP ABAP", "SAP HANA", "SAP Basis"],
      },
      {
        name: "SAP Cloud",
        topics: ["SAP SuccessFactors", "SAP Ariba", "SAP Analytics Cloud"],
      },
      {
        name: "SAP Logistics",
        topics: ["SAP EWM"],
      },
      {
        name: "Business Intelligence",
        topics: ["SAP BusinessObjects", "Business Intelligence"],
      },
    ],
  },
  {
    roleId: "salesforce_dev",
    roleName: "Salesforce Developer",
    categories: [
      {
        name: "Salesforce Core",
        topics: ["Salesforce Admin", "Salesforce Developer", "Salesforce Lightning"],
      },
      {
        name: "Salesforce Products",
        topics: ["Salesforce CPQ", "Salesforce Marketing Cloud"],
      },
      {
        name: "CRM Alternatives",
        topics: ["Microsoft Dynamics CRM", "Zoho CRM"],
      },
      {
        name: "Programming",
        topics: ["JavaScript", "REST API Development"],
      },
    ],
  },
  {
    roleId: "rpa_developer",
    roleName: "RPA Developer",
    categories: [
      {
        name: "RPA Platforms",
        topics: ["UiPath", "Automation Anywhere", "Blue Prism"],
      },
      {
        name: "Microsoft Automation",
        topics: ["Power Automate"],
      },
      {
        name: "Programming",
        topics: ["Python", "C#", "JavaScript"],
      },
      {
        name: "Process",
        topics: ["ITIL", "Agile & Scrum"],
      },
    ],
  },
  {
    roleId: "blockchain_dev",
    roleName: "Blockchain Developer",
    categories: [
      {
        name: "Blockchain Core",
        topics: ["Blockchain", "Web3"],
      },
      {
        name: "Programming",
        topics: ["JavaScript", "TypeScript", "Rust", "Go"],
      },
      {
        name: "Security",
        topics: ["Security Best Practices", "Application Security"],
      },
      {
        name: "Foundations",
        topics: ["Data Structures & Algorithms", "Distributed Systems", "Computer Networks"],
      },
    ],
  },
];

// Learning Paths with Phases (Beginner → Intermediate → Advanced)
export const LEARNING_PATHS: LearningPath[] = [
  {
    roleId: "frontend",
    roleName: "Frontend Developer",
    icon: "🎨",
    description: "Build beautiful, responsive, and performant web interfaces",
    totalTopics: 22,
    estimatedWeeks: 24,
    phases: [
      {
        phase: 1,
        name: "Foundation",
        description: "Master the core web technologies",
        topics: [
          { id: "html5", name: "HTML5", category: "Core", difficulty: "beginner", estimatedHours: 20, description: "Semantic HTML, accessibility, forms" },
          { id: "css3", name: "CSS3", category: "Core", difficulty: "beginner", estimatedHours: 30, description: "Flexbox, Grid, animations, responsive design" },
          { id: "js", name: "JavaScript", category: "Core", difficulty: "beginner", estimatedHours: 50, description: "ES6+, DOM manipulation, async programming" },
          { id: "git", name: "Git & Version Control", category: "Tools", difficulty: "beginner", estimatedHours: 10, description: "Version control fundamentals" },
          { id: "dsa", name: "Data Structures & Algorithms", category: "Foundations", difficulty: "beginner", estimatedHours: 40, description: "Arrays, strings, basic algorithms" },
        ],
      },
      {
        phase: 2,
        name: "Framework Mastery",
        description: "Learn modern frontend frameworks",
        topics: [
          { id: "ts", name: "TypeScript", category: "Language", difficulty: "intermediate", estimatedHours: 30, prerequisites: ["js"], description: "Type safety, interfaces, generics" },
          { id: "react", name: "React", category: "Framework", difficulty: "intermediate", estimatedHours: 50, prerequisites: ["js", "ts"], description: "Components, hooks, context, state management" },
          { id: "nextjs", name: "Next.js", category: "Framework", difficulty: "intermediate", estimatedHours: 40, prerequisites: ["react"], description: "SSR, SSG, App Router, API routes" },
          { id: "state", name: "State Management", category: "Architecture", difficulty: "intermediate", estimatedHours: 25, prerequisites: ["react"], description: "Redux, Zustand, Context patterns" },
          { id: "testing", name: "Frontend Testing", category: "Quality", difficulty: "intermediate", estimatedHours: 30, prerequisites: ["react"], description: "Jest, React Testing Library, E2E testing" },
        ],
      },
      {
        phase: 3,
        name: "Advanced & Performance",
        description: "Optimize and architect large-scale applications",
        topics: [
          { id: "perf", name: "Web Performance Optimization", category: "Performance", difficulty: "advanced", estimatedHours: 30, prerequisites: ["react", "nextjs"], description: "Core Web Vitals, lazy loading, caching" },
          { id: "pwa", name: "Progressive Web Apps", category: "Advanced", difficulty: "advanced", estimatedHours: 25, prerequisites: ["react"], description: "Service workers, offline support, push notifications" },
          { id: "ui-arch", name: "UI Architecture", category: "Architecture", difficulty: "advanced", estimatedHours: 35, prerequisites: ["react", "state"], description: "Component patterns, design systems, micro-frontends" },
          { id: "design-patterns", name: "Design Patterns", category: "Foundations", difficulty: "advanced", estimatedHours: 30, description: "Frontend design patterns and best practices" },
          { id: "system-design", name: "System Design", category: "Foundations", difficulty: "advanced", estimatedHours: 40, description: "Frontend system design for interviews" },
        ],
      },
    ],
  },
  {
    roleId: "backend",
    roleName: "Backend Developer",
    icon: "⚙️",
    description: "Build scalable, secure, and efficient server-side applications",
    totalTopics: 26,
    estimatedWeeks: 28,
    phases: [
      {
        phase: 1,
        name: "Foundation",
        description: "Core programming and database fundamentals",
        topics: [
          { id: "python", name: "Python", category: "Language", difficulty: "beginner", estimatedHours: 40, description: "Python fundamentals, OOP, file handling" },
          { id: "sql", name: "SQL Advanced", category: "Database", difficulty: "beginner", estimatedHours: 30, description: "Complex queries, joins, optimization" },
          { id: "dsa", name: "Data Structures & Algorithms", category: "Foundations", difficulty: "beginner", estimatedHours: 60, description: "Essential DSA for backend developers" },
          { id: "oops", name: "OOPS", category: "Foundations", difficulty: "beginner", estimatedHours: 20, description: "Object-oriented programming principles" },
          { id: "git", name: "Git & Version Control", category: "Tools", difficulty: "beginner", estimatedHours: 10, description: "Version control and collaboration" },
        ],
      },
      {
        phase: 2,
        name: "Framework & APIs",
        description: "Build production-ready APIs",
        topics: [
          { id: "nodejs", name: "Node.js", category: "Runtime", difficulty: "intermediate", estimatedHours: 40, description: "Event loop, streams, async patterns" },
          { id: "fastapi", name: "FastAPI", category: "Framework", difficulty: "intermediate", estimatedHours: 35, prerequisites: ["python"], description: "Modern Python API framework" },
          { id: "springboot", name: "Spring Boot", category: "Framework", difficulty: "intermediate", estimatedHours: 50, description: "Java enterprise framework" },
          { id: "rest", name: "REST API Development", category: "APIs", difficulty: "intermediate", estimatedHours: 25, description: "RESTful design principles and implementation" },
          { id: "graphql", name: "GraphQL", category: "APIs", difficulty: "intermediate", estimatedHours: 25, prerequisites: ["rest"], description: "Query language for APIs" },
          { id: "postgres", name: "PostgreSQL", category: "Database", difficulty: "intermediate", estimatedHours: 30, prerequisites: ["sql"], description: "Advanced PostgreSQL features" },
          { id: "mongodb", name: "MongoDB", category: "Database", difficulty: "intermediate", estimatedHours: 25, description: "NoSQL document database" },
        ],
      },
      {
        phase: 3,
        name: "Architecture & Scale",
        description: "Design systems that scale",
        topics: [
          { id: "microservices", name: "Microservices", category: "Architecture", difficulty: "advanced", estimatedHours: 40, prerequisites: ["rest", "nodejs"], description: "Microservices patterns and implementation" },
          { id: "distributed", name: "Distributed Systems", category: "Architecture", difficulty: "advanced", estimatedHours: 50, description: "CAP theorem, consensus, distributed patterns" },
          { id: "event-driven", name: "Event-Driven Architecture", category: "Architecture", difficulty: "advanced", estimatedHours: 35, prerequisites: ["microservices"], description: "Event sourcing, CQRS, message queues" },
          { id: "redis", name: "Redis", category: "Database", difficulty: "advanced", estimatedHours: 20, description: "Caching, pub/sub, data structures" },
          { id: "grpc", name: "gRPC", category: "APIs", difficulty: "advanced", estimatedHours: 20, prerequisites: ["rest"], description: "High-performance RPC framework" },
          { id: "system-design", name: "System Design", category: "Foundations", difficulty: "advanced", estimatedHours: 50, description: "Design scalable distributed systems" },
          { id: "design-patterns", name: "Design Patterns", category: "Foundations", difficulty: "advanced", estimatedHours: 30, description: "GOF patterns, architectural patterns" },
        ],
      },
    ],
  },
  {
    roleId: "data_engineer",
    roleName: "Data Engineer",
    icon: "🔧",
    description: "Build robust data pipelines and infrastructure",
    totalTopics: 20,
    estimatedWeeks: 26,
    phases: [
      {
        phase: 1,
        name: "Foundation",
        description: "Core programming and SQL mastery",
        topics: [
          { id: "python", name: "Python", category: "Language", difficulty: "beginner", estimatedHours: 40, description: "Python for data engineering" },
          { id: "sql", name: "SQL Advanced", category: "Database", difficulty: "beginner", estimatedHours: 40, description: "Complex queries, window functions, CTEs" },
          { id: "data-modeling", name: "Data Modeling", category: "Core", difficulty: "beginner", estimatedHours: 30, description: "Dimensional modeling, star schema" },
          { id: "linux", name: "Shell Scripting", category: "Tools", difficulty: "beginner", estimatedHours: 20, description: "Bash scripting for automation" },
        ],
      },
      {
        phase: 2,
        name: "Big Data Tools",
        description: "Master distributed data processing",
        topics: [
          { id: "spark", name: "Apache Spark", category: "Big Data", difficulty: "intermediate", estimatedHours: 50, prerequisites: ["python", "sql"], description: "Distributed data processing" },
          { id: "kafka", name: "Kafka", category: "Streaming", difficulty: "intermediate", estimatedHours: 35, description: "Event streaming platform" },
          { id: "airflow", name: "Airflow", category: "Orchestration", difficulty: "intermediate", estimatedHours: 30, prerequisites: ["python"], description: "Workflow orchestration" },
          { id: "etl", name: "ETL / ELT", category: "Core", difficulty: "intermediate", estimatedHours: 35, prerequisites: ["sql", "python"], description: "Data transformation patterns" },
          { id: "hadoop", name: "Hadoop", category: "Big Data", difficulty: "intermediate", estimatedHours: 30, description: "Hadoop ecosystem fundamentals" },
        ],
      },
      {
        phase: 3,
        name: "Cloud & Warehousing",
        description: "Modern cloud data platforms",
        topics: [
          { id: "snowflake", name: "Snowflake", category: "Warehouse", difficulty: "advanced", estimatedHours: 35, prerequisites: ["sql"], description: "Cloud data warehouse" },
          { id: "databricks", name: "Databricks", category: "Platform", difficulty: "advanced", estimatedHours: 40, prerequisites: ["spark"], description: "Unified analytics platform" },
          { id: "bigquery", name: "BigQuery", category: "Warehouse", difficulty: "advanced", estimatedHours: 30, prerequisites: ["sql"], description: "Google's serverless data warehouse" },
          { id: "aws-glue", name: "AWS Glue", category: "Cloud", difficulty: "advanced", estimatedHours: 25, prerequisites: ["etl"], description: "Serverless ETL service" },
          { id: "streaming", name: "Streaming Data Engineering", category: "Advanced", difficulty: "advanced", estimatedHours: 40, prerequisites: ["kafka", "spark"], description: "Real-time data pipelines" },
          { id: "system-design", name: "System Design", category: "Foundations", difficulty: "advanced", estimatedHours: 40, description: "Data system architecture" },
        ],
      },
    ],
  },
  {
    roleId: "ai_engineer",
    roleName: "AI/LLM Engineer",
    icon: "🤖",
    description: "Build intelligent AI systems and LLM applications",
    totalTopics: 18,
    estimatedWeeks: 24,
    phases: [
      {
        phase: 1,
        name: "ML Foundation",
        description: "Core machine learning and deep learning",
        topics: [
          { id: "python", name: "Python", category: "Language", difficulty: "beginner", estimatedHours: 30, description: "Python for AI/ML" },
          { id: "ml", name: "Machine Learning", category: "Core", difficulty: "beginner", estimatedHours: 50, description: "ML fundamentals, algorithms, evaluation" },
          { id: "dl", name: "Deep Learning", category: "Core", difficulty: "intermediate", estimatedHours: 50, prerequisites: ["ml"], description: "Neural networks, CNNs, RNNs" },
          { id: "nlp", name: "NLP", category: "Specialization", difficulty: "intermediate", estimatedHours: 40, prerequisites: ["dl"], description: "Text processing, transformers" },
        ],
      },
      {
        phase: 2,
        name: "Generative AI",
        description: "LLMs and generative models",
        topics: [
          { id: "genai", name: "Generative AI", category: "Core", difficulty: "intermediate", estimatedHours: 35, prerequisites: ["dl", "nlp"], description: "Generative models, diffusion, GANs" },
          { id: "llm", name: "LLM Engineering", category: "Core", difficulty: "intermediate", estimatedHours: 40, prerequisites: ["genai"], description: "Working with large language models" },
          { id: "prompt", name: "Prompt Engineering", category: "Skills", difficulty: "intermediate", estimatedHours: 20, prerequisites: ["llm"], description: "Effective prompt design" },
          { id: "langchain", name: "LangChain", category: "Framework", difficulty: "intermediate", estimatedHours: 30, prerequisites: ["llm"], description: "LLM application framework" },
        ],
      },
      {
        phase: 3,
        name: "Advanced AI Systems",
        description: "Build production AI systems",
        topics: [
          { id: "rag", name: "RAG", category: "Architecture", difficulty: "advanced", estimatedHours: 35, prerequisites: ["llm", "langchain"], description: "Retrieval augmented generation" },
          { id: "agentic", name: "Agentic AI", category: "Advanced", difficulty: "advanced", estimatedHours: 40, prerequisites: ["rag"], description: "Autonomous AI agents" },
          { id: "multi-agent", name: "Multi-Agent Systems", category: "Advanced", difficulty: "advanced", estimatedHours: 35, prerequisites: ["agentic"], description: "Collaborative AI systems" },
          { id: "crewai", name: "CrewAI", category: "Framework", difficulty: "advanced", estimatedHours: 25, prerequisites: ["agentic"], description: "Multi-agent framework" },
          { id: "mlops", name: "MLOps", category: "Operations", difficulty: "advanced", estimatedHours: 35, prerequisites: ["ml"], description: "ML model deployment and monitoring" },
          { id: "governance", name: "AI Governance", category: "Operations", difficulty: "advanced", estimatedHours: 20, description: "Responsible AI, ethics, compliance" },
        ],
      },
    ],
  },
  {
    roleId: "devops",
    roleName: "DevOps Engineer",
    icon: "🚀",
    description: "Automate, deploy, and scale infrastructure",
    totalTopics: 20,
    estimatedWeeks: 24,
    phases: [
      {
        phase: 1,
        name: "Foundation",
        description: "Linux, scripting, and version control",
        topics: [
          { id: "linux", name: "Operating Systems", category: "Core", difficulty: "beginner", estimatedHours: 40, description: "Linux administration, processes, networking" },
          { id: "shell", name: "Shell Scripting", category: "Scripting", difficulty: "beginner", estimatedHours: 25, description: "Bash scripting for automation" },
          { id: "python", name: "Python", category: "Scripting", difficulty: "beginner", estimatedHours: 30, description: "Python for DevOps automation" },
          { id: "git", name: "Git", category: "Tools", difficulty: "beginner", estimatedHours: 15, description: "Advanced Git workflows" },
          { id: "networking", name: "Computer Networks", category: "Core", difficulty: "beginner", estimatedHours: 30, description: "TCP/IP, DNS, load balancing" },
        ],
      },
      {
        phase: 2,
        name: "Containers & CI/CD",
        description: "Containerization and automation",
        topics: [
          { id: "docker", name: "Docker", category: "Containers", difficulty: "intermediate", estimatedHours: 35, description: "Containerization fundamentals" },
          { id: "k8s", name: "Kubernetes", category: "Orchestration", difficulty: "intermediate", estimatedHours: 50, prerequisites: ["docker"], description: "Container orchestration" },
          { id: "helm", name: "Helm", category: "Orchestration", difficulty: "intermediate", estimatedHours: 20, prerequisites: ["k8s"], description: "Kubernetes package manager" },
          { id: "jenkins", name: "Jenkins", category: "CI/CD", difficulty: "intermediate", estimatedHours: 25, description: "CI/CD pipelines" },
          { id: "github-actions", name: "GitHub Actions", category: "CI/CD", difficulty: "intermediate", estimatedHours: 20, description: "GitHub native CI/CD" },
          { id: "cicd", name: "CI/CD", category: "Practice", difficulty: "intermediate", estimatedHours: 30, description: "CI/CD best practices and patterns" },
        ],
      },
      {
        phase: 3,
        name: "IaC & Cloud",
        description: "Infrastructure as code and cloud platforms",
        topics: [
          { id: "terraform", name: "Terraform", category: "IaC", difficulty: "advanced", estimatedHours: 40, description: "Infrastructure as code" },
          { id: "ansible", name: "Ansible", category: "Config", difficulty: "advanced", estimatedHours: 30, description: "Configuration management" },
          { id: "aws", name: "AWS", category: "Cloud", difficulty: "advanced", estimatedHours: 50, description: "Amazon Web Services" },
          { id: "observability", name: "Observability (Prometheus, Grafana)", category: "Monitoring", difficulty: "advanced", estimatedHours: 35, description: "Monitoring and alerting" },
          { id: "sre", name: "Site Reliability Engineering", category: "Practice", difficulty: "advanced", estimatedHours: 40, description: "SRE principles and practices" },
        ],
      },
    ],
  },
  {
    roleId: "security_engineer",
    roleName: "Security Engineer",
    icon: "🔐",
    description: "Protect systems and data from cyber threats",
    totalTopics: 16,
    estimatedWeeks: 22,
    phases: [
      {
        phase: 1,
        name: "Foundation",
        description: "Security fundamentals and networking",
        topics: [
          { id: "networking", name: "Computer Networks", category: "Core", difficulty: "beginner", estimatedHours: 40, description: "Network protocols and security" },
          { id: "os", name: "Operating Systems", category: "Core", difficulty: "beginner", estimatedHours: 35, description: "OS security, hardening" },
          { id: "python", name: "Python", category: "Scripting", difficulty: "beginner", estimatedHours: 30, description: "Python for security automation" },
          { id: "shell", name: "Shell Scripting", category: "Scripting", difficulty: "beginner", estimatedHours: 20, description: "Security scripting" },
        ],
      },
      {
        phase: 2,
        name: "Offensive & Defensive",
        description: "Attack and defense techniques",
        topics: [
          { id: "ethical-hacking", name: "Ethical Hacking", category: "Offensive", difficulty: "intermediate", estimatedHours: 50, description: "Penetration testing fundamentals" },
          { id: "pentest", name: "Penetration Testing", category: "Offensive", difficulty: "intermediate", estimatedHours: 45, prerequisites: ["ethical-hacking"], description: "Advanced penetration testing" },
          { id: "soc", name: "SOC Analyst", category: "Defensive", difficulty: "intermediate", estimatedHours: 40, description: "Security operations center" },
          { id: "siem", name: "SIEM (Splunk, QRadar)", category: "Defensive", difficulty: "intermediate", estimatedHours: 35, prerequisites: ["soc"], description: "Security information and event management" },
          { id: "network-sec", name: "Network Security", category: "Defensive", difficulty: "intermediate", estimatedHours: 35, description: "Network security implementation" },
        ],
      },
      {
        phase: 3,
        name: "Advanced Security",
        description: "Specialized security domains",
        topics: [
          { id: "appsec", name: "Application Security", category: "Specialized", difficulty: "advanced", estimatedHours: 40, description: "Secure development practices" },
          { id: "cloudsec", name: "Cloud Security (Cyber)", category: "Specialized", difficulty: "advanced", estimatedHours: 40, description: "Cloud security architecture" },
          { id: "devsecops", name: "DevSecOps", category: "Practice", difficulty: "advanced", estimatedHours: 35, prerequisites: ["appsec"], description: "Security in CI/CD" },
          { id: "zero-trust", name: "Zero Trust Architecture", category: "Architecture", difficulty: "advanced", estimatedHours: 30, description: "Zero trust security model" },
          { id: "cissp", name: "CISSP", category: "Certification", difficulty: "advanced", estimatedHours: 60, description: "CISSP certification prep" },
        ],
      },
    ],
  },
  {
    roleId: "qa_engineer",
    roleName: "QA/Test Engineer",
    icon: "🧪",
    description: "Ensure software quality through comprehensive testing",
    totalTopics: 14,
    estimatedWeeks: 18,
    phases: [
      {
        phase: 1,
        name: "Foundation",
        description: "Testing fundamentals and manual testing",
        topics: [
          { id: "manual", name: "Manual Testing", category: "Core", difficulty: "beginner", estimatedHours: 35, description: "Test case design, bug reporting" },
          { id: "testing-qa", name: "Testing & QA", category: "Core", difficulty: "beginner", estimatedHours: 30, description: "QA methodologies and processes" },
          { id: "agile", name: "Agile & Scrum", category: "Process", difficulty: "beginner", estimatedHours: 20, description: "Agile testing practices" },
          { id: "git", name: "Git & Version Control", category: "Tools", difficulty: "beginner", estimatedHours: 15, description: "Version control for testers" },
        ],
      },
      {
        phase: 2,
        name: "Automation",
        description: "Test automation frameworks",
        topics: [
          { id: "selenium", name: "Selenium", category: "Automation", difficulty: "intermediate", estimatedHours: 40, description: "Web automation testing" },
          { id: "cypress", name: "Cypress", category: "Automation", difficulty: "intermediate", estimatedHours: 35, description: "Modern web testing framework" },
          { id: "playwright", name: "Playwright", category: "Automation", difficulty: "intermediate", estimatedHours: 30, description: "Cross-browser automation" },
          { id: "appium", name: "Appium", category: "Mobile", difficulty: "intermediate", estimatedHours: 35, description: "Mobile app testing" },
          { id: "api-testing", name: "API Testing", category: "Automation", difficulty: "intermediate", estimatedHours: 30, description: "REST API testing, Postman" },
        ],
      },
      {
        phase: 3,
        name: "Performance & Advanced",
        description: "Performance and specialized testing",
        topics: [
          { id: "jmeter", name: "JMeter", category: "Performance", difficulty: "advanced", estimatedHours: 35, description: "Performance testing tool" },
          { id: "loadrunner", name: "LoadRunner", category: "Performance", difficulty: "advanced", estimatedHours: 30, description: "Enterprise load testing" },
          { id: "perf-testing", name: "Performance Testing", category: "Practice", difficulty: "advanced", estimatedHours: 35, description: "Performance testing strategies" },
          { id: "jira", name: "Jira", category: "Tools", difficulty: "intermediate", estimatedHours: 15, description: "Test management with Jira" },
        ],
      },
    ],
  },
  {
    roleId: "fullstack",
    roleName: "Full Stack Developer",
    icon: "🔗",
    description: "Build complete web applications from frontend to backend",
    totalTopics: 24,
    estimatedWeeks: 30,
    phases: [
      {
        phase: 1,
        name: "Foundation",
        description: "Core web technologies and programming fundamentals",
        topics: [
          { id: "html5", name: "HTML5", category: "Frontend", difficulty: "beginner", estimatedHours: 20, description: "Semantic HTML, forms, accessibility" },
          { id: "css3", name: "CSS3", category: "Frontend", difficulty: "beginner", estimatedHours: 25, description: "Flexbox, Grid, responsive design" },
          { id: "js", name: "JavaScript", category: "Core", difficulty: "beginner", estimatedHours: 50, description: "ES6+, async/await, DOM manipulation" },
          { id: "ts", name: "TypeScript", category: "Core", difficulty: "beginner", estimatedHours: 30, prerequisites: ["js"], description: "Type safety for JavaScript" },
          { id: "dsa", name: "Data Structures & Algorithms", category: "Foundations", difficulty: "beginner", estimatedHours: 50, description: "Essential DSA for interviews" },
          { id: "git", name: "Git & Version Control", category: "Tools", difficulty: "beginner", estimatedHours: 15, description: "Version control fundamentals" },
        ],
      },
      {
        phase: 2,
        name: "Frontend Mastery",
        description: "Modern frontend frameworks and state management",
        topics: [
          { id: "react", name: "React", category: "Frontend", difficulty: "intermediate", estimatedHours: 50, prerequisites: ["js", "ts"], description: "Components, hooks, context" },
          { id: "nextjs", name: "Next.js", category: "Frontend", difficulty: "intermediate", estimatedHours: 40, prerequisites: ["react"], description: "SSR, SSG, App Router" },
          { id: "state", name: "State Management", category: "Frontend", difficulty: "intermediate", estimatedHours: 25, prerequisites: ["react"], description: "Redux, Zustand, Context" },
          { id: "testing-fe", name: "Frontend Testing", category: "Quality", difficulty: "intermediate", estimatedHours: 20, prerequisites: ["react"], description: "Jest, React Testing Library" },
        ],
      },
      {
        phase: 3,
        name: "Backend Development",
        description: "Server-side programming and databases",
        topics: [
          { id: "nodejs", name: "Node.js", category: "Backend", difficulty: "intermediate", estimatedHours: 40, prerequisites: ["js"], description: "Event loop, streams, async patterns" },
          { id: "express", name: "Express.js", category: "Backend", difficulty: "intermediate", estimatedHours: 25, prerequisites: ["nodejs"], description: "REST APIs, middleware, routing" },
          { id: "postgres", name: "PostgreSQL", category: "Database", difficulty: "intermediate", estimatedHours: 30, description: "SQL, joins, optimization" },
          { id: "mongodb", name: "MongoDB", category: "Database", difficulty: "intermediate", estimatedHours: 25, description: "NoSQL, aggregation, indexing" },
          { id: "rest", name: "REST API Development", category: "Backend", difficulty: "intermediate", estimatedHours: 25, description: "RESTful design principles" },
          { id: "auth", name: "Authentication & Authorization", category: "Security", difficulty: "intermediate", estimatedHours: 20, description: "JWT, OAuth, sessions" },
        ],
      },
      {
        phase: 4,
        name: "Full Stack & DevOps",
        description: "Integrate frontend and backend with deployment",
        topics: [
          { id: "mern", name: "MERN Stack", category: "Full Stack", difficulty: "advanced", estimatedHours: 40, prerequisites: ["react", "nodejs", "mongodb"], description: "Full MERN application development" },
          { id: "docker", name: "Docker", category: "DevOps", difficulty: "advanced", estimatedHours: 25, description: "Containerization basics" },
          { id: "cicd", name: "CI/CD", category: "DevOps", difficulty: "advanced", estimatedHours: 20, description: "GitHub Actions, deployment pipelines" },
          { id: "aws", name: "AWS Basics", category: "Cloud", difficulty: "advanced", estimatedHours: 30, description: "EC2, S3, RDS, deployment" },
          { id: "system-design", name: "System Design", category: "Foundations", difficulty: "advanced", estimatedHours: 40, description: "Design scalable web applications" },
          { id: "design-patterns", name: "Design Patterns", category: "Foundations", difficulty: "advanced", estimatedHours: 25, description: "Full stack design patterns" },
        ],
      },
    ],
  },
  {
    roleId: "data_analyst",
    roleName: "Data Analyst",
    icon: "📊",
    description: "Transform data into actionable business insights",
    totalTopics: 16,
    estimatedWeeks: 18,
    phases: [
      {
        phase: 1,
        name: "Foundation",
        description: "Core data analysis skills",
        topics: [
          { id: "excel", name: "Advanced Excel", category: "Tools", difficulty: "beginner", estimatedHours: 30, description: "Formulas, pivot tables, macros" },
          { id: "sql", name: "SQL", category: "Database", difficulty: "beginner", estimatedHours: 40, description: "Queries, joins, aggregations" },
          { id: "stats", name: "Statistics", category: "Foundations", difficulty: "beginner", estimatedHours: 35, description: "Descriptive & inferential statistics" },
          { id: "python", name: "Python for Data Analysis", category: "Language", difficulty: "beginner", estimatedHours: 40, description: "Pandas, NumPy basics" },
        ],
      },
      {
        phase: 2,
        name: "Visualization & BI",
        description: "Data visualization and business intelligence tools",
        topics: [
          { id: "tableau", name: "Tableau", category: "Visualization", difficulty: "intermediate", estimatedHours: 35, description: "Dashboards, calculated fields, LOD" },
          { id: "powerbi", name: "Power BI", category: "Visualization", difficulty: "intermediate", estimatedHours: 35, description: "DAX, Power Query, reports" },
          { id: "dataviz", name: "Data Visualization Best Practices", category: "Skills", difficulty: "intermediate", estimatedHours: 20, description: "Storytelling with data" },
          { id: "bi", name: "Business Intelligence", category: "Concepts", difficulty: "intermediate", estimatedHours: 25, description: "BI concepts and strategy" },
        ],
      },
      {
        phase: 3,
        name: "Advanced Analytics",
        description: "Advanced analysis techniques",
        topics: [
          { id: "python-adv", name: "Advanced Python Analytics", category: "Language", difficulty: "advanced", estimatedHours: 35, prerequisites: ["python"], description: "Matplotlib, Seaborn, advanced Pandas" },
          { id: "r", name: "R Programming", category: "Language", difficulty: "advanced", estimatedHours: 30, description: "R for statistical analysis" },
          { id: "sql-adv", name: "SQL Advanced", category: "Database", difficulty: "advanced", estimatedHours: 25, prerequisites: ["sql"], description: "Window functions, CTEs, optimization" },
          { id: "looker", name: "Looker", category: "Visualization", difficulty: "advanced", estimatedHours: 25, description: "Looker for enterprise BI" },
          { id: "ab-testing", name: "A/B Testing", category: "Skills", difficulty: "advanced", estimatedHours: 20, description: "Experiment design and analysis" },
          { id: "predictive", name: "Predictive Analytics", category: "Advanced", difficulty: "advanced", estimatedHours: 30, prerequisites: ["stats"], description: "Forecasting and predictive models" },
        ],
      },
    ],
  },
  {
    roleId: "data_scientist",
    roleName: "Data Scientist",
    icon: "🔬",
    description: "Build predictive models and extract insights from complex data",
    totalTopics: 18,
    estimatedWeeks: 26,
    phases: [
      {
        phase: 1,
        name: "Foundation",
        description: "Programming and statistics fundamentals",
        topics: [
          { id: "python", name: "Python", category: "Language", difficulty: "beginner", estimatedHours: 40, description: "Python for data science" },
          { id: "stats", name: "Statistics & Probability", category: "Foundations", difficulty: "beginner", estimatedHours: 45, description: "Statistical foundations for ML" },
          { id: "sql", name: "SQL", category: "Database", difficulty: "beginner", estimatedHours: 30, description: "Data extraction and manipulation" },
          { id: "pandas", name: "Pandas & NumPy", category: "Tools", difficulty: "beginner", estimatedHours: 35, prerequisites: ["python"], description: "Data manipulation libraries" },
        ],
      },
      {
        phase: 2,
        name: "Machine Learning",
        description: "Core machine learning algorithms",
        topics: [
          { id: "ml", name: "Machine Learning", category: "Core", difficulty: "intermediate", estimatedHours: 60, prerequisites: ["python", "stats"], description: "Supervised & unsupervised learning" },
          { id: "sklearn", name: "Scikit-learn", category: "Tools", difficulty: "intermediate", estimatedHours: 35, prerequisites: ["ml"], description: "ML implementation with sklearn" },
          { id: "feature-eng", name: "Feature Engineering", category: "Skills", difficulty: "intermediate", estimatedHours: 30, prerequisites: ["ml"], description: "Feature creation and selection" },
          { id: "viz", name: "Data Visualization", category: "Tools", difficulty: "intermediate", estimatedHours: 25, description: "Matplotlib, Seaborn, Plotly" },
          { id: "model-eval", name: "Model Evaluation", category: "Skills", difficulty: "intermediate", estimatedHours: 25, prerequisites: ["ml"], description: "Metrics, cross-validation, tuning" },
        ],
      },
      {
        phase: 3,
        name: "Deep Learning & Advanced",
        description: "Deep learning and specialized techniques",
        topics: [
          { id: "dl", name: "Deep Learning", category: "Advanced", difficulty: "advanced", estimatedHours: 50, prerequisites: ["ml"], description: "Neural networks, CNN, RNN" },
          { id: "tensorflow", name: "TensorFlow/PyTorch", category: "Tools", difficulty: "advanced", estimatedHours: 40, prerequisites: ["dl"], description: "Deep learning frameworks" },
          { id: "nlp", name: "NLP", category: "Specialization", difficulty: "advanced", estimatedHours: 40, prerequisites: ["dl"], description: "Text processing and analysis" },
          { id: "cv", name: "Computer Vision", category: "Specialization", difficulty: "advanced", estimatedHours: 35, prerequisites: ["dl"], description: "Image and video analysis" },
          { id: "time-series", name: "Time Series Analysis", category: "Specialization", difficulty: "advanced", estimatedHours: 30, prerequisites: ["ml"], description: "Forecasting and temporal data" },
          { id: "mlops", name: "MLOps Basics", category: "Operations", difficulty: "advanced", estimatedHours: 25, prerequisites: ["ml"], description: "Model deployment and monitoring" },
          { id: "system-design", name: "ML System Design", category: "Foundations", difficulty: "advanced", estimatedHours: 35, description: "Design ML systems" },
        ],
      },
    ],
  },
  {
    roleId: "ml_engineer",
    roleName: "ML Engineer",
    icon: "⚡",
    description: "Build and deploy production machine learning systems",
    totalTopics: 18,
    estimatedWeeks: 24,
    phases: [
      {
        phase: 1,
        name: "Foundation",
        description: "Strong programming and ML fundamentals",
        topics: [
          { id: "python", name: "Python", category: "Language", difficulty: "beginner", estimatedHours: 35, description: "Python for ML engineering" },
          { id: "ml", name: "Machine Learning", category: "Core", difficulty: "beginner", estimatedHours: 50, description: "ML algorithms and theory" },
          { id: "sql", name: "SQL", category: "Database", difficulty: "beginner", estimatedHours: 25, description: "Data extraction" },
          { id: "git", name: "Git & Version Control", category: "Tools", difficulty: "beginner", estimatedHours: 15, description: "Code versioning" },
        ],
      },
      {
        phase: 2,
        name: "ML Implementation",
        description: "Building and training models",
        topics: [
          { id: "dl", name: "Deep Learning", category: "Core", difficulty: "intermediate", estimatedHours: 50, prerequisites: ["ml"], description: "Neural network architectures" },
          { id: "pytorch", name: "PyTorch", category: "Framework", difficulty: "intermediate", estimatedHours: 40, prerequisites: ["dl"], description: "Deep learning framework" },
          { id: "tensorflow", name: "TensorFlow", category: "Framework", difficulty: "intermediate", estimatedHours: 35, prerequisites: ["dl"], description: "Production ML framework" },
          { id: "optimization", name: "Model Optimization", category: "Skills", difficulty: "intermediate", estimatedHours: 30, prerequisites: ["dl"], description: "Hyperparameter tuning, optimization" },
          { id: "docker", name: "Docker", category: "DevOps", difficulty: "intermediate", estimatedHours: 20, description: "Containerization for ML" },
        ],
      },
      {
        phase: 3,
        name: "MLOps & Production",
        description: "Deploy and maintain ML systems",
        topics: [
          { id: "mlops", name: "MLOps", category: "Operations", difficulty: "advanced", estimatedHours: 45, prerequisites: ["ml", "docker"], description: "ML lifecycle management" },
          { id: "mlflow", name: "MLflow", category: "Tools", difficulty: "advanced", estimatedHours: 25, prerequisites: ["mlops"], description: "Experiment tracking and registry" },
          { id: "kubeflow", name: "Kubeflow", category: "Platform", difficulty: "advanced", estimatedHours: 30, prerequisites: ["docker"], description: "ML on Kubernetes" },
          { id: "serving", name: "Model Serving", category: "Deployment", difficulty: "advanced", estimatedHours: 30, prerequisites: ["mlops"], description: "TensorFlow Serving, TorchServe" },
          { id: "monitoring", name: "ML Monitoring", category: "Operations", difficulty: "advanced", estimatedHours: 25, prerequisites: ["mlops"], description: "Model drift, performance monitoring" },
          { id: "distributed", name: "Distributed Training", category: "Advanced", difficulty: "advanced", estimatedHours: 30, prerequisites: ["dl"], description: "Training at scale" },
          { id: "system-design", name: "ML System Design", category: "Foundations", difficulty: "advanced", estimatedHours: 40, description: "Design production ML systems" },
        ],
      },
    ],
  },
  {
    roleId: "cloud_engineer",
    roleName: "Cloud Engineer",
    icon: "☁️",
    description: "Design and manage cloud infrastructure and services",
    totalTopics: 20,
    estimatedWeeks: 24,
    phases: [
      {
        phase: 1,
        name: "Foundation",
        description: "Cloud fundamentals and core services",
        topics: [
          { id: "linux", name: "Linux Administration", category: "Core", difficulty: "beginner", estimatedHours: 35, description: "Linux for cloud engineers" },
          { id: "networking", name: "Cloud Networking", category: "Core", difficulty: "beginner", estimatedHours: 30, description: "VPCs, subnets, security groups" },
          { id: "aws-core", name: "AWS Core Services", category: "Cloud", difficulty: "beginner", estimatedHours: 45, description: "EC2, S3, IAM, VPC" },
          { id: "scripting", name: "Shell Scripting", category: "Tools", difficulty: "beginner", estimatedHours: 20, description: "Automation with bash" },
        ],
      },
      {
        phase: 2,
        name: "Multi-Cloud & IaC",
        description: "Infrastructure as code and multi-cloud",
        topics: [
          { id: "azure", name: "Microsoft Azure", category: "Cloud", difficulty: "intermediate", estimatedHours: 40, description: "Azure core services" },
          { id: "gcp", name: "Google Cloud", category: "Cloud", difficulty: "intermediate", estimatedHours: 35, description: "GCP core services" },
          { id: "terraform", name: "Terraform", category: "IaC", difficulty: "intermediate", estimatedHours: 40, description: "Infrastructure as Code" },
          { id: "cloudformation", name: "CloudFormation", category: "IaC", difficulty: "intermediate", estimatedHours: 25, description: "AWS native IaC" },
          { id: "ansible", name: "Ansible", category: "Configuration", difficulty: "intermediate", estimatedHours: 25, description: "Configuration management" },
        ],
      },
      {
        phase: 3,
        name: "Advanced Cloud",
        description: "Advanced architecture and specializations",
        topics: [
          { id: "kubernetes", name: "Kubernetes", category: "Orchestration", difficulty: "advanced", estimatedHours: 50, description: "Container orchestration" },
          { id: "serverless", name: "Serverless", category: "Architecture", difficulty: "advanced", estimatedHours: 30, description: "Lambda, Functions, event-driven" },
          { id: "security", name: "Cloud Security", category: "Security", difficulty: "advanced", estimatedHours: 35, description: "Security best practices" },
          { id: "cost", name: "FinOps", category: "Operations", difficulty: "advanced", estimatedHours: 20, description: "Cost optimization" },
          { id: "monitoring", name: "Cloud Monitoring", category: "Operations", difficulty: "advanced", estimatedHours: 25, description: "CloudWatch, Stackdriver, Azure Monitor" },
          { id: "architecture", name: "Cloud Architecture", category: "Architecture", difficulty: "advanced", estimatedHours: 40, description: "Well-architected framework" },
          { id: "certifications", name: "AWS/Azure Certifications", category: "Certifications", difficulty: "advanced", estimatedHours: 60, description: "Professional certifications prep" },
        ],
      },
    ],
  },
  {
    roleId: "sre",
    roleName: "Site Reliability Engineer",
    icon: "🔧",
    description: "Ensure reliability and performance of production systems",
    totalTopics: 18,
    estimatedWeeks: 24,
    phases: [
      {
        phase: 1,
        name: "Foundation",
        description: "Systems and programming fundamentals",
        topics: [
          { id: "linux", name: "Linux Administration", category: "Core", difficulty: "beginner", estimatedHours: 40, description: "Advanced Linux for SRE" },
          { id: "python", name: "Python", category: "Language", difficulty: "beginner", estimatedHours: 35, description: "Python for automation" },
          { id: "networking", name: "Networking", category: "Core", difficulty: "beginner", estimatedHours: 30, description: "TCP/IP, DNS, load balancing" },
          { id: "git", name: "Git", category: "Tools", difficulty: "beginner", estimatedHours: 10, description: "Version control" },
        ],
      },
      {
        phase: 2,
        name: "SRE Practices",
        description: "Core SRE practices and tools",
        topics: [
          { id: "docker", name: "Docker", category: "Containers", difficulty: "intermediate", estimatedHours: 30, description: "Container fundamentals" },
          { id: "kubernetes", name: "Kubernetes", category: "Orchestration", difficulty: "intermediate", estimatedHours: 50, prerequisites: ["docker"], description: "Container orchestration" },
          { id: "prometheus", name: "Prometheus & Grafana", category: "Monitoring", difficulty: "intermediate", estimatedHours: 35, description: "Metrics and dashboards" },
          { id: "terraform", name: "Terraform", category: "IaC", difficulty: "intermediate", estimatedHours: 30, description: "Infrastructure as Code" },
          { id: "cicd", name: "CI/CD", category: "Automation", difficulty: "intermediate", estimatedHours: 25, description: "Continuous integration/deployment" },
        ],
      },
      {
        phase: 3,
        name: "Advanced SRE",
        description: "Advanced reliability engineering",
        topics: [
          { id: "sli-slo", name: "SLI/SLO/SLA", category: "Reliability", difficulty: "advanced", estimatedHours: 25, description: "Service level objectives" },
          { id: "incident", name: "Incident Management", category: "Operations", difficulty: "advanced", estimatedHours: 20, description: "On-call, postmortems, response" },
          { id: "chaos", name: "Chaos Engineering", category: "Reliability", difficulty: "advanced", estimatedHours: 25, description: "Chaos Monkey, fault injection" },
          { id: "capacity", name: "Capacity Planning", category: "Operations", difficulty: "advanced", estimatedHours: 25, description: "Resource planning and scaling" },
          { id: "distributed", name: "Distributed Systems", category: "Architecture", difficulty: "advanced", estimatedHours: 40, description: "Distributed systems reliability" },
          { id: "security", name: "Security for SRE", category: "Security", difficulty: "advanced", estimatedHours: 25, description: "Security best practices" },
          { id: "system-design", name: "System Design", category: "Foundations", difficulty: "advanced", estimatedHours: 40, description: "Reliable system design" },
        ],
      },
    ],
  },
  {
    roleId: "mobile_android",
    roleName: "Android Developer",
    icon: "🤖",
    description: "Build native Android applications with Kotlin",
    totalTopics: 16,
    estimatedWeeks: 20,
    phases: [
      {
        phase: 1,
        name: "Foundation",
        description: "Kotlin and Android basics",
        topics: [
          { id: "kotlin", name: "Kotlin", category: "Language", difficulty: "beginner", estimatedHours: 40, description: "Kotlin fundamentals" },
          { id: "android-basics", name: "Android Basics", category: "Platform", difficulty: "beginner", estimatedHours: 35, description: "Activities, Fragments, Layouts" },
          { id: "git", name: "Git", category: "Tools", difficulty: "beginner", estimatedHours: 10, description: "Version control" },
          { id: "dsa", name: "Data Structures", category: "Foundations", difficulty: "beginner", estimatedHours: 35, description: "DSA for mobile developers" },
        ],
      },
      {
        phase: 2,
        name: "Modern Android",
        description: "Jetpack and modern Android development",
        topics: [
          { id: "compose", name: "Jetpack Compose", category: "UI", difficulty: "intermediate", estimatedHours: 45, prerequisites: ["kotlin"], description: "Declarative UI" },
          { id: "architecture", name: "Android Architecture", category: "Architecture", difficulty: "intermediate", estimatedHours: 35, description: "MVVM, Clean Architecture" },
          { id: "room", name: "Room Database", category: "Data", difficulty: "intermediate", estimatedHours: 20, description: "Local database" },
          { id: "retrofit", name: "Retrofit & Networking", category: "Data", difficulty: "intermediate", estimatedHours: 25, description: "API integration" },
          { id: "coroutines", name: "Coroutines & Flow", category: "Async", difficulty: "intermediate", estimatedHours: 30, prerequisites: ["kotlin"], description: "Async programming" },
        ],
      },
      {
        phase: 3,
        name: "Advanced Android",
        description: "Advanced features and testing",
        topics: [
          { id: "hilt", name: "Dependency Injection (Hilt)", category: "Architecture", difficulty: "advanced", estimatedHours: 25, description: "DI with Hilt" },
          { id: "testing", name: "Android Testing", category: "Quality", difficulty: "advanced", estimatedHours: 30, description: "Unit, UI, integration tests" },
          { id: "performance", name: "Performance Optimization", category: "Performance", difficulty: "advanced", estimatedHours: 25, description: "Memory, battery, rendering" },
          { id: "security", name: "Mobile Security", category: "Security", difficulty: "advanced", estimatedHours: 20, description: "Secure Android development" },
          { id: "publish", name: "Play Store Publishing", category: "Deployment", difficulty: "advanced", estimatedHours: 15, description: "App publishing and updates" },
          { id: "system-design", name: "Mobile System Design", category: "Foundations", difficulty: "advanced", estimatedHours: 30, description: "Design mobile systems" },
        ],
      },
    ],
  },
  {
    roleId: "mobile_ios",
    roleName: "iOS Developer",
    icon: "🍎",
    description: "Build native iOS applications with Swift",
    totalTopics: 16,
    estimatedWeeks: 20,
    phases: [
      {
        phase: 1,
        name: "Foundation",
        description: "Swift and iOS basics",
        topics: [
          { id: "swift", name: "Swift", category: "Language", difficulty: "beginner", estimatedHours: 40, description: "Swift fundamentals" },
          { id: "ios-basics", name: "iOS Basics", category: "Platform", difficulty: "beginner", estimatedHours: 35, description: "UIKit, view controllers, Auto Layout" },
          { id: "git", name: "Git", category: "Tools", difficulty: "beginner", estimatedHours: 10, description: "Version control" },
          { id: "dsa", name: "Data Structures", category: "Foundations", difficulty: "beginner", estimatedHours: 35, description: "DSA for mobile developers" },
        ],
      },
      {
        phase: 2,
        name: "Modern iOS",
        description: "SwiftUI and modern iOS development",
        topics: [
          { id: "swiftui", name: "SwiftUI", category: "UI", difficulty: "intermediate", estimatedHours: 45, prerequisites: ["swift"], description: "Declarative UI framework" },
          { id: "architecture", name: "iOS Architecture", category: "Architecture", difficulty: "intermediate", estimatedHours: 35, description: "MVVM, Clean Architecture" },
          { id: "coredata", name: "Core Data", category: "Data", difficulty: "intermediate", estimatedHours: 25, description: "Local persistence" },
          { id: "networking", name: "URLSession & Networking", category: "Data", difficulty: "intermediate", estimatedHours: 25, description: "API integration" },
          { id: "concurrency", name: "Swift Concurrency", category: "Async", difficulty: "intermediate", estimatedHours: 30, prerequisites: ["swift"], description: "async/await, actors" },
        ],
      },
      {
        phase: 3,
        name: "Advanced iOS",
        description: "Advanced features and testing",
        topics: [
          { id: "combine", name: "Combine", category: "Reactive", difficulty: "advanced", estimatedHours: 30, description: "Reactive programming" },
          { id: "testing", name: "iOS Testing", category: "Quality", difficulty: "advanced", estimatedHours: 30, description: "XCTest, UI testing" },
          { id: "performance", name: "Performance Optimization", category: "Performance", difficulty: "advanced", estimatedHours: 25, description: "Memory, battery, instruments" },
          { id: "security", name: "Mobile Security", category: "Security", difficulty: "advanced", estimatedHours: 20, description: "Secure iOS development" },
          { id: "publish", name: "App Store Publishing", category: "Deployment", difficulty: "advanced", estimatedHours: 15, description: "App Store submission" },
          { id: "system-design", name: "Mobile System Design", category: "Foundations", difficulty: "advanced", estimatedHours: 30, description: "Design mobile systems" },
        ],
      },
    ],
  },
  {
    roleId: "mobile_cross",
    roleName: "Cross-Platform Mobile Developer",
    icon: "📱",
    description: "Build mobile apps for iOS and Android from a single codebase",
    totalTopics: 16,
    estimatedWeeks: 20,
    phases: [
      {
        phase: 1,
        name: "Foundation",
        description: "Programming fundamentals",
        topics: [
          { id: "js", name: "JavaScript", category: "Language", difficulty: "beginner", estimatedHours: 40, description: "JavaScript fundamentals" },
          { id: "ts", name: "TypeScript", category: "Language", difficulty: "beginner", estimatedHours: 25, prerequisites: ["js"], description: "Type-safe JavaScript" },
          { id: "react", name: "React Basics", category: "Framework", difficulty: "beginner", estimatedHours: 35, prerequisites: ["js"], description: "React fundamentals for RN" },
          { id: "git", name: "Git", category: "Tools", difficulty: "beginner", estimatedHours: 10, description: "Version control" },
        ],
      },
      {
        phase: 2,
        name: "React Native",
        description: "React Native development",
        topics: [
          { id: "rn-core", name: "React Native Core", category: "Framework", difficulty: "intermediate", estimatedHours: 45, prerequisites: ["react"], description: "Components, navigation, styling" },
          { id: "rn-state", name: "State Management", category: "Architecture", difficulty: "intermediate", estimatedHours: 25, description: "Redux, Zustand for RN" },
          { id: "rn-nav", name: "React Navigation", category: "Navigation", difficulty: "intermediate", estimatedHours: 20, description: "Stack, Tab, Drawer navigation" },
          { id: "rn-api", name: "API Integration", category: "Data", difficulty: "intermediate", estimatedHours: 20, description: "REST APIs, AsyncStorage" },
          { id: "expo", name: "Expo", category: "Framework", difficulty: "intermediate", estimatedHours: 25, description: "Expo managed workflow" },
        ],
      },
      {
        phase: 3,
        name: "Flutter Alternative",
        description: "Flutter as an alternative framework",
        topics: [
          { id: "dart", name: "Dart", category: "Language", difficulty: "intermediate", estimatedHours: 25, description: "Dart language fundamentals" },
          { id: "flutter", name: "Flutter", category: "Framework", difficulty: "advanced", estimatedHours: 50, prerequisites: ["dart"], description: "Flutter widgets, state, navigation" },
          { id: "native-modules", name: "Native Modules", category: "Advanced", difficulty: "advanced", estimatedHours: 25, description: "Platform-specific code" },
          { id: "testing", name: "Mobile Testing", category: "Quality", difficulty: "advanced", estimatedHours: 25, description: "Unit, widget, integration tests" },
          { id: "performance", name: "Performance Optimization", category: "Performance", difficulty: "advanced", estimatedHours: 20, description: "Cross-platform performance" },
          { id: "publish", name: "App Store Publishing", category: "Deployment", difficulty: "advanced", estimatedHours: 20, description: "iOS and Android publishing" },
        ],
      },
    ],
  },
  {
    roleId: "blockchain_dev",
    roleName: "Blockchain Developer",
    icon: "⛓️",
    description: "Build decentralized applications and smart contracts",
    totalTopics: 14,
    estimatedWeeks: 18,
    phases: [
      {
        phase: 1,
        name: "Foundation",
        description: "Blockchain fundamentals",
        topics: [
          { id: "blockchain-basics", name: "Blockchain Fundamentals", category: "Core", difficulty: "beginner", estimatedHours: 30, description: "Distributed ledger, consensus, cryptography" },
          { id: "js", name: "JavaScript", category: "Language", difficulty: "beginner", estimatedHours: 30, description: "JS for Web3" },
          { id: "git", name: "Git", category: "Tools", difficulty: "beginner", estimatedHours: 10, description: "Version control" },
          { id: "crypto", name: "Cryptography Basics", category: "Foundations", difficulty: "beginner", estimatedHours: 25, description: "Hash functions, signatures, keys" },
        ],
      },
      {
        phase: 2,
        name: "Smart Contracts",
        description: "Ethereum and Solidity development",
        topics: [
          { id: "solidity", name: "Solidity", category: "Language", difficulty: "intermediate", estimatedHours: 45, description: "Smart contract development" },
          { id: "ethereum", name: "Ethereum", category: "Platform", difficulty: "intermediate", estimatedHours: 35, description: "Ethereum ecosystem" },
          { id: "hardhat", name: "Hardhat", category: "Tools", difficulty: "intermediate", estimatedHours: 25, prerequisites: ["solidity"], description: "Development environment" },
          { id: "web3js", name: "Web3.js/Ethers.js", category: "Libraries", difficulty: "intermediate", estimatedHours: 30, prerequisites: ["js"], description: "Blockchain interaction" },
          { id: "testing", name: "Smart Contract Testing", category: "Quality", difficulty: "intermediate", estimatedHours: 25, prerequisites: ["solidity"], description: "Testing and auditing" },
        ],
      },
      {
        phase: 3,
        name: "DApps & Advanced",
        description: "Decentralized application development",
        topics: [
          { id: "defi", name: "DeFi Development", category: "Specialization", difficulty: "advanced", estimatedHours: 35, prerequisites: ["solidity"], description: "DeFi protocols and patterns" },
          { id: "nft", name: "NFT Development", category: "Specialization", difficulty: "advanced", estimatedHours: 25, prerequisites: ["solidity"], description: "ERC-721, ERC-1155" },
          { id: "security", name: "Smart Contract Security", category: "Security", difficulty: "advanced", estimatedHours: 35, prerequisites: ["solidity"], description: "Vulnerabilities, auditing" },
          { id: "layer2", name: "Layer 2 Solutions", category: "Advanced", difficulty: "advanced", estimatedHours: 25, description: "Polygon, Arbitrum, Optimism" },
          { id: "dapp", name: "Full DApp Development", category: "Project", difficulty: "advanced", estimatedHours: 40, description: "End-to-end DApp project" },
        ],
      },
    ],
  },
  {
    roleId: "rpa_developer",
    roleName: "RPA Developer",
    icon: "🤖",
    description: "Automate business processes with robotic process automation",
    totalTopics: 12,
    estimatedWeeks: 14,
    phases: [
      {
        phase: 1,
        name: "Foundation",
        description: "RPA fundamentals and tools",
        topics: [
          { id: "rpa-basics", name: "RPA Fundamentals", category: "Core", difficulty: "beginner", estimatedHours: 25, description: "RPA concepts, use cases, ROI" },
          { id: "excel", name: "Excel Automation", category: "Skills", difficulty: "beginner", estimatedHours: 20, description: "Excel macros, VBA basics" },
          { id: "process", name: "Process Analysis", category: "Skills", difficulty: "beginner", estimatedHours: 25, description: "Process documentation, optimization" },
        ],
      },
      {
        phase: 2,
        name: "UiPath Development",
        description: "UiPath platform mastery",
        topics: [
          { id: "uipath-studio", name: "UiPath Studio", category: "Platform", difficulty: "intermediate", estimatedHours: 45, description: "Bot development with UiPath" },
          { id: "uipath-orchestrator", name: "UiPath Orchestrator", category: "Platform", difficulty: "intermediate", estimatedHours: 30, description: "Bot deployment and management" },
          { id: "selectors", name: "Selectors & UI Automation", category: "Skills", difficulty: "intermediate", estimatedHours: 25, description: "UI element identification" },
          { id: "error-handling", name: "Error Handling", category: "Skills", difficulty: "intermediate", estimatedHours: 20, description: "Exception handling, logging" },
        ],
      },
      {
        phase: 3,
        name: "Advanced RPA",
        description: "Advanced automation and AI integration",
        topics: [
          { id: "aa", name: "Automation Anywhere", category: "Platform", difficulty: "advanced", estimatedHours: 35, description: "Alternative RPA platform" },
          { id: "blueprism", name: "Blue Prism", category: "Platform", difficulty: "advanced", estimatedHours: 30, description: "Enterprise RPA platform" },
          { id: "ai-rpa", name: "AI + RPA Integration", category: "Advanced", difficulty: "advanced", estimatedHours: 30, description: "Document AI, NLP in RPA" },
          { id: "coe", name: "RPA Center of Excellence", category: "Governance", difficulty: "advanced", estimatedHours: 25, description: "Scaling RPA programs" },
          { id: "project", name: "RPA Implementation Project", category: "Project", difficulty: "advanced", estimatedHours: 35, description: "End-to-end automation project" },
        ],
      },
    ],
  },
  {
    roleId: "sap_consultant",
    roleName: "SAP Consultant",
    icon: "🏢",
    description: "Implement and configure SAP enterprise solutions",
    totalTopics: 14,
    estimatedWeeks: 20,
    phases: [
      {
        phase: 1,
        name: "Foundation",
        description: "SAP basics and navigation",
        topics: [
          { id: "sap-basics", name: "SAP Fundamentals", category: "Core", difficulty: "beginner", estimatedHours: 35, description: "SAP ecosystem, navigation, modules" },
          { id: "erp", name: "ERP Concepts", category: "Core", difficulty: "beginner", estimatedHours: 25, description: "Enterprise resource planning basics" },
          { id: "business", name: "Business Processes", category: "Skills", difficulty: "beginner", estimatedHours: 30, description: "Standard business processes" },
        ],
      },
      {
        phase: 2,
        name: "Module Specialization",
        description: "Specialize in SAP modules",
        topics: [
          { id: "fico", name: "SAP FICO", category: "Module", difficulty: "intermediate", estimatedHours: 60, description: "Finance and controlling" },
          { id: "mm", name: "SAP MM", category: "Module", difficulty: "intermediate", estimatedHours: 45, description: "Materials management" },
          { id: "sd", name: "SAP SD", category: "Module", difficulty: "intermediate", estimatedHours: 45, description: "Sales and distribution" },
          { id: "config", name: "SAP Configuration", category: "Skills", difficulty: "intermediate", estimatedHours: 40, description: "System configuration" },
        ],
      },
      {
        phase: 3,
        name: "Advanced SAP",
        description: "Advanced SAP technologies",
        topics: [
          { id: "abap", name: "SAP ABAP", category: "Development", difficulty: "advanced", estimatedHours: 50, description: "SAP programming language" },
          { id: "hana", name: "SAP HANA", category: "Platform", difficulty: "advanced", estimatedHours: 40, description: "In-memory database" },
          { id: "s4hana", name: "SAP S/4HANA", category: "Platform", difficulty: "advanced", estimatedHours: 45, description: "Next-gen ERP suite" },
          { id: "integration", name: "SAP Integration", category: "Advanced", difficulty: "advanced", estimatedHours: 35, description: "SAP PI/PO, CPI" },
          { id: "project", name: "SAP Implementation Project", category: "Project", difficulty: "advanced", estimatedHours: 40, description: "End-to-end SAP project" },
        ],
      },
    ],
  },
  {
    roleId: "salesforce_dev",
    roleName: "Salesforce Developer",
    icon: "☁️",
    description: "Build applications on the Salesforce platform",
    totalTopics: 14,
    estimatedWeeks: 16,
    phases: [
      {
        phase: 1,
        name: "Foundation",
        description: "Salesforce basics and admin",
        topics: [
          { id: "sf-basics", name: "Salesforce Fundamentals", category: "Core", difficulty: "beginner", estimatedHours: 30, description: "Salesforce ecosystem and concepts" },
          { id: "sf-admin", name: "Salesforce Admin", category: "Admin", difficulty: "beginner", estimatedHours: 45, description: "Configuration, users, security" },
          { id: "data-model", name: "Data Modeling", category: "Core", difficulty: "beginner", estimatedHours: 25, description: "Objects, fields, relationships" },
        ],
      },
      {
        phase: 2,
        name: "Development",
        description: "Apex and Lightning development",
        topics: [
          { id: "apex", name: "Apex", category: "Development", difficulty: "intermediate", estimatedHours: 50, description: "Salesforce programming language" },
          { id: "soql", name: "SOQL/SOSL", category: "Development", difficulty: "intermediate", estimatedHours: 25, description: "Salesforce query languages" },
          { id: "lightning", name: "Lightning Web Components", category: "Development", difficulty: "intermediate", estimatedHours: 45, description: "Modern UI framework" },
          { id: "triggers", name: "Triggers & Automation", category: "Development", difficulty: "intermediate", estimatedHours: 30, description: "Apex triggers, flows" },
          { id: "testing", name: "Apex Testing", category: "Quality", difficulty: "intermediate", estimatedHours: 25, description: "Unit testing in Salesforce" },
        ],
      },
      {
        phase: 3,
        name: "Advanced Salesforce",
        description: "Integration and advanced features",
        topics: [
          { id: "integration", name: "Salesforce Integration", category: "Advanced", difficulty: "advanced", estimatedHours: 35, description: "REST, SOAP APIs, middleware" },
          { id: "cpq", name: "Salesforce CPQ", category: "Product", difficulty: "advanced", estimatedHours: 30, description: "Configure, Price, Quote" },
          { id: "marketing", name: "Marketing Cloud", category: "Product", difficulty: "advanced", estimatedHours: 30, description: "Marketing automation" },
          { id: "devops", name: "Salesforce DevOps", category: "Operations", difficulty: "advanced", estimatedHours: 25, description: "CI/CD, version control, deployment" },
          { id: "certification", name: "Salesforce Certifications", category: "Certification", difficulty: "advanced", estimatedHours: 40, description: "Platform Developer I/II prep" },
        ],
      },
    ],
  },
];

// Helper function to get topics for a role
export function getTopicsForRole(roleId: string): string[] {
  const roleStack = ROLE_TECH_STACKS.find((r) => r.roleId === roleId);
  if (!roleStack) return [];
  return roleStack.categories.flatMap((c) => c.topics);
}

// Helper function to get learning path for a role
export function getLearningPath(roleId: string): LearningPath | undefined {
  return LEARNING_PATHS.find((p) => p.roleId === roleId);
}

// All unique topics from 191 courses
export const ALL_TOPICS = [
  // Programming & Core Engineering
  "Python", "Java", "C", "C++", "C#", "JavaScript", "TypeScript", "Go", "Rust",
  "Scala", "Kotlin", "Swift", "PHP", "R", "Dart", "Groovy", "Shell Scripting", "PowerShell",
  // Computer Science Foundations
  "Data Structures & Algorithms", "System Design", "Operating Systems", "Computer Networks", "OOPS", "Design Patterns",
  // Frontend Development
  "HTML5", "CSS3", "React", "Angular", "Vue", "Next.js", "Web Performance Optimization",
  "Progressive Web Apps", "State Management", "Frontend Testing", "UI Architecture",
  // Backend Development
  "Node.js", "Spring Boot", "Django", "FastAPI", "ASP.NET Core", "Laravel", "Ruby on Rails",
  "REST API Development", "GraphQL", "gRPC", "Microservices", "Event-Driven Architecture", "Distributed Systems",
  // Full Stack
  "MERN", "MEAN", "Java Full Stack", "Python Full Stack", ".NET Full Stack",
  // Mobile
  "Android (Kotlin)", "iOS (Swift)", "React Native", "Flutter", "Mobile Architecture", "Mobile App Security",
  // Cloud
  "AWS", "Microsoft Azure", "Google Cloud", "Cloud Architecture", "Serverless", "Cloud Security", "Multi-Cloud Strategy", "FinOps",
  // DevOps
  "Git", "Docker", "Kubernetes", "Terraform", "Jenkins", "GitHub Actions", "Ansible", "Helm",
  "Observability (Prometheus, Grafana)", "CI/CD", "Platform Engineering", "Site Reliability Engineering",
  // Data Engineering
  "SQL Advanced", "Data Modeling", "ETL / ELT", "Data Warehousing", "Apache Spark", "Hadoop",
  "Kafka", "Airflow", "Snowflake", "Databricks", "BigQuery", "Redshift", "Azure Data Factory",
  "AWS Glue", "Streaming Data Engineering",
  // Data Analytics & BI
  "Data Analytics", "Advanced Excel", "Tableau", "Power BI", "Business Intelligence", "Looker",
  "Qlik", "SAP BusinessObjects", "SAP Analytics Cloud", "IBM Cognos", "Oracle OBIEE", "MicroStrategy", "TIBCO Spotfire",
  // AI/ML
  "Machine Learning", "Deep Learning", "NLP", "Computer Vision", "Reinforcement Learning",
  "Generative AI", "LLM Engineering", "Prompt Engineering", "RAG", "Agentic AI",
  "Multi-Agent Systems", "LangChain", "CrewAI", "MLOps", "AI Deployment", "AI Governance",
  // Cyber Security
  "Ethical Hacking", "Penetration Testing", "SOC Analyst", "SIEM (Splunk, QRadar)",
  "Cloud Security (Cyber)", "Network Security", "Application Security", "DevSecOps",
  "CISSP", "CEH", "Zero Trust Architecture",
  // Databases
  "MySQL", "PostgreSQL", "MongoDB", "Oracle DBA", "SQL Server", "Cassandra", "Redis", "Neo4j", "DB2",
  // Software Testing
  "Manual Testing", "Selenium", "Cypress", "Playwright", "Appium", "JMeter", "LoadRunner",
  "API Testing", "Performance Testing",
  // ERP
  "SAP FICO", "SAP MM", "SAP SD", "SAP ABAP", "SAP HANA", "SAP SuccessFactors",
  "SAP PP", "SAP Basis", "SAP Ariba", "SAP EWM", "Oracle ERP", "Workday",
  // CRM
  "Salesforce Admin", "Salesforce Developer", "Salesforce Lightning", "Salesforce CPQ",
  "Salesforce Marketing Cloud", "Microsoft Dynamics CRM", "Zoho CRM",
  // ITSM
  "Jira", "Jira Service Management", "Confluence", "ServiceNow", "BMC Remedy",
  "Freshservice", "Zendesk", "ITIL",
  // RPA
  "UiPath", "Automation Anywhere", "Blue Prism", "Power Automate",
  // Emerging Tech
  "Blockchain", "Web3", "IoT", "AR/VR", "Robotics Software", "Quantum Computing Basics",
];
