import { describe, it, expect } from "vitest";
import {
  signUpSchema,
  signInSchema,
  createInterviewSchema,
  evaluateAnswerSchema,
  interviewSummarySchema,
  generateFlashCardsSchema,
  generateProjectsSchema,
  retakeInterviewSchema,
  adminUserActionSchema,
  paginationSchema,
  validateRequest,
} from "@/lib/validations";

// ==================== signUpSchema ====================
describe("signUpSchema", () => {
  it("accepts valid signup data", () => {
    const result = signUpSchema.safeParse({
      email: "test@example.com",
      password: "Password1",
      name: "John Doe",
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid signup with phone", () => {
    const result = signUpSchema.safeParse({
      email: "test@example.com",
      password: "Password1",
      name: "John Doe",
      phone: "+1 234-567-8901",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = signUpSchema.safeParse({
      email: "not-an-email",
      password: "Password1",
      name: "John Doe",
    });
    expect(result.success).toBe(false);
  });

  it("rejects weak password (no uppercase)", () => {
    const result = signUpSchema.safeParse({
      email: "test@example.com",
      password: "password1",
      name: "John Doe",
    });
    expect(result.success).toBe(false);
  });

  it("rejects weak password (no digit)", () => {
    const result = signUpSchema.safeParse({
      email: "test@example.com",
      password: "Password",
      name: "John Doe",
    });
    expect(result.success).toBe(false);
  });

  it("rejects short password", () => {
    const result = signUpSchema.safeParse({
      email: "test@example.com",
      password: "Pass1",
      name: "John Doe",
    });
    expect(result.success).toBe(false);
  });

  it("rejects short name", () => {
    const result = signUpSchema.safeParse({
      email: "test@example.com",
      password: "Password1",
      name: "J",
    });
    expect(result.success).toBe(false);
  });
});

// ==================== signInSchema ====================
describe("signInSchema", () => {
  it("accepts valid signin data", () => {
    const result = signInSchema.safeParse({
      email: "test@example.com",
      password: "any-password",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing password", () => {
    const result = signInSchema.safeParse({
      email: "test@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = signInSchema.safeParse({
      email: "bad",
      password: "password",
    });
    expect(result.success).toBe(false);
  });
});

// ==================== createInterviewSchema ====================
describe("createInterviewSchema", () => {
  it("accepts valid interview data", () => {
    const result = createInterviewSchema.safeParse({
      role: "frontend",
      experienceLevel: "1-3",
      interviewType: "technical",
    });
    expect(result.success).toBe(true);
  });

  it("applies defaults for optional fields", () => {
    const result = createInterviewSchema.safeParse({
      role: "backend",
      experienceLevel: "3-5",
      interviewType: "behavioral",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.mode).toBe("interview");
      expect(result.data.duration).toBe("15");
    }
  });

  it("rejects invalid role", () => {
    const result = createInterviewSchema.safeParse({
      role: "nonexistent",
      experienceLevel: "1-3",
      interviewType: "technical",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid experience level", () => {
    const result = createInterviewSchema.safeParse({
      role: "frontend",
      experienceLevel: "10+",
      interviewType: "technical",
    });
    expect(result.success).toBe(false);
  });

  it("accepts techStack array", () => {
    const result = createInterviewSchema.safeParse({
      role: "fullstack",
      experienceLevel: "5+",
      interviewType: "technical",
      techStack: ["React", "Node.js"],
    });
    expect(result.success).toBe(true);
  });

  it("rejects too many tech stack items", () => {
    const result = createInterviewSchema.safeParse({
      role: "fullstack",
      experienceLevel: "5+",
      interviewType: "technical",
      techStack: Array(11).fill("tech"),
    });
    expect(result.success).toBe(false);
  });
});

// ==================== evaluateAnswerSchema ====================
describe("evaluateAnswerSchema", () => {
  it("accepts valid evaluation data", () => {
    const result = evaluateAnswerSchema.safeParse({
      mockId: "550e8400-e29b-41d4-a716-446655440000",
      questionIndex: 0,
      questionText: "What is React?",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid UUID", () => {
    const result = evaluateAnswerSchema.safeParse({
      mockId: "not-a-uuid",
      questionIndex: 0,
      questionText: "What is React?",
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative question index", () => {
    const result = evaluateAnswerSchema.safeParse({
      mockId: "550e8400-e29b-41d4-a716-446655440000",
      questionIndex: -1,
      questionText: "What is React?",
    });
    expect(result.success).toBe(false);
  });
});

// ==================== interviewSummarySchema ====================
describe("interviewSummarySchema", () => {
  it("accepts valid UUID", () => {
    const result = interviewSummarySchema.safeParse({
      mockId: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid UUID", () => {
    const result = interviewSummarySchema.safeParse({
      mockId: "not-valid",
    });
    expect(result.success).toBe(false);
  });
});

// ==================== generateFlashCardsSchema ====================
describe("generateFlashCardsSchema", () => {
  it("accepts valid data with defaults", () => {
    const result = generateFlashCardsSchema.safeParse({
      technology: "React",
      topic: "Hooks",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.count).toBe(10);
    }
  });

  it("accepts custom count", () => {
    const result = generateFlashCardsSchema.safeParse({
      technology: "Python",
      topic: "Decorators",
      count: 5,
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty technology", () => {
    const result = generateFlashCardsSchema.safeParse({
      technology: "",
      topic: "Hooks",
    });
    expect(result.success).toBe(false);
  });

  it("rejects count over 20", () => {
    const result = generateFlashCardsSchema.safeParse({
      technology: "React",
      topic: "Hooks",
      count: 25,
    });
    expect(result.success).toBe(false);
  });
});

// ==================== generateProjectsSchema ====================
describe("generateProjectsSchema", () => {
  it("accepts valid data", () => {
    const result = generateProjectsSchema.safeParse({
      technology: "React",
      domain: "E-commerce",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.count).toBe(3);
    }
  });

  it("rejects empty domain", () => {
    const result = generateProjectsSchema.safeParse({
      technology: "React",
      domain: "",
    });
    expect(result.success).toBe(false);
  });
});

// ==================== retakeInterviewSchema ====================
describe("retakeInterviewSchema", () => {
  it("accepts valid UUID", () => {
    const result = retakeInterviewSchema.safeParse({
      interviewId: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
  });

  it("rejects non-UUID string", () => {
    const result = retakeInterviewSchema.safeParse({
      interviewId: "abc123",
    });
    expect(result.success).toBe(false);
  });
});

// ==================== adminUserActionSchema ====================
describe("adminUserActionSchema", () => {
  it("accepts numeric string ID", () => {
    const result = adminUserActionSchema.safeParse({ id: "123" });
    expect(result.success).toBe(true);
  });

  it("rejects non-numeric ID", () => {
    const result = adminUserActionSchema.safeParse({ id: "abc" });
    expect(result.success).toBe(false);
  });

  it("rejects empty ID", () => {
    const result = adminUserActionSchema.safeParse({ id: "" });
    expect(result.success).toBe(false);
  });
});

// ==================== paginationSchema ====================
describe("paginationSchema", () => {
  it("applies defaults", () => {
    const result = paginationSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
    }
  });

  it("coerces string values", () => {
    const result = paginationSchema.safeParse({ page: "3", limit: "50" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(3);
      expect(result.data.limit).toBe(50);
    }
  });

  it("rejects page less than 1", () => {
    const result = paginationSchema.safeParse({ page: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects limit over 100", () => {
    const result = paginationSchema.safeParse({ limit: 200 });
    expect(result.success).toBe(false);
  });
});

// ==================== validateRequest helper ====================
describe("validateRequest", () => {
  it("returns success with valid data", () => {
    const result = validateRequest(signInSchema, {
      email: "test@example.com",
      password: "password",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("test@example.com");
    }
  });

  it("returns error with invalid data", () => {
    const result = validateRequest(signInSchema, {
      email: "bad",
      password: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.length).toBeGreaterThan(0);
    }
  });
});
