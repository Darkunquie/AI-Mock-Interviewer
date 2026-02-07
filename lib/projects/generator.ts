import { db } from "@/lib/db";
import { generatedProjects } from "@/utils/schema";
import { eq, and } from "drizzle-orm";
import { generateCompletion } from "@/lib/groq";
import { ProjectSpecification, GenerateProjectsResponse } from "@/types/project";
import { AI_CONFIG, LOG_PREFIX } from "./constants";
import { buildSystemPrompt, buildUserPrompt } from "./prompts";
import { processAIResponse } from "./validator";

/**
 * ProjectGenerator - Main service for project generation
 */
export class ProjectGenerator {
  /**
   * Check if a technology+domain combination exists in database
   */
  static async checkExists(technology: string, domain: string): Promise<boolean> {
    const existing = await db
      .select({ id: generatedProjects.id })
      .from(generatedProjects)
      .where(
        and(
          eq(generatedProjects.technology, technology),
          eq(generatedProjects.domain, domain)
        )
      )
      .limit(1);

    return existing.length > 0;
  }

  /**
   * Get cached projects from database
   * Returns null if not found
   */
  static async getCached(
    technology: string,
    domain: string
  ): Promise<{ projects: ProjectSpecification[]; cachedAt: string } | null> {
    console.log(`${LOG_PREFIX} Checking cache for: ${technology} + ${domain}`);

    const cached = await db
      .select()
      .from(generatedProjects)
      .where(
        and(
          eq(generatedProjects.technology, technology),
          eq(generatedProjects.domain, domain)
        )
      )
      .limit(1);

    if (cached.length > 0) {
      console.log(`${LOG_PREFIX} Cache hit!`);
      const projects = JSON.parse(cached[0].projectsJson);
      return {
        projects,
        cachedAt: cached[0].createdAt?.toISOString() || new Date().toISOString(),
      };
    }

    console.log(`${LOG_PREFIX} Cache miss`);
    return null;
  }

  /**
   * Generate new projects using AI
   */
  static async generate(
    technology: string,
    domain: string
  ): Promise<ProjectSpecification[]> {
    console.log(`${LOG_PREFIX} Generating new projects with AI...`);

    const systemPrompt = buildSystemPrompt();
    const userPrompt = buildUserPrompt(technology, domain);

    let projectsJson: string;

    // Try primary model first
    try {
      console.log(`${LOG_PREFIX} Trying primary model (${AI_CONFIG.primaryModel})...`);
      projectsJson = await generateCompletion(
        [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        {
          model: AI_CONFIG.primaryModel,
          maxTokens: AI_CONFIG.primaryMaxTokens,
          temperature: AI_CONFIG.temperature,
        }
      );
    } catch (primaryError) {
      console.error(`${LOG_PREFIX} Primary model failed:`, primaryError);

      // Try fallback model
      try {
        console.log(`${LOG_PREFIX} Trying fallback model (${AI_CONFIG.fallbackModel})...`);
        projectsJson = await generateCompletion(
          [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          {
            model: AI_CONFIG.fallbackModel,
            maxTokens: AI_CONFIG.fallbackMaxTokens,
            temperature: AI_CONFIG.temperature,
          }
        );
      } catch (fallbackError) {
        console.error(`${LOG_PREFIX} Fallback model also failed:`, fallbackError);
        const errorMsg = primaryError instanceof Error ? primaryError.message : "Unknown error";
        throw new Error(`AI service error: ${errorMsg}`);
      }
    }

    console.log(`${LOG_PREFIX} AI response received. Length: ${projectsJson.length} chars`);

    // Parse and validate response
    const projects = processAIResponse(projectsJson, technology, domain);
    console.log(`${LOG_PREFIX} Processed ${projects.length} projects successfully`);

    return projects;
  }

  /**
   * Save projects to database
   */
  static async save(
    technology: string,
    domain: string,
    projects: ProjectSpecification[]
  ): Promise<void> {
    try {
      await db.insert(generatedProjects).values({
        technology,
        domain,
        projectsJson: JSON.stringify(projects),
      });
      console.log(`${LOG_PREFIX} Saved to database successfully`);
    } catch (error) {
      console.error(`${LOG_PREFIX} Database save failed:`, error);
      // Don't throw - return projects even if save fails
    }
  }

  /**
   * Full generation flow: check cache -> generate -> save
   */
  static async getOrGenerate(
    technology: string,
    domain: string
  ): Promise<GenerateProjectsResponse> {
    // Check cache first
    const cached = await this.getCached(technology, domain);
    if (cached) {
      return {
        success: true,
        projects: cached.projects,
        cached: true,
        cachedAt: cached.cachedAt,
      };
    }

    // Generate new projects
    const projects = await this.generate(technology, domain);

    // Save to database
    await this.save(technology, domain, projects);

    return {
      success: true,
      projects,
      cached: false,
    };
  }
}
