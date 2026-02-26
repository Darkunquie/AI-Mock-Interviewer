import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { FlashCardGenerator, LOG_PREFIX } from "@/lib/flashcards";
import { generateFlashCardsSchema, validateRequest } from "@/lib/validations";
import { logger } from "@/lib/logger";

/**
 * POST - Generate flash cards for a technology + topic
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
    const validation = validateRequest(generateFlashCardsSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { technology, topic, count } = validation.data;

    logger.info(`${LOG_PREFIX} Request: ${technology} - ${topic} (${count} cards)`);

    // Generate flash cards
    const result = await FlashCardGenerator.getCards(technology, topic, count);

    return NextResponse.json(result);
  } catch (error) {
    logger.error(`${LOG_PREFIX} Unexpected error`, error instanceof Error ? error : new Error(String(error)));
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to generate flash cards: ${message}` },
      { status: 500 }
    );
  }
}
