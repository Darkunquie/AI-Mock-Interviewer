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
 * Returns null if the token is missing, malformed, expired, or has an
 * invalid signature. Never throws.
 */
export async function verifyTokenEdge(token: string): Promise<AuthUser | null> {
  try {
    const secret = new TextEncoder().encode(getJwtSecretEdge());
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as AuthUser;
  } catch {
    return null;
  }
}
