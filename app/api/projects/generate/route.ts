import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { ProjectGenerator, LOG_PREFIX } from "@/lib/projects";
import { GenerateProjectsResponse } from "@/types/project";
import { generateProjectsSchema, validateRequest } from "@/lib/validations";
import { logger } from "@/lib/logger";
import { Errors, handleZodError, handleUnexpectedError } from "@/lib/errors";

/**
 * GET - Check if technology+domain combination exists
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return Errors.unauthorized();

    const { searchParams } = new URL(request.url);
    const technology = searchParams.get("technology");
    const domain = searchParams.get("domain");

    if (!technology || !domain) {
      return NextResponse.json({ exists: false });
    }

    const exists = await ProjectGenerator.checkExists(technology, domain);
    return NextResponse.json({ exists });
  } catch (error) {
    logger.error(`${LOG_PREFIX} Check combination error`, error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ exists: false });
  }
}

/**
 * POST - Generate or return cached projects
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return Errors.unauthorized();

    if (!process.env.GROQ_API_KEY) {
      logger.error(`${LOG_PREFIX} GROQ_API_KEY not configured`);
      return Errors.aiServiceError();
    }

    const body = await request.json();
    const validation = validateRequest(generateProjectsSchema, body);
    if (!validation.success) return handleZodError(validation.error);

    const { technology, domain } = validation.data;
    const result = await ProjectGenerator.getOrGenerate(technology, domain);

    const response: GenerateProjectsResponse = {
      success: result.success,
      projects: result.projects,
      cached: result.cached,
      cachedAt: result.cachedAt,
    };
    return NextResponse.json(response);
  } catch (error) {
    return handleUnexpectedError(error, "projects/generate");
  }
}
