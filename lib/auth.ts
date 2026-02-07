import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { db } from "./db";
import { users } from "@/utils/schema";
import { eq } from "drizzle-orm";

// JWT Secret - MUST be set in production
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET environment variable is required in production");
  }
  console.warn("[Auth] WARNING: JWT_SECRET not set. Using insecure default for development only.");
}

const getJwtSecret = () => JWT_SECRET || "dev-only-secret-do-not-use-in-production";
const COOKIE_NAME = "auth_token";

export interface AuthUser {
  id: number;
  email: string;
  name: string | null;
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
    { id: user.id, email: user.email, name: user.name },
    getJwtSecret(),
    { expiresIn: "7d" }
  );
}

// Verify JWT token
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

// Get current user from cookie
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) {
      return null;
    }

    const user = verifyToken(token);
    return user;
  } catch {
    return null;
  }
}

// Check if user is authenticated
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null;
}

// Sign up a new user
export async function signUp(email: string, password: string, name: string, phone?: string): Promise<{ success: boolean; error?: string; user?: AuthUser }> {
  try {
    // Check if user already exists
    const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (existingUser.length > 0) {
      return { success: false, error: "Email already registered" };
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(password);
    const [newUser] = await db.insert(users).values({
      email,
      password: hashedPassword,
      name,
      phone: phone || null,
    }).returning();

    const authUser: AuthUser = {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
    };

    // Generate token and set cookie
    const token = generateToken(authUser);
    await setAuthCookie(token);

    return { success: true, user: authUser };
  } catch (error) {
    console.error("Sign up error:", error);
    return { success: false, error: "Failed to create account" };
  }
}

// Sign in a user
export async function signIn(email: string, password: string): Promise<{ success: boolean; error?: string; user?: AuthUser }> {
  try {
    // Find user by email
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (!user) {
      return { success: false, error: "Invalid email or password" };
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password);

    if (!isValid) {
      return { success: false, error: "Invalid email or password" };
    }

    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      name: user.name,
    };

    // Generate token and set cookie
    const token = generateToken(authUser);
    await setAuthCookie(token);

    return { success: true, user: authUser };
  } catch (error) {
    console.error("Sign in error:", error);
    return { success: false, error: "Failed to sign in" };
  }
}

// Sign out
export async function signOut(): Promise<void> {
  await removeAuthCookie();
}
