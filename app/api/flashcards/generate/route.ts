import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { FlashCardGenerator, LOG_PREFIX } from "@/lib/flashcards";
import { GenerateFlashCardsRequest } from "@/types/flashcard";

/**
 * POST - Generate flash cards for a technology + topic
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

    const body: GenerateFlashCardsRequest = await request.json();
    const { technology, topic, count = 10 } = body;

    if (!technology || !topic) {
      return NextResponse.json(
        { error: "Missing required fields: technology, topic" },
        { status: 400 }
      );
    }

    console.log(`${LOG_PREFIX} Request: ${technology} - ${topic} (${count} cards)`);

    // Generate flash cards
    const result = await FlashCardGenerator.getCards(technology, topic, count);

    return NextResponse.json(result);
  } catch (error) {
    console.error(`${LOG_PREFIX} Unexpected error:`, error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to generate flash cards: ${message}` },
      { status: 500 }
    );
  }
}
