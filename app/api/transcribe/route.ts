import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_WHISPER_URL = "https://api.groq.com/openai/v1/audio/transcriptions";
const WHISPER_MODEL = "whisper-large-v3-turbo";
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
const MIN_FILE_SIZE = 1000; // 1KB

/**
 * POST /api/transcribe
 * Transcribes audio using Groq Whisper API
 */
export async function POST(request: Request) {
  try {
    // Auth check
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Config check
    if (!GROQ_API_KEY) {
      return NextResponse.json(
        { success: false, error: "Transcription service not configured" },
        { status: 500 }
      );
    }

    // Parse request
    const formData = await request.formData();
    const audioFile = formData.get("audio");

    if (!audioFile || !(audioFile instanceof File)) {
      return NextResponse.json(
        { success: false, error: "No audio file provided" },
        { status: 400 }
      );
    }

    // Skip small files (likely silence)
    if (audioFile.size < MIN_FILE_SIZE) {
      return NextResponse.json({ success: true, text: "" });
    }

    // Validate file size
    if (audioFile.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: "File too large (max 25MB)" },
        { status: 400 }
      );
    }

    // Call Groq Whisper API
    const groqFormData = new FormData();
    groqFormData.append("file", audioFile, "audio.webm");
    groqFormData.append("model", WHISPER_MODEL);
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
      console.error("[Transcribe] Groq error:", errorText);
      return NextResponse.json(
        { success: false, error: "Transcription failed" },
        { status: response.status }
      );
    }

    const result = await response.json();

    return NextResponse.json({
      success: true,
      text: result.text || "",
    });
  } catch (error) {
    console.error("[Transcribe] Error:", error);
    return NextResponse.json(
      { success: false, error: "Transcription failed" },
      { status: 500 }
    );
  }
}
