import crypto from "crypto";

/**
 * Opaque single-use tokens for email verification / password reset.
 *
 * The raw token is high-entropy (32 random bytes) and goes ONLY in the emailed
 * link. We persist just its SHA-256 hash, so a DB read (leak, backup, SQLi)
 * can't be replayed to verify an account or reset a password — the attacker
 * would need to reverse SHA-256 of a 256-bit random value.
 */

export function generateToken(): { raw: string; hash: string } {
  const raw = crypto.randomBytes(32).toString("hex");
  return { raw, hash: hashToken(raw) };
}

export function hashToken(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}
