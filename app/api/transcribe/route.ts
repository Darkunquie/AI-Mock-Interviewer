import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { Errors, handleUnexpectedError } from "@/lib/errors";
import { checkAiQuota } from "@/lib/quota";

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_WHISPER_URL = "https://api.groq.com/openai/v1/audio/transcriptions";
const WHISPER_MODEL = "whisper-large-v3-turbo";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB — an answer clip; smaller than the old 25MB
const MIN_FILE_SIZE = 1000; // 1KB
// Transcribe is high-frequency (one call per answer), so it gets its own larger
// daily bucket than the generation quota.
const TRANSCRIBE_DAILY_QUOTA = Number.parseInt(process.env.AI_TRANSCRIBE_DAILY_QUOTA || "600", 10);

/**
 * POST /api/transcribe
 * Transcribes audio using Groq Whisper API
 */
export async function POST(request: Request) {
  try {
    // Auth check
    const user = await getCurrentUser();
    if (!user) return Errors.unauthorized();

    // Per-user daily cap (separate high-frequency bucket)
    const quota = await checkAiQuota(user.id, { bucket: "transcribe", limit: TRANSCRIBE_DAILY_QUOTA });
    if (!quota.allowed) {
      return Errors.quotaExceeded(quota.disabled ? "AI features are temporarily disabled." : undefined);
    }

    // Config check
    if (!GROQ_API_KEY) return Errors.aiServiceError();

    // Parse request
    const formData = await request.formData();
    const audioFile = formData.get("audio");

    if (!audioFile || !(audioFile instanceof File)) {
      return Errors.badRequest("No audio file provided");
    }

    // Skip small files (likely silence)
    if (audioFile.size < MIN_FILE_SIZE) {
      return NextResponse.json({ success: true, text: "" });
    }

    // Validate file size
    if (audioFile.size > MAX_FILE_SIZE) {
      return Errors.fileTooLarge("10MB");
    }

    // Call Groq Whisper API
    const groqFormData = new FormData();
    groqFormData.append("file", audioFile, "audio.webm");
    groqFormData.append("model", WHISPER_MODEL);
    groqFormData.append("language", "en");
    groqFormData.append("response_format", "json");

    const response = await fetch(GROQ_WHISPER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: groqFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error("[Transcribe] Groq error", new Error(errorText));
      return Errors.aiServiceError();
    }

    const result = await response.json();

    return NextResponse.json({
      success: true,
      text: result.text || "",
    });
  } catch (error) {
    return handleUnexpectedError(error, "transcribe");
  }
}
