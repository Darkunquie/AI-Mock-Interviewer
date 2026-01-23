import Groq from "groq-sdk";

if (!process.env.GROQ_API_KEY) {
  console.warn("GROQ_API_KEY not set. AI features will not work.");
}

export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "",
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
) {
  const response = await groq.chat.completions.create({
    model: options?.model || GROQ_MODEL,
    messages,
    temperature: options?.temperature ?? 0.7,
    max_tokens: options?.maxTokens ?? 2048,
    response_format: { type: "json_object" },
  });

  return response.choices[0]?.message?.content || "";
}

export default groq;
