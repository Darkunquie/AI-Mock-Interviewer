import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { neon } from "@neondatabase/serverless";

// In-memory rate limiter (simple implementation for single-server deployment)
// For multi-server deployment, use Redis-based rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Rate limit configurations per route pattern
const rateLimitConfig: Record<string, { limit: number; windowMs: number }> = {
  "/api/auth/signin": { limit: 10, windowMs: 60000 },     // 10 requests per minute
  "/api/auth/signup": { limit: 5, windowMs: 60000 },      // 5 requests per minute
  "/api/interview": { limit: 30, windowMs: 60000 },       // 30 requests per minute
  "/api/transcribe": { limit: 60, windowMs: 60000 },      // 60 requests per minute (for real-time transcription)
  "/api/flashcards": { limit: 20, windowMs: 60000 },      // 20 requests per minute
  "/api/projects": { limit: 10, windowMs: 60000 },        // 10 requests per minute
  "/api/admin": { limit: 30, windowMs: 60000 },           // 30 requests per minute
  default: { limit: 100, windowMs: 60000 },               // Default: 100 requests per minute
};

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");
  return forwarded?.split(",")[0].trim() || realIP || "unknown";
}

function getRateLimitConfig(pathname: string): { limit: number; windowMs: number } {
  for (const [pattern, config] of Object.entries(rateLimitConfig)) {
    if (pattern !== "default" && pathname.startsWith(pattern)) {
      return config;
    }
  }
  return rateLimitConfig.default;
}

function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  // Clean up expired records periodically
  if (rateLimitMap.size > 10000) {
    for (const [k, v] of rateLimitMap.entries()) {
      if (v.resetTime < now) {
        rateLimitMap.delete(k);
      }
    }
  }

  if (!record || record.resetTime < now) {
    // Create new window
    const resetTime = now + windowMs;
    rateLimitMap.set(key, { count: 1, resetTime });
    return { allowed: true, remaining: limit - 1, resetTime };
  }

  if (record.count >= limit) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime };
  }

  record.count++;
  return { allowed: true, remaining: limit - record.count, resetTime: record.resetTime };
}

// Security headers
const securityHeaders = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(self), geolocation=()",
};

// CORS configuration
const allowedOrigins = [
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  "http://localhost:3000",
  "http://localhost:3001",
].filter(Boolean);

// Subscription guard — protected API paths that require active trial/subscription
function isProtectedApiPath(pathname: string): boolean {
  // Leaderboard is free (view-only)
  if (pathname === "/api/interview/leaderboard") return false;
  // All other interview routes are protected (including /api/interview/[id])
  if (pathname.startsWith("/api/interview")) return true;
  if (pathname.startsWith("/api/flashcards")) return true;
  if (pathname.startsWith("/api/projects")) return true;
  if (pathname === "/api/transcribe") return true;
  return false;
}

// Decode JWT payload without verification (lightweight, Edge-compatible)
// Full verification happens in the route handler — this is just for the subscription guard
function decodeJwtPayload(token: string): { id?: number; role?: string } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64 = parts[1].replaceAll("-", "+").replaceAll("_", "/");
    const payload = JSON.parse(atob(base64));
    return payload;
  } catch {
    return null;
  }
}

async function checkSubscription(
  userId: number,
  origin: string | null,
  requestId: string
): Promise<NextResponse | null> {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const result = await sql`
      SELECT subscription_status, trial_ends_at
      FROM users WHERE id = ${userId} LIMIT 1
    `;
    const user = result[0];
    if (!user) return null; // Let route handler deal with missing user

    const status = user.subscription_status;
    const trialEnds = user.trial_ends_at ? new Date(user.trial_ends_at as string) : null;
    const isActive =
      status === "active" ||
      (status === "trial" && trialEnds && trialEnds > new Date());

    if (!isActive) {
      return NextResponse.json(
        {
          success: false,
          error: "Subscription required",
          reason: status === "trial" ? "trial_expired" : "no_subscription",
        },
        {
          status: 403,
          headers: {
            ...getCorsHeaders(origin),
            ...securityHeaders,
            "X-Request-ID": requestId,
          },
        }
      );
    }
  } catch {
    // If subscription check fails, let the request through
    // Route handler will catch any real auth issues
  }
  return null;
}

function getCorsHeaders(origin: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Request-ID",
    "Access-Control-Max-Age": "86400",
    "Access-Control-Allow-Credentials": "true",
  };

  // Check if origin is allowed
  if (origin && (allowedOrigins.includes(origin) || process.env.NODE_ENV !== "production")) {
    headers["Access-Control-Allow-Origin"] = origin;
  } else if (!origin) {
    // Same-origin requests don't have an Origin header
    headers["Access-Control-Allow-Origin"] = allowedOrigins[0];
  }

  return headers;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const origin = request.headers.get("origin");

  // Generate request ID for tracing
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  // Handle preflight requests
  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: {
        ...getCorsHeaders(origin),
        ...securityHeaders,
      },
    });
  }

  // Only apply rate limiting to API routes
  if (pathname.startsWith("/api")) {
    const clientIP = getClientIP(request);
    const config = getRateLimitConfig(pathname);
    const rateLimitKey = `${clientIP}:${pathname.split("/").slice(0, 3).join("/")}`;

    const { allowed, remaining, resetTime } = checkRateLimit(
      rateLimitKey,
      config.limit,
      config.windowMs
    );

    if (!allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "Too many requests. Please try again later.",
        },
        {
          status: 429,
          headers: {
            ...getCorsHeaders(origin),
            ...securityHeaders,
            "X-RateLimit-Limit": config.limit.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": Math.ceil(resetTime / 1000).toString(),
            "Retry-After": Math.ceil((resetTime - Date.now()) / 1000).toString(),
            "X-Request-ID": requestId,
          },
        }
      );
    }

    // Subscription guard for protected API paths
    if (isProtectedApiPath(pathname)) {
      const authToken = request.cookies.get("auth_token")?.value;
      if (authToken) {
        const payload = decodeJwtPayload(authToken);
        if (payload?.id && payload.role !== "admin") {
          const blocked = await checkSubscription(payload.id, origin, requestId);
          if (blocked) return blocked;
        }
      }
    }

    // Continue with the request, adding headers
    const response = NextResponse.next();

    // Add rate limit headers
    response.headers.set("X-RateLimit-Limit", config.limit.toString());
    response.headers.set("X-RateLimit-Remaining", remaining.toString());
    response.headers.set("X-RateLimit-Reset", Math.ceil(resetTime / 1000).toString());
    response.headers.set("X-Request-ID", requestId);

    // Add CORS headers
    const corsHeaders = getCorsHeaders(origin);
    for (const [key, value] of Object.entries(corsHeaders)) {
      response.headers.set(key, value);
    }

    // Add security headers
    for (const [key, value] of Object.entries(securityHeaders)) {
      response.headers.set(key, value);
    }

    return response;
  }

  // For non-API routes, just add security headers
  const response = NextResponse.next();
  for (const [key, value] of Object.entries(securityHeaders)) {
    response.headers.set(key, value);
  }

  return response;
}

export const config = {
  matcher: [
    // Match all API routes
    "/api/:path*",
    // Match all pages (for security headers)
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
