import Groq from "groq-sdk";
import { logger } from "./logger";

if (!process.env.GROQ_API_KEY) {
  console.warn("GROQ_API_KEY not set. AI features will not work.");
}

export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "",
  timeout: 30000, // 30 second timeout
  maxRetries: 2, // Retry up to 2 times on transient errors
});

// Default model configuration
export const GROQ_MODEL = "llama-3.1-8b-instant"; // Fast and cheap
export const GROQ_MODEL_QUALITY = "llama-3.3-70b-versatile"; // Better quality

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function generateCompletion(
  messages: ChatMessage[],
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }
): Promise<string> {
  const startTime = Date.now();
  const model = options?.model || GROQ_MODEL;

  try {
    const response = await groq.chat.completions.create({
      model,
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 2048,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    const duration = Date.now() - startTime;

    logger.info("AI completion", {
      model,
      duration,
      tokens: response.usage?.total_tokens,
    });

    if (!content) {
      logger.warn("AI returned empty content", { model, duration });
      return "";
    }

    return content;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(
      "AI completion failed",
      error instanceof Error ? error : new Error(String(error)),
      { model, duration }
    );
    throw error;
  }
}

export default groq;
