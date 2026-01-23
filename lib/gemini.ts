import { GoogleGenerativeAI } from "@google/generative-ai";

// Gemini as fallback when Groq fails
const genAI = process.env.GOOGLE_GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY)
  : null;

export const GEMINI_MODEL = "gemini-2.0-flash-lite"; // Cheapest option

export async function generateWithGemini(prompt: string): Promise<string> {
  if (!genAI) {
    throw new Error("GOOGLE_GEMINI_API_KEY not configured");
  }

  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2048,
      responseMimeType: "application/json",
    },
  });

  const result = await model.generateContent(prompt);
  const response = result.response;
  return response.text();
}

export default genAI;
