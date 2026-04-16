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

export async function generateCompletion(
  messages: ChatMessage[],
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }
): Promise<string> {
  if (!groqCircuit.canRequest()) {
    throw new GroqCircuitOpenError();
  }

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
    throw error;
  }
}

export default groq;
