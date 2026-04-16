import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { FlashCardGenerator, LOG_PREFIX } from "@/lib/flashcards";
import { generateFlashCardsSchema, validateRequest } from "@/lib/validations";
import { logger } from "@/lib/logger";
import { Errors, handleZodError, handleUnexpectedError } from "@/lib/errors";

/**
 * POST - Generate flash cards for a technology + topic
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
    const validation = validateRequest(generateFlashCardsSchema, body);
    if (!validation.success) return handleZodError(validation.error);

    const { technology, topic, count } = validation.data;
    logger.info(`${LOG_PREFIX} Request: ${technology} - ${topic} (${count} cards)`);

    const result = await FlashCardGenerator.getCards(technology, topic, count);
    return NextResponse.json(result);
  } catch (error) {
    return handleUnexpectedError(error, "flashcards/generate");
  }
}
