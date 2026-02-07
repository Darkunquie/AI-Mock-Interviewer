// Project Domains - Industry verticals for project generation

export interface ProjectDomain {
  id: string;
  name: string;
  icon: string;
  description: string;
  commonFeatures: string[];
  sampleProjects: string[];
}

export const PROJECT_DOMAINS: ProjectDomain[] = [
  {
    id: "healthcare",
    name: "Healthcare",
    icon: "🏥",
    description: "Medical and health-related applications including patient management, telemedicine, and health tracking",
    commonFeatures: [
      "Patient records management",
      "Appointment scheduling",
      "Prescription management",
      "Medical history tracking",
      "Lab results integration",
      "Telemedicine consultations",
      "Health metrics dashboard",
      "Insurance claims processing",
    ],
    sampleProjects: [
      "Patient Portal",
      "Clinic Management System",
      "Health Tracking App",
      "Telemedicine Platform",
    ],
  },
  {
    id: "finance",
    name: "Finance",
    icon: "💰",
    description: "Banking, payments, investment tracking, and financial management applications",
    commonFeatures: [
      "Account management",
      "Transaction history",
      "Payment processing",
      "Budget tracking",
      "Investment portfolio",
      "Financial reports",
      "Bill reminders",
      "Expense categorization",
    ],
    sampleProjects: [
      "Personal Finance Tracker",
      "Banking Dashboard",
      "Investment Portfolio Manager",
      "Expense Management System",
    ],
  },
  {
    id: "ecommerce",
    name: "E-commerce",
    icon: "🛒",
    description: "Online shopping platforms, retail management, and marketplace applications",
    commonFeatures: [
      "Product catalog",
      "Shopping cart",
      "Checkout process",
      "Order tracking",
      "Inventory management",
      "Customer reviews",
      "Wishlist",
      "Payment gateway integration",
    ],
    sampleProjects: [
      "Online Store",
      "Marketplace Platform",
      "Inventory Management System",
      "Order Fulfillment Dashboard",
    ],
  },
  {
    id: "education",
    name: "Education",
    icon: "📚",
    description: "Learning management, educational tools, and academic administration systems",
    commonFeatures: [
      "Course management",
      "Student enrollment",
      "Assignment submission",
      "Quiz/exam system",
      "Progress tracking",
      "Grade book",
      "Discussion forums",
      "Certificate generation",
    ],
    sampleProjects: [
      "Learning Management System",
      "Online Quiz Platform",
      "Student Portal",
      "Course Marketplace",
    ],
  },
  {
    id: "social_media",
    name: "Social Media",
    icon: "💬",
    description: "Social networking, communication platforms, and community building applications",
    commonFeatures: [
      "User profiles",
      "Posts and feeds",
      "Comments and reactions",
      "Friend/follow system",
      "Notifications",
      "Direct messaging",
      "Media sharing",
      "Content moderation",
    ],
    sampleProjects: [
      "Social Network",
      "Messaging App",
      "Community Forum",
      "Content Sharing Platform",
    ],
  },
  {
    id: "logistics",
    name: "Logistics",
    icon: "📦",
    description: "Supply chain, delivery management, and warehouse operations systems",
    commonFeatures: [
      "Inventory tracking",
      "Order management",
      "Shipment tracking",
      "Route optimization",
      "Warehouse management",
      "Delivery scheduling",
      "Fleet management",
      "Barcode/QR scanning",
    ],
    sampleProjects: [
      "Delivery Tracking System",
      "Warehouse Management",
      "Fleet Management Dashboard",
      "Supply Chain Monitor",
    ],
  },
];

// Helper function to get domain by ID
export function getDomainById(id: string): ProjectDomain | undefined {
  return PROJECT_DOMAINS.find((domain) => domain.id === id);
}

// Get all domain IDs
export const DOMAIN_IDS = PROJECT_DOMAINS.map((d) => d.id);
