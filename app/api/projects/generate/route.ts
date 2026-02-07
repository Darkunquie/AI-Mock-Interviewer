import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { ProjectGenerator, LOG_PREFIX } from "@/lib/projects";
import { GenerateProjectsRequest, GenerateProjectsResponse } from "@/types/project";

/**
 * GET - Check if technology+domain combination exists
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    console.error(`${LOG_PREFIX} Check combination error:`, error);
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check API key
    if (!process.env.GROQ_API_KEY) {
      console.error(`${LOG_PREFIX} GROQ_API_KEY not configured`);
      return NextResponse.json(
        { error: "AI service not configured. Please contact administrator." },
        { status: 500 }
      );
    }

    const body: GenerateProjectsRequest = await request.json();
    const { technology, domain } = body;

    if (!technology || !domain) {
      return NextResponse.json(
        { error: "Missing required fields: technology, domain" },
        { status: 400 }
      );
    }

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
    console.error(`${LOG_PREFIX} Unexpected error:`, error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to generate projects: ${message}` },
      { status: 500 }
    );
  }
}
