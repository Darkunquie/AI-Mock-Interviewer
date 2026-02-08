"use client";

import {
  SiPython,
  SiJavascript,
  SiTypescript,
  SiReact,
  SiAngular,
  SiVuedotjs,
  SiNodedotjs,
  SiSpring,
  SiDjango,
  SiMongodb,
  SiPostgresql,
  SiMysql,
  SiRedis,
  SiDocker,
  SiKubernetes,
  SiGit,
  SiLinux,
  SiTerraform,
  SiJenkins,
  SiGithubactions,
  SiApachekafka,
  SiApachespark,
  SiElasticsearch,
  SiGraphql,
  SiFlutter,
  SiSwift,
  SiKotlin,
  SiRust,
  SiGo,
  SiCplusplus,
  SiPhp,
  SiLaravel,
  SiRuby,
  SiRubyonrails,
  SiTableau,
  SiSalesforce,
  SiJira,
  SiTensorflow,
  SiPytorch,
  SiOpenai,
  SiHtml5,
  SiCss3,
  SiSass,
  SiTailwindcss,
  SiNextdotjs,
  SiExpress,
  SiFlask,
  SiDotnet,
  SiOracle,
  SiCypress,
  SiSelenium,
  SiFigma,
  SiAdobexd,
  SiCisco,
  SiSnowflake,
  SiDatabricks,
} from "react-icons/si";
import {
  FaJava,
  FaDatabase,
  FaServer,
  FaCode,
  FaCogs,
  FaCloud,
  FaChartBar,
  FaBrain,
  FaShieldAlt,
  FaRobot,
  FaBuilding,
  FaLayerGroup,
  FaTools,
  FaUsersCog,
  FaLock,
  FaSitemap,
  FaChartLine,
  FaCubes,
  FaMicrochip,
  FaAws,
  FaMicrosoft,
  FaGoogle,
  FaPython,
  FaMobileAlt,
  FaPalette,
  FaNetworkWired,
  FaBriefcase,
  FaBullhorn,
  FaVial,
  FaHeadset,
  FaSearch,
} from "react-icons/fa";
import { IconType } from "react-icons";

