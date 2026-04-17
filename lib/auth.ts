import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { db } from "./db";
import { users } from "@/utils/schema";
import { eq } from "drizzle-orm";
import { cacheGet, cacheSet, cacheDel } from "./cache";

// JWT Secret - validated at runtime (first use), not at module load.
// Throwing at import time breaks `next build` in CI environments without JWT_SECRET set.
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      "JWT_SECRET environment variable is required at runtime. " +
      "Set it in .env.local for development or in your deployment environment for production. " +
      "Generate one with: node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\""
    );
  }
  return secret;
}

const COOKIE_NAME = "auth_token";

export interface AuthUser {
  id: number;
  email: string;
  name: string | null;
  role: string;
  status: string;
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// Verify password
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// Generate JWT token
export function generateToken(user: AuthUser): string {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role, status: user.status },
    getJwtSecret(),
    { expiresIn: "7d" }
  );
}

// Verify JWT token (Node runtime) — uses jsonwebtoken, verifies signature.
// For Edge runtime (middleware), use verifyTokenEdge from lib/auth-edge.ts
// instead — jsonwebtoken depends on Node's crypto module and won't run
// in Next.js middleware.
export function verifyToken(token: string): AuthUser | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as unknown as AuthUser;
    return decoded;
  } catch {
    return null;
  }
}

// Set auth cookie
export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
}

// Remove auth cookie
export async function removeAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

// Get current user from cookie — verifies JWT then checks DB for current role/status.
// DB lookup cached in Redis for 60s to avoid per-request DB hit.
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) {
      return null;
    }

    const claims = verifyToken(token);
    if (!claims) return null;

    // Verify current role/status from DB (cached 60s in Redis)
    const cacheKey = `user:status:${claims.id}`;
    let dbUser: { role: string; status: string } | null = null;
    try {
      dbUser = await cacheGet<{ role: string; status: string }>(cacheKey);
    } catch {
      // Cache unavailable, fall through to DB lookup
    }
    if (!dbUser) {
      const [row] = await db
        .select({ role: users.role, status: users.status })
        .from(users)
        .where(eq(users.id, claims.id))
        .limit(1);
      if (!row) return null;
      dbUser = { role: row.role, status: row.status };
      try {
        await cacheSet(cacheKey, dbUser, 60);
      } catch {
        // Cache unavailable, continue without caching
      }
    }
    // Reject if user no longer approved
    if (dbUser.status !== "approved") return null;

    return { ...claims, role: dbUser.role, status: dbUser.status };
  } catch {
    return null;
  }
}

// Invalidate cached user status (call after admin approve/reject)
export async function invalidateUserStatusCache(userId: number): Promise<void> {
  await cacheDel(`user:status:${userId}`);
}

// Check if user is authenticated
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null;
}

// Sign up a new user — throws on unexpected errors (route handler catches via handleUnexpectedError)
export async function signUp(email: string, password: string, name: string, phone?: string): Promise<{ success: boolean; code?: string; error?: string; user?: AuthUser; pending?: boolean }> {
  const normalizedEmail = email.toLowerCase();

  // Check if user already exists
  const existingUser = await db.select().from(users).where(eq(users.email, normalizedEmail)).limit(1);

  if (existingUser.length > 0) {
    return { success: false, code: "EMAIL_EXISTS", error: "Email already registered" };
  }

  // Check if this is the admin email (auto-approve)
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
  const isAdmin = adminEmail && normalizedEmail === adminEmail;

  // Hash password and create user
  const hashedPassword = await hashPassword(password);
  const [newUser] = await db.insert(users).values({
    email: normalizedEmail,
    password: hashedPassword,
    name,
    phone: phone || null,
    role: isAdmin ? "admin" : "user",
    status: isAdmin ? "approved" : "pending",
  }).returning();

  const authUser: AuthUser = {
    id: newUser.id,
    email: newUser.email,
    name: newUser.name,
    role: newUser.role,
    status: newUser.status,
  };

  // Admin gets auto-login, regular users stay pending
  if (isAdmin) {
    const token = generateToken(authUser);
    await setAuthCookie(token);
    return { success: true, user: authUser };
  }

  return { success: true, pending: true };
}

// Sign in a user — throws on unexpected errors (route handler catches via handleUnexpectedError)
export async function signIn(email: string, password: string): Promise<{ success: boolean; error?: string; user?: AuthUser; pending?: boolean }> {
  const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);

  if (!user) {
    return { success: false, error: "Invalid email or password" };
  }

  const isValid = await verifyPassword(password, user.password);

  if (!isValid) {
    return { success: false, error: "Invalid email or password" };
  }

  if (user.status === "pending") {
    return { success: false, error: "Your account is pending admin approval", pending: true };
  }

  if (user.status === "rejected") {
    return { success: false, error: "Your account has been rejected" };
  }

  const authUser: AuthUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    status: user.status,
  };

  const token = generateToken(authUser);
  await setAuthCookie(token);

  return { success: true, user: authUser };
}

// Sign out
export async function signOut(): Promise<void> {
  await removeAuthCookie();
}

// Require admin role - returns user if admin, null otherwise
export async function requireAdmin(): Promise<AuthUser | null> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return null;
  }
  return user;
}
