import { v4 as uuidv4 } from "uuid";
import { getMermaidImageUrl } from "@/lib/mermaid";
import { ProjectSpecification } from "@/types/project";
import { LOG_PREFIX } from "./constants";
import { projectOutSchema } from "@/lib/validations/ai";

/**
 * Clean JSON response from AI (remove markdown code blocks)
 */
export function cleanJsonResponse(response: string): string {
  let cleaned = response.trim();
  if (cleaned.startsWith("```json")) cleaned = cleaned.slice(7);
  if (cleaned.startsWith("```")) cleaned = cleaned.slice(3);
  if (cleaned.endsWith("```")) cleaned = cleaned.slice(0, -3);
  return cleaned.trim();
}

/**
 * Parse and validate AI response
 */
export function parseProjectsResponse(jsonString: string): Record<string, unknown>[] {
  const cleaned = cleanJsonResponse(jsonString);

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    console.error(`${LOG_PREFIX} JSON parse failed. First 500 chars:`, cleaned.slice(0, 500));
    throw new Error("Failed to parse AI response as JSON");
  }

  if (!parsed.projects || !Array.isArray(parsed.projects)) {
    console.error(`${LOG_PREFIX} Invalid format. Keys found:`, Object.keys(parsed));
    throw new Error("Invalid response format: missing projects array");
  }

  return parsed.projects;
}

/**
 * Sanitize and enrich a single project with metadata
 */
export function sanitizeProject(
  project: Record<string, unknown>,
  technology: string,
  domain: string
): ProjectSpecification {
  // Add workflow diagram image URLs
  const workflowDiagrams = Array.isArray(project.workflowDiagrams)
    ? (project.workflowDiagrams as Array<{ mermaidCode?: string }>).map((diagram) => ({
        ...diagram,
        imageUrl: diagram.mermaidCode ? getMermaidImageUrl(diagram.mermaidCode) : "",
      }))
    : [];

  return {
    ...project,
    id: uuidv4(),
    technology,
    domain,
    createdAt: new Date().toISOString(),
    workflowDiagrams,
  } as ProjectSpecification;
}

/**
 * Validate and transform all projects
 */
export function validateAndTransformProjects(
  rawProjects: Record<string, unknown>[],
  technology: string,
  domain: string
): ProjectSpecification[] {
  console.log(`${LOG_PREFIX} Validating ${rawProjects.length} projects`);

  // Drop projects missing core fields; never cache an empty result (the
  // caller only persists on success, so throwing keeps the cache clean).
  const valid = rawProjects.flatMap((p) => {
    const r = projectOutSchema.safeParse(p);
    if (!r.success) console.warn(`${LOG_PREFIX} Dropping invalid project:`, r.error.issues[0]);
    return r.success ? [r.data] : [];
  });
  if (valid.length === 0) throw new Error("AI returned no valid projects");

  const projects = valid.map((project) =>
    sanitizeProject(project, technology, domain)
  );

  console.log(`${LOG_PREFIX} Validation complete`);
  return projects;
}

/**
 * Full validation pipeline: parse JSON -> validate -> transform
 */
export function processAIResponse(
  jsonString: string,
  technology: string,
  domain: string
): ProjectSpecification[] {
  const rawProjects = parseProjectsResponse(jsonString);
  return validateAndTransformProjects(rawProjects, technology, domain);
}
