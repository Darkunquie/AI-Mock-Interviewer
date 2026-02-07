import { v4 as uuidv4 } from "uuid";
import { FlashCard } from "@/types/flashcard";
import { LOG_PREFIX } from "./constants";

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
export function parseFlashCardsResponse(jsonString: string): Record<string, unknown>[] {
  const cleaned = cleanJsonResponse(jsonString);

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (error) {
    console.error(`${LOG_PREFIX} JSON parse failed. First 500 chars:`, cleaned.slice(0, 500));
    throw new Error("Failed to parse AI response as JSON");
  }

  if (!parsed.cards || !Array.isArray(parsed.cards)) {
    console.error(`${LOG_PREFIX} Invalid format. Keys found:`, Object.keys(parsed));
    throw new Error("Invalid response format: missing cards array");
  }

  return parsed.cards;
}

/**
 * Sanitize and validate a single flash card
 */
export function sanitizeCard(
  card: Record<string, unknown>,
  technology: string,
  topic: string
): FlashCard {
  return {
    id: (card.id as string) || uuidv4(),
    front: (card.front as string) || "Question not available",
    back: (card.back as string) || "Answer not available",
    difficulty: (card.difficulty as "easy" | "medium" | "hard") || "medium",
    tags: Array.isArray(card.tags) ? (card.tags as string[]) : [technology, topic],
    hint: card.hint as string | undefined,
    codeSnippet: card.codeSnippet as string | undefined,
  };
}

/**
 * Full validation pipeline: parse JSON -> validate -> transform
 */
export function processAIResponse(
  jsonString: string,
  technology: string,
  topic: string
): FlashCard[] {
  const rawCards = parseFlashCardsResponse(jsonString);

  const cards = rawCards.map((card) =>
    sanitizeCard(card, technology, topic)
  );

  console.log(`${LOG_PREFIX} Processed ${cards.length} flash cards`);
  return cards;
}
