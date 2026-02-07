import { generateCompletion } from "@/lib/groq";
import { FlashCard, GenerateFlashCardsResponse } from "@/types/flashcard";
import { FLASHCARD_CONFIG, LOG_PREFIX } from "./constants";
import { buildSystemPrompt, buildUserPrompt } from "./prompts";
import { processAIResponse } from "./validator";

/**
 * FlashCardGenerator - Generates flash cards using AI
 */
export class FlashCardGenerator {
  /**
   * Generate flash cards for a technology + topic combination
   */
  static async generate(
    technology: string,
    topic: string,
    count: number = FLASHCARD_CONFIG.defaultCount
  ): Promise<FlashCard[]> {
    console.log(`${LOG_PREFIX} Generating ${count} cards for: ${technology} - ${topic}`);

    const systemPrompt = buildSystemPrompt();
    const userPrompt = buildUserPrompt(technology, topic, count);

    let cardsJson: string;

    // Try primary model first
    try {
      console.log(`${LOG_PREFIX} Trying primary model (${FLASHCARD_CONFIG.model})...`);
      cardsJson = await generateCompletion(
        [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        {
          model: FLASHCARD_CONFIG.model,
          maxTokens: FLASHCARD_CONFIG.maxTokens,
          temperature: FLASHCARD_CONFIG.temperature,
        }
      );
    } catch (primaryError) {
      console.error(`${LOG_PREFIX} Primary model failed:`, primaryError);

      // Try fallback model
      try {
        console.log(`${LOG_PREFIX} Trying fallback model (${FLASHCARD_CONFIG.fallbackModel})...`);
        cardsJson = await generateCompletion(
          [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          {
            model: FLASHCARD_CONFIG.fallbackModel,
            maxTokens: FLASHCARD_CONFIG.maxTokens,
            temperature: FLASHCARD_CONFIG.temperature,
          }
        );
      } catch (fallbackError) {
        console.error(`${LOG_PREFIX} Fallback model also failed:`, fallbackError);
        const errorMsg = primaryError instanceof Error ? primaryError.message : "Unknown error";
        throw new Error(`AI service error: ${errorMsg}`);
      }
    }

    console.log(`${LOG_PREFIX} AI response received. Length: ${cardsJson.length} chars`);

    // Parse and validate response
    const cards = processAIResponse(cardsJson, technology, topic);
    console.log(`${LOG_PREFIX} Generated ${cards.length} cards successfully`);

    return cards;
  }

  /**
   * Generate flash cards with response wrapper
   */
  static async getCards(
    technology: string,
    topic: string,
    count?: number
  ): Promise<GenerateFlashCardsResponse> {
    try {
      const cards = await this.generate(technology, topic, count);
      return {
        success: true,
        cards,
      };
    } catch (error) {
      console.error(`${LOG_PREFIX} Generation failed:`, error);
      return {
        success: false,
        cards: [],
        error: error instanceof Error ? error.message : "Failed to generate flash cards",
      };
    }
  }
}
