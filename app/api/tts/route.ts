import { NextResponse } from "next/server";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import { getCurrentUser } from "@/lib/auth";
import { Errors, handleUnexpectedError } from "@/lib/errors";
import { logger } from "@/lib/logger";

// Edge TTS uses a Microsoft neural-voice endpoint over a WebSocket — needs the
// Node runtime (not edge).
export const runtime = "nodejs";

// Natural male neural voice. Kept server-side so the client can't request an
// arbitrary one. Add more here if you want to offer a picker later.
// Default is male to match the current male interviewer avatar (avatarsdk).
const DEFAULT_VOICE = "en-IN-PrabhatNeural";
const ALLOWED_VOICES = new Set([
  // male (default)
  "en-IN-PrabhatNeural",
  "en-US-ChristopherNeural",
  "en-US-GuyNeural",
  "en-GB-RyanNeural",
  "en-AU-WilliamNeural",
  // female (selectable — use if you swap to a female avatar)
  "en-IN-NeerjaNeural",
  "en-IN-AnanyaNeural",
  "en-US-JennyNeural",
  "en-US-AriaNeural",
  "en-GB-SoniaNeural",
]);
const MAX_LEN = 2000;
const TTS_TIMEOUT_MS = 15_000;

/**
 * POST /api/tts
 * Body: { text: string, voice?: string }
 * Returns: audio/mpeg (MP3) of the text spoken in a natural male neural voice.
 */
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return Errors.unauthorized();

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Errors.badRequest("Invalid JSON");
    }

    const raw = (body as { text?: unknown })?.text;
    const text = typeof raw === "string" ? raw.trim() : "";
    if (!text) return Errors.badRequest("No text provided");

    const reqVoice = (body as { voice?: unknown })?.voice;
    const voice = typeof reqVoice === "string" && ALLOWED_VOICES.has(reqVoice) ? reqVoice : DEFAULT_VOICE;

    const tts = new MsEdgeTTS();
    const chunks: Buffer[] = [];
    try {
      await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
      const { audioStream } = tts.toStream(text.slice(0, MAX_LEN));
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error("TTS timeout")), TTS_TIMEOUT_MS);
        audioStream.on("data", (c: Buffer) => chunks.push(Buffer.from(c)));
        audioStream.on("end", () => {
          clearTimeout(timer);
          resolve();
        });
        audioStream.on("error", (err: Error) => {
          clearTimeout(timer);
          reject(err);
        });
      });
    } finally {
      // Always close the WebSocket — even on timeout / stream error.
      try {
        tts.close();
      } catch {
        // ignore
      }
    }

    const audio = Buffer.concat(chunks);
    if (audio.length === 0) {
      logger.warn("[TTS] Empty audio from Edge", { voice });
      return Errors.aiServiceError();
    }

    return new NextResponse(new Uint8Array(audio), {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": String(audio.length),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    // Client falls back to browser speechSynthesis on any failure.
    return handleUnexpectedError(error, "tts");
  }
}
