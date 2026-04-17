import { jwtVerify } from "jose";
import type { AuthUser } from "./auth";

// Edge-runtime JWT verification using the `jose` library (Web Crypto API).
// Separate from lib/auth.ts because that file imports bcryptjs, jsonwebtoken,
// and Drizzle — none of which work in the Next.js middleware (Edge) runtime.
// Importing this file into middleware keeps the Edge bundle minimal.

function getJwtSecretEdge(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      "JWT_SECRET environment variable is required at runtime. " +
      "Set it in .env.local for development or in your deployment environment for production."
    );
  }
  return secret;
}

/**
 * Verifies a JWT signature and returns the decoded claims.
 * Returns null for invalid-token conditions: missing, malformed, expired,
 * or bad signature. Propagates configuration errors (missing JWT_SECRET)
 * so a misconfigured deployment fails fast instead of silently 401-ing
 * every user.
 */
export async function verifyTokenEdge(token: string): Promise<AuthUser | null> {
  // Resolve secret OUTSIDE the catch so config errors bubble up.
  const secret = new TextEncoder().encode(getJwtSecretEdge());
  try {
    const { payload } = await jwtVerify(token, secret);
    if (
      typeof payload.id !== "number" ||
      typeof payload.email !== "string" ||
      typeof payload.role !== "string" ||
      typeof payload.status !== "string"
    ) {
      return null;
    }
    return payload as unknown as AuthUser;
  } catch {
    return null;
  }
}
