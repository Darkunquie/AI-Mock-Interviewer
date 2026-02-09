import { NextRequest, NextResponse } from "next/server";
import { TextToSpeechClient, protos } from "@google-cloud/text-to-speech";

// Initialize the client with credentials from environment
let client: TextToSpeechClient | null = null;

function getClient(): TextToSpeechClient {
  if (!client) {
    const credentials = process.env.GOOGLE_CLOUD_CREDENTIALS;
    if (!credentials) {
      throw new Error("GOOGLE_CLOUD_CREDENTIALS not configured");
    }

    try {
      const parsedCredentials = JSON.parse(credentials);
      client = new TextToSpeechClient({
        credentials: parsedCredentials,
        projectId: parsedCredentials.project_id,
      });
    } catch {
      throw new Error("Invalid GOOGLE_CLOUD_CREDENTIALS format");
    }
  }
  return client;
}

// Available voices for the frontend
export const GOOGLE_VOICES = {
  // Neural2 voices (highest quality)
  "en-US-Neural2-A": { gender: "MALE", description: "US English Male (Neural2)" },
  "en-US-Neural2-C": { gender: "FEMALE", description: "US English Female (Neural2)" },
  "en-US-Neural2-D": { gender: "MALE", description: "US English Male 2 (Neural2)" },
  "en-US-Neural2-E": { gender: "FEMALE", description: "US English Female 2 (Neural2)" },
  "en-US-Neural2-F": { gender: "FEMALE", description: "US English Female 3 (Neural2)" },
  "en-US-Neural2-G": { gender: "FEMALE", description: "US English Female 4 (Neural2)" },
  "en-US-Neural2-H": { gender: "FEMALE", description: "US English Female 5 (Neural2)" },
  "en-US-Neural2-I": { gender: "MALE", description: "US English Male 3 (Neural2)" },
  "en-US-Neural2-J": { gender: "MALE", description: "US English Male 4 (Neural2)" },
  // WaveNet voices (high quality)
  "en-US-Wavenet-A": { gender: "MALE", description: "US English Male (WaveNet)" },
  "en-US-Wavenet-B": { gender: "MALE", description: "US English Male 2 (WaveNet)" },
  "en-US-Wavenet-C": { gender: "FEMALE", description: "US English Female (WaveNet)" },
  "en-US-Wavenet-D": { gender: "MALE", description: "US English Male 3 (WaveNet)" },
  "en-US-Wavenet-E": { gender: "FEMALE", description: "US English Female 2 (WaveNet)" },
  "en-US-Wavenet-F": { gender: "FEMALE", description: "US English Female 3 (WaveNet)" },
} as const;

export type GoogleVoice = keyof typeof GOOGLE_VOICES;

export async function POST(request: NextRequest) {
  try {
    const ttsClient = getClient();

    const { text, voice = "en-US-Neural2-C", speakingRate = 1.0, pitch = 0 } = await request.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Text is required" },
        { status: 400 }
      );
    }

    // Limit text length (Google TTS has a 5000 byte limit per request)
    const truncatedText = text.slice(0, 4500);

    // Extract language code from voice name
    const languageCode = voice.split("-").slice(0, 2).join("-");

    const synthesisRequest: protos.google.cloud.texttospeech.v1.ISynthesizeSpeechRequest = {
      input: { text: truncatedText },
      voice: {
        languageCode,
        name: voice,
      },
      audioConfig: {
        audioEncoding: "MP3" as const,
        speakingRate: Math.max(0.25, Math.min(4.0, speakingRate)),
        pitch: Math.max(-20.0, Math.min(20.0, pitch)),
        effectsProfileId: ["headphone-class-device"], // Optimized for headphones
      },
    };

    const [response] = await ttsClient.synthesizeSpeech(synthesisRequest);

    if (!response.audioContent) {
      return NextResponse.json(
        { error: "Failed to generate audio" },
        { status: 500 }
      );
    }

    // Convert to Buffer if it's a Uint8Array
    const audioBuffer = Buffer.isBuffer(response.audioContent)
      ? response.audioContent
      : Buffer.from(response.audioContent);

    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.byteLength.toString(),
        "Cache-Control": "public, max-age=3600", // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error("Google TTS API error:", error);

    if (error instanceof Error) {
      if (error.message.includes("GOOGLE_CLOUD_CREDENTIALS")) {
        return NextResponse.json(
          { error: "Google Cloud credentials not configured" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to generate speech" },
      { status: 500 }
    );
  }
}