// Map tech stack IDs to their corresponding icons
const techIconMap: Record<string, IconType> = {
  // Volume 1: Programming & CS
  "python": SiPython,
  "java": FaJava,
  "dsa": FaCode,
  "system-design": FaSitemap,

  // Volume 2: Frontend
  "html-css": SiHtml5,
  "javascript": SiJavascript,
  "react": SiReact,
  "angular": SiAngular,
  "vue": SiVuedotjs,

  // Volume 3: Backend
  "nodejs": SiNodedotjs,
  "spring-boot": SiSpring,
  "django": SiDjango,
  "express": SiExpress,
  "fastapi": FaPython,
  "flask": SiFlask,

  // Volume 4: Full Stack
  "mern": SiReact,
  "java-fullstack": FaJava,
  "python-fullstack": SiPython,
  "dotnet-fullstack": SiDotnet,

  // Volume 5: Cloud
  "aws": FaAws,
  "azure": FaMicrosoft,
  "gcp": FaGoogle,

  // Volume 6: DevOps
  "devops-fundamentals": FaCogs,
  "docker": SiDocker,
  "docker-advanced": SiDocker,
  "kubernetes": SiKubernetes,
  "kubernetes-advanced": SiKubernetes,
  "cicd": SiGithubactions,
  "cicd-automation": SiGithubactions,
  "platform-engineering": FaServer,
  "platform-engineering-sre": FaServer,

  // Volume 7: Data Engineering
  "data-engineering": FaDatabase,
  "data-engineering-fundamentals": FaDatabase,
  "apache-spark": SiApachespark,
  "hadoop": FaDatabase,
  "kafka": SiApachekafka,
  "kafka-streaming": SiApachekafka,
  "cloud-data-platforms": FaDatabase,

  // Volume 8: BI & Analytics
  "tableau": SiTableau,
  "power-bi": FaChartBar,
  "sap-businessobjects": FaChartBar,
  "ibm-cognos": FaChartLine,
  "oracle-obiee": FaChartBar,

  // Volume 9: AI/ML
  "machine-learning": FaBrain,
  "deep-learning": SiTensorflow,
  "generative-ai": SiOpenai,
  "generative-ai-llm": SiOpenai,
  "agentic-ai": FaRobot,
  "mlops": FaCubes,

  // Volume 10: Enterprise & Security
  "cyber-security": FaShieldAlt,
  "sap-erp": FaBuilding,
  "crm-platforms": SiSalesforce,
  "itsm-ticketing": SiJira,
  "rpa": FaRobot,
  "emerging-tech": FaMicrochip,

  // Additional Technologies
  "typescript": SiTypescript,
  "go": SiGo,
  "golang": SiGo,
  "rust": SiRust,
  "c-cpp": SiCplusplus,
  "php-laravel": SiLaravel,
  "php": SiPhp,
  "ruby-rails": SiRubyonrails,
  "ruby": SiRuby,
  "kotlin": SiKotlin,
  "swift": SiSwift,
  "flutter": SiFlutter,
  "flutter-dart": SiFlutter,
  "react-native": SiReact,
  "graphql": SiGraphql,
  "redis": SiRedis,
  "mongodb": SiMongodb,
  "postgresql": SiPostgresql,
  "mysql": SiMysql,
  "elasticsearch": SiElasticsearch,
  "terraform": SiTerraform,
  "linux": SiLinux,
  "linux-shell": SiLinux,
  "git": SiGit,
  "git-version-control": SiGit,
  "testing-qa": FaTools,
  "software-testing": FaTools,
  "agile-scrum": FaUsersCog,
  "snowflake": SiSnowflake,
  "databricks": SiDatabricks,
  "jenkins": SiJenkins,
  "nextjs": SiNextdotjs,
  "tailwind": SiTailwindcss,
  "sass": SiSass,
  "css": SiCss3,
  "pytorch": SiPytorch,

  // Oracle Technologies
  "oracle-sql": SiOracle,
  "oracle-plsql": SiOracle,
  "oracle-dba": SiOracle,
  "oracle-fusion": SiOracle,
  "oci": SiOracle,
  "oracle-rman": SiOracle,
  "oracle-rac": SiOracle,
  "oracle-asm": SiOracle,
  "oracle-odi": SiOracle,
  "oracle-goldengate": SiOracle,
  "oracle-bi-publisher": SiOracle,
  "oracle-analytics-cloud": SiOracle,
  "oracle-apps-technical": SiOracle,
  "oracle-financials": SiOracle,
  "oracle-scm": SiOracle,
  "oracle-hcm": SiOracle,
  "oracle-projects": SiOracle,

  // Microsoft Technologies
  "csharp": FaMicrosoft,
  "dotnet-core": SiDotnet,
  "azure-fundamentals": FaMicrosoft,
  "sql-server": FaDatabase,
  "power-platform": FaMicrosoft,
  "dynamics-365": FaMicrosoft,

  // SAP Expanded
  "sap-abap": FaBuilding,
  "sap-fico": FaBuilding,
  "sap-mm": FaBuilding,

  // UI/UX
  "ui-ux-design": FaPalette,
  "figma": SiFigma,

  // Testing
  "selenium": SiSelenium,
  "cypress": SiCypress,
  "api-testing": FaVial,

  // Networking
  "computer-networks": FaNetworkWired,
  "linux-admin": SiLinux,

  // Digital Marketing
  "digital-marketing": FaBullhorn,
  "seo": FaSearch,

  // Databases
  "sql-fundamentals": FaDatabase,

  // IT Support
  "it-support-fundamentals": FaHeadset,
  "help-desk": FaHeadset,
  "itil": FaBriefcase,
  "service-desk": FaHeadset,
  "servicenow": FaHeadset,
  "business-analysis": FaBriefcase,
  "project-management": FaUsersCog,
};

