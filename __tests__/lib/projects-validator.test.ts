import { describe, it, expect, vi } from "vitest";
import { validateAndTransformProjects } from "@/lib/projects/validator";

describe("validateAndTransformProjects (AI output boundary)", () => {
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});

  it("coerces missing/garbage collections to safe defaults", () => {
    const [p] = validateAndTransformProjects(
      [{ title: "Chat app", description: "Realtime chat", difficulty: "expert", features: "lots" }],
      "React",
      "Social"
    );
    expect(p.features).toEqual([]);
    expect(p.learningOutcomes).toEqual([]);
    expect(p.workflowDiagrams).toEqual([]);
    expect(p.difficulty).toBe("intermediate");
    expect(p.technology).toBe("React");
  });

  it("drops null/primitive workflow diagrams instead of crashing", () => {
    const [p] = validateAndTransformProjects(
      [{ title: "t", description: "d", workflowDiagrams: [null, "x", { mermaidCode: "graph TD; A-->B" }] }],
      "React",
      "Social"
    );
    expect(p.workflowDiagrams).toHaveLength(1);
    expect(p.workflowDiagrams[0].imageUrl).toContain("mermaid.ink");
  });

  it("drops projects missing core fields", () => {
    const out = validateAndTransformProjects(
      [{ title: "ok", description: "fine" }, { description: "no title" }],
      "React",
      "Social"
    );
    expect(out).toHaveLength(1);
  });

  it("throws when nothing is valid, so nothing gets cached", () => {
    expect(() => validateAndTransformProjects([{ foo: 1 }], "React", "Social")).toThrow();
  });
});
