import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { ProjectGenerator, LOG_PREFIX } from "@/lib/projects";
import { GenerateProjectsResponse } from "@/types/project";
import { generateProjectsSchema, validateRequest } from "@/lib/validations";
import { logger } from "@/lib/logger";

/**
 * GET - Check if technology+domain combination exists
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

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
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Check API key
    if (!process.env.GROQ_API_KEY) {
      logger.error(`${LOG_PREFIX} GROQ_API_KEY not configured`);
      return NextResponse.json(
        { success: false, error: "AI service not configured. Please contact administrator." },
        { status: 500 }
      );
    }

    const body = await request.json();

    // Validate input with Zod
    const validation = validateRequest(generateProjectsSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { technology, domain } = validation.data;

    // Use ProjectGenerator service
    const result = await ProjectGenerator.getOrGenerate(technology, domain);

    const response: GenerateProjectsResponse = {
      success: result.success,
      projects: result.projects,
      cached: result.cached,
      cachedAt: result.cachedAt,
    };

    return NextResponse.json(response);
  } catch (error) {
    logger.error(`${LOG_PREFIX} Unexpected error`, error instanceof Error ? error : new Error(String(error)));
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to generate projects: ${message}` },
      { status: 500 }
    );
  }
}