// Custom colors for each technology
const techColorMap: Record<string, string> = {
  "python": "#3776AB",
  "java": "#ED8B00",
  "javascript": "#F7DF1E",
  "typescript": "#3178C6",
  "react": "#61DAFB",
  "angular": "#DD0031",
  "vue": "#4FC08D",
  "nodejs": "#339933",
  "spring-boot": "#6DB33F",
  "django": "#092E20",
  "mongodb": "#47A248",
  "postgresql": "#4169E1",
  "mysql": "#4479A1",
  "redis": "#DC382D",
  "docker": "#2496ED",
  "kubernetes": "#326CE5",
  "aws": "#FF9900",
  "azure": "#0078D4",
  "gcp": "#4285F4",
  "git": "#F05032",
  "linux": "#FCC624",
  "terraform": "#7B42BC",
  "graphql": "#E10098",
  "flutter": "#02569B",
  "swift": "#F05138",
  "kotlin": "#7F52FF",
  "rust": "#DEA584",
  "go": "#00ADD8",
  "php": "#777BB4",
  "ruby": "#CC342D",
  "tableau": "#E97627",
  "power-bi": "#F2C811",
  "salesforce": "#00A1E0",
  "jira": "#0052CC",
  "snowflake": "#29B5E8",
  "databricks": "#FF3621",
  "tensorflow": "#FF6F00",
  "pytorch": "#EE4C2C",
  "openai": "#412991",
  "elasticsearch": "#005571",
  "kafka": "#231F20",
  "spark": "#E25A1C",
  "hadoop": "#66CCFF",
  "nextjs": "#000000",
  "tailwind": "#06B6D4",
  "sass": "#CC6699",
  "css": "#1572B6",
  "html": "#E34F26",
  "html-css": "#E34F26",
  "express": "#000000",
  "fastapi": "#009688",
  "flask": "#000000",
  "dotnet": "#512BD4",
  "dotnet-fullstack": "#512BD4",
  "laravel": "#FF2D20",
  "php-laravel": "#FF2D20",
  "rails": "#CC0000",
  "ruby-rails": "#CC0000",
  "jenkins": "#D24939",
  "github-actions": "#2088FF",
  "cicd": "#2088FF",
  "cicd-automation": "#2088FF",
  "dsa": "#8B5CF6",
  "system-design": "#06B6D4",
  "mern": "#61DAFB",
  "java-fullstack": "#ED8B00",
  "python-fullstack": "#3776AB",
  "devops-fundamentals": "#326CE5",
  "docker-advanced": "#2496ED",
  "kubernetes-advanced": "#326CE5",
  "platform-engineering": "#00ADD8",
  "platform-engineering-sre": "#00ADD8",
  "data-engineering": "#3776AB",
  "data-engineering-fundamentals": "#3776AB",
  "apache-spark": "#E25A1C",
  "kafka-streaming": "#231F20",
  "cloud-data-platforms": "#29B5E8",
  "sap-businessobjects": "#0FAAFF",
  "ibm-cognos": "#054ADA",
  "oracle-obiee": "#F80000",
  "machine-learning": "#FF6F00",
  "deep-learning": "#FF6F00",
  "generative-ai": "#412991",
  "generative-ai-llm": "#412991",
  "agentic-ai": "#10A37F",
  "mlops": "#0DB7ED",
  "cyber-security": "#E63946",
  "sap-erp": "#0FAAFF",
  "crm-platforms": "#00A1E0",
  "itsm-ticketing": "#0052CC",
  "rpa": "#FA4616",
  "emerging-tech": "#7C3AED",
  "c-cpp": "#00599C",
  "flutter-dart": "#02569B",
  "react-native": "#61DAFB",
  "linux-shell": "#FCC624",
  "git-version-control": "#F05032",
  "testing-qa": "#43B02A",
  "software-testing": "#43B02A",
  "agile-scrum": "#009FDA",
  // Oracle Technologies
  "oracle-sql": "#F80000",
  "oracle-plsql": "#F80000",
  "oracle-dba": "#F80000",
  "oracle-fusion": "#F80000",
  "oci": "#F80000",
  "oracle-rman": "#F80000",
  "oracle-rac": "#F80000",
  "oracle-asm": "#F80000",
  "oracle-odi": "#F80000",
  "oracle-goldengate": "#F80000",
  "oracle-bi-publisher": "#F80000",
  "oracle-analytics-cloud": "#F80000",
  "oracle-apps-technical": "#F80000",
  "oracle-financials": "#F80000",
  "oracle-scm": "#F80000",
  "oracle-hcm": "#F80000",
  "oracle-projects": "#F80000",
  // Microsoft Technologies
  "csharp": "#239120",
  "dotnet-core": "#512BD4",
  "azure-fundamentals": "#0078D4",
  "sql-server": "#CC2927",
  "power-platform": "#742774",
  "dynamics-365": "#002050",
  // SAP Expanded
  "sap-abap": "#0FAAFF",
  "sap-fico": "#0FAAFF",
  "sap-mm": "#0FAAFF",
  // UI/UX
  "ui-ux-design": "#FF61F6",
  "figma": "#F24E1E",
  // Testing
  "selenium": "#43B02A",
  "cypress": "#17202C",
  "api-testing": "#FF6C37",
  // Networking
  "computer-networks": "#1BA0D8",
  "linux-admin": "#FCC624",
  // Digital Marketing
  "digital-marketing": "#4285F4",
  "seo": "#47C51D",
  // Databases
  "sql-fundamentals": "#336791",
  // IT Support
  "it-support-fundamentals": "#00B388",
  "help-desk": "#00B388",
  "itil": "#5C2D91",
  "service-desk": "#00B388",
  "servicenow": "#81B5A1",
  "business-analysis": "#2E86AB",
  "project-management": "#F18F01",
};

