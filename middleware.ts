import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { checkRateLimit } from "@/lib/ratelimit";
import crypto from "crypto";

// Middleware runs on Node.js runtime (not Edge) so that ioredis (TCP-based)
// can connect to the local Redis instance. This is the default on self-hosted
// deployments; explicit here for clarity and to prevent accidental Edge
// deployment breaking rate limits.
export const runtime = "nodejs";

// Rate limit configurations per route pattern.
// Moved to Redis-backed sliding-window-counter — see lib/ratelimit.ts.
// The in-memory Map was non-functional under pm2 cluster (each worker had
// its own Map; attackers could bypass by hammering across workers).
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

// Fixed sunset date for v0 API deprecation (RFC 8594).
// Computed once at module load so every response returns the same deadline.
const V0_SUNSET_DATE = (() => {
  if (process.env.V0_SUNSET_DATE) {
    const parsed = new Date(process.env.V0_SUNSET_DATE);
    if (!Number.isNaN(parsed.getTime())) return parsed.toUTCString();
    console.warn("[middleware] Invalid V0_SUNSET_DATE, falling back to 60-day default");
  }
  return new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toUTCString();
})();

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");
  return forwarded?.split(",")[0].trim() || realIP || "unknown";
}

function getRateLimitConfig(pathname: string): { pattern: string; limit: number; windowMs: number } {
  for (const [pattern, config] of Object.entries(rateLimitConfig)) {
    if (pattern !== "default" && pathname.startsWith(pattern)) {
      return { pattern, ...config };
    }
  }
  return { pattern: "default", ...rateLimitConfig.default };
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

// ---- CSRF (double-submit cookie) ----
// Protects state-changing requests against cross-origin form/fetch attacks.
// Client sends the csrf_token cookie AND an X-CSRF-Token header. Both must
// match. Attackers in cross-origin contexts can't read the cookie (SameSite)
// and can't set the header (browser policy), so the check fails.
//
// Exemptions:
// - Safe methods (GET/HEAD/OPTIONS) — no state change
// - Pre-auth endpoints (signin/signup) — client has no session to carry a
//   token yet; these are rate-limited instead
// - Non-API paths — the middleware only guards /api/*

const CSRF_COOKIE_NAME = "csrf_token";
const CSRF_HEADER_NAME = "x-csrf-token";
const CSRF_EXEMPT_PATHS = [
  "/api/auth/signin",
  "/api/auth/signup",
];

function isSafeMethod(method: string): boolean {
  return method === "GET" || method === "HEAD" || method === "OPTIONS";
}

function isCsrfExempt(pathname: string): boolean {
  return CSRF_EXEMPT_PATHS.some((p) => pathname.startsWith(p));
}

function timingSafeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}

function csrfForbidden(origin: string | null, requestId: string): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: "CSRF token missing or invalid",
      errorCode: "AUTH_004",
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

  // CSRF double-submit for state-changing /api/* requests.
  // Must run BEFORE rate limit so attacker can't probe limits on unprotected paths.
  //
  // Gated via CSRF_ENFORCE env var so the rollout is safe — cookie is seeded
  // unconditionally (see below), then enforcement flipped on once all client
  // code has been migrated to use apiFetch() from lib/client/api.ts.
  if (
    process.env.CSRF_ENFORCE === "true" &&
    pathname.startsWith("/api") &&
    !isSafeMethod(request.method) &&
    !isCsrfExempt(pathname)
  ) {
    const cookie = request.cookies.get(CSRF_COOKIE_NAME)?.value;
    const header = request.headers.get(CSRF_HEADER_NAME);
    if (!cookie || !header || !timingSafeEquals(cookie, header)) {
      return csrfForbidden(origin, requestId);
    }
  }

  // Only apply rate limiting to API routes
  if (pathname.startsWith("/api")) {
    const clientIP = getClientIP(request);
    const config = getRateLimitConfig(pathname);
    // Key by the matched pattern (not the request path prefix). This means
    // /api/auth/signup and /api/auth/signin get distinct buckets, matching
    // the rateLimitConfig entries. The prior slice(0,3) approach worked
    // coincidentally but is harder to reason about.
    const rateLimitKey = `rl:${clientIP}:${config.pattern}`;

    const { allowed, remaining, resetEpochSeconds } = await checkRateLimit(
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
            "X-RateLimit-Reset": resetEpochSeconds.toString(),
            "Retry-After": Math.max(1, resetEpochSeconds - Math.floor(Date.now() / 1000)).toString(),
            "X-Request-ID": requestId,
          },
        }
      );
    }

    // Continue with the request, adding headers
    const response = NextResponse.next();

    // Seed csrf_token cookie on safe /api/* reads if missing. Client JS can
    // read it (non-HttpOnly) and mirror it into the X-CSRF-Token header on
    // subsequent writes. SameSite=Strict stops cross-site senders.
    if (isSafeMethod(request.method) && !request.cookies.get(CSRF_COOKIE_NAME)) {
      const token = crypto.randomBytes(32).toString("hex");
      response.cookies.set({
        name: CSRF_COOKIE_NAME,
        value: token,
        httpOnly: false,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60, // 1h
      });
    }

    // Deprecation headers for v0 API routes (RFC 8594).
    if (!pathname.startsWith("/api/v1/")) {
      response.headers.set("Deprecation", "true");
      response.headers.set("Sunset", V0_SUNSET_DATE);
      response.headers.set("Link", `</api/v1>; rel="successor-version"`);
    }

    // Add rate limit headers
    response.headers.set("X-RateLimit-Limit", config.limit.toString());
    response.headers.set("X-RateLimit-Remaining", remaining.toString());
    response.headers.set("X-RateLimit-Reset", resetEpochSeconds.toString());
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

  // Seed csrf_token cookie on page navigation so subsequent API writes have it.
  if (isSafeMethod(request.method) && !request.cookies.get(CSRF_COOKIE_NAME)) {
    const token = crypto.randomBytes(32).toString("hex");
    response.cookies.set({
      name: CSRF_COOKIE_NAME,
      value: token,
      httpOnly: false,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60,
    });
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
