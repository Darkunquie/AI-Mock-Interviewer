import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { checkRateLimit, type FailMode } from "@/lib/ratelimit";
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
// failMode is colocated with each entry so the fail-closed decision lives next to
// the limit it protects — no second source of truth to keep in sync. Auth routes
// set failMode: "fallback" (fail CLOSED via the in-memory limiter on a Redis
// outage) so a cache blip can't open unlimited credential stuffing. Omitted =
// "open" (fail open) for everything else.
const rateLimitConfig: Record<string, { limit: number; windowMs: number; failMode?: FailMode }> = {
  "/api/auth/signin": { limit: 10, windowMs: 60000, failMode: "fallback" }, // 10 requests per minute
  "/api/auth/signup": { limit: 5, windowMs: 60000, failMode: "fallback" },  // 5 requests per minute
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

// Number of trusted reverse-proxy hops in front of the app (e.g. nginx = 1).
// Set via TRUSTED_PROXY_HOPS in the deploy env. When > 0 we treat X-Forwarded-For
// / X-Real-IP as trustworthy *only* to the extent the trusted proxy stamped them.
const TRUSTED_PROXY_HOPS = (() => {
  const n = Number.parseInt(process.env.TRUSTED_PROXY_HOPS || "0", 10);
  return Number.isNaN(n) || n < 0 ? 0 : n;
})();

// Resolve the real client IP for rate-limit bucketing.
//
// The leftmost X-Forwarded-For entry is CLIENT-CONTROLLED — trusting it lets an
// attacker mint a fresh rate-limit bucket per request and bypass all limits.
// Behind a trusted proxy (TRUSTED_PROXY_HOPS > 0) the reliable value is:
//   - X-Real-IP, which our nginx overrides with $remote_addr (the true peer), or
//   - the XFF entry `hops` positions from the RIGHT (each proxy appends the peer
//     it saw, so the rightmost `hops` entries are proxy-stamped, not spoofable).
// Requires nginx to set `proxy_set_header X-Real-IP $remote_addr;` and
// `X-Forwarded-For $proxy_add_x_forwarded_for;` (see Phase 2 nginx config).
//
// With no trusted proxy (local dev, TRUSTED_PROXY_HOPS unset) we fall back to the
// leftmost XFF — spoofable, but there is no proxy boundary to protect anyway.
function getClientIP(request: NextRequest): string {
  const xff = request.headers.get("x-forwarded-for");

  if (TRUSTED_PROXY_HOPS > 0) {
    const realIP = request.headers.get("x-real-ip")?.trim();
    if (realIP) return realIP;

    if (xff) {
      const ips = xff.split(",").map((s) => s.trim()).filter(Boolean);
      const idx = ips.length - TRUSTED_PROXY_HOPS;
      if (idx >= 0 && ips[idx]) return ips[idx];
    }
    // Header shorter than expected → likely stripped/spoofed. Deny a stable
    // bucket rather than trust attacker input.
    return "unknown";
  }

  return xff?.split(",")[0].trim() || request.headers.get("x-real-ip")?.trim() || "unknown";
}

// Collapse the versioned API prefix so /api/v1/foo shares rate-limit + CSRF
// treatment with /api/foo. Without this, /api/v1/auth/signin (a live re-export
// of the v0 handler) misses the strict auth bucket and falls to default 100/min.
function normalizeApiPath(pathname: string): string {
  return pathname.replace(/^\/api\/v1(?=\/|$)/, "/api");
}

function getRateLimitConfig(pathname: string): { pattern: string; limit: number; windowMs: number; failMode?: FailMode } {
  for (const [pattern, config] of Object.entries(rateLimitConfig)) {
    if (pattern !== "default" && pathname.startsWith(pattern)) {
      return { pattern, ...config };
    }
  }
  return { pattern: "default", ...rateLimitConfig.default };
}

// Content-Security-Policy. Built once at module load.
// script-src keeps 'unsafe-inline' because Next's App Router injects inline
// hydration/bootstrap scripts (and the static ld+json in layout.tsx) that have
// no nonce today — a nonce rollout is tracked as a follow-up. The high-value
// directives here are frame-ancestors/object-src/base-uri/form-action, which
// close clickjacking, plugin, base-tag, and form-hijack vectors with zero
// breakage. connect-src is 'self' because Groq/Deepgram are called server-side.
const buildCSP = (): string => {
  const isDev = process.env.NODE_ENV !== "production";
  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
    "media-src 'self' blob: data:",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(isDev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
};

// Security headers
const securityHeaders = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  // microphone=(self): required for voice answers (STT).
  "Permissions-Policy": "camera=(), microphone=(self), geolocation=()",
  "Content-Security-Policy": buildCSP(),
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
  // Normalize the versioned prefix so v0 and v1 share CSRF + rate-limit rules.
  const normalizedPath = normalizeApiPath(pathname);

  if (
    process.env.CSRF_ENFORCE === "true" &&
    pathname.startsWith("/api") &&
    !isSafeMethod(request.method) &&
    !isCsrfExempt(normalizedPath)
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
    const config = getRateLimitConfig(normalizedPath);
    // Key by the matched pattern (not the request path prefix). This means
    // /api/auth/signup and /api/auth/signin get distinct buckets, matching
    // the rateLimitConfig entries. The prior slice(0,3) approach worked
    // coincidentally but is harder to reason about.
    const rateLimitKey = `rl:${clientIP}:${config.pattern}`;

    // Fail mode is carried on the matched config entry (auth = "fallback",
    // everything else defaults to "open"). Colocating it there means adding or
    // renaming an auth route can't silently regress to fail-open.
    const failMode: FailMode = config.failMode ?? "open";

    const { allowed, remaining, resetEpochSeconds } = await checkRateLimit(
      rateLimitKey,
      config.limit,
      config.windowMs,
      failMode
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