interface TechIconProps {
  techId: string;
  className?: string;
  size?: number;
  useColor?: boolean;
}

export function TechIcon({ techId, className = "", size = 32, useColor = true }: TechIconProps) {
  // Normalize the techId (lowercase, handle variations)
  const normalizedId = techId.toLowerCase().replace(/\s+/g, "-");

  // Find the icon
  const IconComponent = techIconMap[normalizedId];

  // Find the color
  const color = useColor ? (techColorMap[normalizedId] || "#8B5CF6") : "currentColor";

  if (IconComponent) {
    return <IconComponent className={className} size={size} color={color} />;
  }

  // Fallback: return a default icon with the first letter
  return (
    <div
      className={`flex items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 text-white font-bold ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.5 }}
    >
      {techId.charAt(0).toUpperCase()}
    </div>
  );
}

// Category icons for the filter buttons
export const categoryIconMap: Record<string, IconType> = {
  "programming": FaCode,
  "frontend": SiReact,
  "backend": FaServer,
  "fullstack": FaLayerGroup,
  "cloud": FaCloud,
  "devops": FaCogs,
  "data": FaDatabase,
  "bi": FaChartBar,
  "ai": FaBrain,
  "enterprise": FaBuilding,
  "security": FaLock,
  // New categories
  "mobile": FaMobileAlt,
  "database": FaDatabase,
  "uiux": FaPalette,
  "networking": FaNetworkWired,
  "itbusiness": FaBriefcase,
  "digitalmarketing": FaBullhorn,
  "oracle": SiOracle,
  "microsoft": FaMicrosoft,
  "testing": FaVial,
};

interface CategoryIconProps {
  categoryId: string;
  className?: string;
  size?: number;
}

export function CategoryIcon({ categoryId, className = "", size = 16 }: CategoryIconProps) {
  const IconComponent = categoryIconMap[categoryId];

  if (IconComponent) {
    return <IconComponent className={className} size={size} />;
  }

  return null;
}

export default TechIcon;
