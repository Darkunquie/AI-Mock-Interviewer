import Groq from "groq-sdk";
import { logger } from "./logger";

// Lazy-initialized Groq client — throws on first AI call if key missing.
// Avoids breaking `next build` in CI without GROQ_API_KEY.
let _groq: Groq | null = null;

function getGroq(): Groq {
  if (!_groq) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error("GROQ_API_KEY is required for AI features");
    }
    _groq = new Groq({
      apiKey,
      timeout: 30000,
      maxRetries: 2,
    });
  }
  return _groq;
}


// Default model configuration
export const GROQ_MODEL = "llama-3.1-8b-instant"; // Fast and cheap
export const GROQ_MODEL_QUALITY = "llama-3.3-70b-versatile"; // Better quality

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * Circuit breaker for Groq API.
 *
 * After THRESHOLD consecutive failures, the breaker opens for COOLDOWN_MS.
 * While open, calls fail fast with `GroqCircuitOpenError` (no Groq round-trip
 * and no retry cascade on our side). After cooldown the next call enters
 * half-open — one probe is allowed; success closes, failure reopens.
 *
 * Why: a Groq outage combined with our sdk retries (2x) + per-request timeout
 * (30s) can stall the pm2 event loop for ~90s per request and cascade to
 * Nginx 504s across unrelated traffic. The breaker isolates the failure mode.
 */
const CIRCUIT_THRESHOLD = 5;
const CIRCUIT_COOLDOWN_MS = 60_000;

type CircuitState = "closed" | "open" | "half_open";

class GroqCircuitBreaker {
  private failures = 0;
  private openedAt = 0;
  private state: CircuitState = "closed";

  get currentState(): CircuitState {
    // Lazy transition open -> half-open after cooldown
    if (this.state === "open" && Date.now() - this.openedAt >= CIRCUIT_COOLDOWN_MS) {
      this.state = "half_open";
      logger.warn("Groq circuit breaker half-open — will allow probe request");
    }
    return this.state;
  }

  canRequest(): boolean {
    const s = this.currentState;
    return s === "closed" || s === "half_open";
  }

  recordSuccess(): void {
    if (this.state !== "closed") {
      logger.info("Groq circuit breaker closed after probe success");
    }
    this.failures = 0;
    this.state = "closed";
  }

  recordFailure(): void {
    this.failures++;
    if (this.state === "half_open" || this.failures >= CIRCUIT_THRESHOLD) {
      this.openedAt = Date.now();
      this.state = "open";
      logger.error(
        `Groq circuit breaker OPEN — cooling down ${CIRCUIT_COOLDOWN_MS}ms after ${this.failures} failures`,
      );
    }
  }

  /** Health-check snapshot (used by /api/health) */
  snapshot(): { state: CircuitState; failures: number; openedAt: number } {
    return { state: this.currentState, failures: this.failures, openedAt: this.openedAt };
  }
}

export const groqCircuit = new GroqCircuitBreaker();

export class GroqCircuitOpenError extends Error {
  constructor() {
    super("AI service is temporarily unavailable (circuit breaker open)");
    this.name = "GroqCircuitOpenError";
  }
}

interface CompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

// Google Gemini fallback via REST (no SDK dependency). Returns the completion
// text, or null if unavailable/failed so the caller can decide what to do.
// Used when Groq is down (circuit open) or a Groq call throws, so a Groq
// outage degrades to Gemini instead of failing the request. No-op (null) when
// GOOGLE_GEMINI_API_KEY is unset.
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash";

async function tryGemini(messages: ChatMessage[], options?: CompletionOptions): Promise<string | null> {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) return null;

  const startTime = Date.now();
  try {
    // Gemini takes a system instruction separately and uses role "model" for
    // assistant turns.
    const system = messages.filter((m) => m.role === "system").map((m) => m.content).join("\n\n");
    const contents = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
        generationConfig: {
          temperature: options?.temperature ?? 0.7,
          maxOutputTokens: options?.maxTokens ?? 2048,
          responseMimeType: "application/json",
        },
      }),
      signal: AbortSignal.timeout(30_000),
    });

    if (!res.ok) {
      logger.error("Gemini fallback HTTP error", new Error(`HTTP ${res.status}: ${await res.text()}`));
      return null;
    }

    const data = await res.json();
    const text: string =
      data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";
    if (!text) {
      logger.warn("Gemini fallback returned empty content");
      return null;
    }

    logger.info("AI completion via Gemini fallback", { model: GEMINI_MODEL, duration: Date.now() - startTime });
    return text;
  } catch (err) {
    logger.error("Gemini fallback error", err instanceof Error ? err : new Error(String(err)), {
      duration: Date.now() - startTime,
    });
    return null;
  }
}

export async function generateCompletion(
  messages: ChatMessage[],
  options?: CompletionOptions
): Promise<string> {
  // Circuit open — skip Groq entirely and try the fallback before failing.
  if (!groqCircuit.canRequest()) {
    const fallback = await tryGemini(messages, options);
    if (fallback !== null) return fallback;
    throw new GroqCircuitOpenError();
  }

  const groq = getGroq(); // Throws early if API key missing — not a circuit-breaker event

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

    groqCircuit.recordSuccess();

    if (!content) {
      logger.warn("AI returned empty content", { model, duration });
      return "";
    }

    return content;
  } catch (error) {
    const duration = Date.now() - startTime;
    groqCircuit.recordFailure();
    logger.error(
      "AI completion failed",
      error instanceof Error ? error : new Error(String(error)),
      { model, duration }
    );
    // Degrade to Gemini before surfacing the error.
    const fallback = await tryGemini(messages, options);
    if (fallback !== null) return fallback;
    throw error;
  }
}
