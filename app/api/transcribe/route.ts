import { NextResponse } from "next/server";
import { groq } from "@/lib/groq";
import { getCurrentUser } from "@/lib/auth";

// Whisper model for transcription
const WHISPER_MODEL = "whisper-large-v3";

export async function POST(request: Request) {
  try {
    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const audioFile = formData.get("audio");

    if (!audioFile || !(audioFile instanceof File)) {
      return NextResponse.json(
        { success: false, error: "No audio file provided" },
        { status: 400 }
      );
    }

    // Validate file size (max 25MB for Whisper)
    const maxSize = 25 * 1024 * 1024; // 25MB
    if (audioFile.size > maxSize) {
      return NextResponse.json(
        { success: false, error: "Audio file too large. Maximum 25MB allowed." },
        { status: 400 }
      );
    }

    // Get optional language parameter (defaults to English)
    const language = (formData.get("language") as string) || "en";

    // Call Groq Whisper API for transcription
    const transcription = await groq.audio.transcriptions.create({
      file: audioFile,
      model: WHISPER_MODEL,
      language: language,
    });

    return NextResponse.json({
      success: true,
      text: transcription.text,
    });
  } catch (error) {
    console.error("[Transcribe] Error:", error);

    // Handle specific Groq errors
    if (error instanceof Error) {
      if (error.message.includes("rate limit")) {
        return NextResponse.json(
          { success: false, error: "Rate limit exceeded. Please try again later." },
          { status: 429 }
        );
      }
      if (error.message.includes("invalid_api_key")) {
        return NextResponse.json(
          { success: false, error: "Transcription service unavailable." },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: "Failed to transcribe audio" },
      { status: 500 }
    );
  }
}
