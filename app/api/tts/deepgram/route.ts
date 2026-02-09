import { NextRequest, NextResponse } from "next/server";

const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;

// Deepgram Aura voices
export const DEEPGRAM_VOICES = {
  "aura-asteria-en": "Asteria (Female, US)",
  "aura-luna-en": "Luna (Female, US)",
  "aura-stella-en": "Stella (Female, US)",
  "aura-athena-en": "Athena (Female, UK)",
  "aura-hera-en": "Hera (Female, US)",
  "aura-orion-en": "Orion (Male, US)",
  "aura-arcas-en": "Arcas (Male, US)",
  "aura-perseus-en": "Perseus (Male, US)",
  "aura-angus-en": "Angus (Male, Irish)",
  "aura-orpheus-en": "Orpheus (Male, US)",
  "aura-helios-en": "Helios (Male, UK)",
  "aura-zeus-en": "Zeus (Male, US)",
} as const;

export type DeepgramVoice = keyof typeof DEEPGRAM_VOICES;

export async function POST(request: NextRequest) {
  try {
    if (!DEEPGRAM_API_KEY) {
      return NextResponse.json(
        { error: "Deepgram API key not configured" },
        { status: 500 }
      );
    }

    const { text, voice = "aura-asteria-en" } = await request.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Text is required" },
        { status: 400 }
      );
    }

    // Deepgram has a limit of ~2000 characters per request
    const truncatedText = text.slice(0, 2000);

    const response = await fetch(
      `https://api.deepgram.com/v1/speak?model=${voice}&encoding=mp3`,
      {
        method: "POST",
        headers: {
          Authorization: `Token ${DEEPGRAM_API_KEY}`,
          "Content-Type": "text/plain",
        },
        body: truncatedText,
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("Deepgram TTS error:", error);
      return NextResponse.json(
        { error: "Failed to generate speech" },
        { status: response.status }
      );
    }

    const audioBuffer = await response.arrayBuffer();

    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.byteLength.toString(),
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Deepgram TTS API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
