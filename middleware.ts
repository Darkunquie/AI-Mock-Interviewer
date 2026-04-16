import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { neon } from "@neondatabase/serverless";
import { verifyTokenEdge } from "@/lib/auth-edge";
import { checkRateLimit } from "@/lib/ratelimit";

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

async function checkSubscription(
  userId: number,
  origin: string | null,
  requestId: string
): Promise<NextResponse | null> {
  try {
    if (!process.env.DATABASE_URL) {
      console.error("[checkSubscription] DATABASE_URL not configured");
      // Fail closed — block access when subscription check is impossible
      return NextResponse.json(
        { success: false, error: "Service temporarily unavailable" },
        { status: 503, headers: { ...securityHeaders } }
      );
    }
    const sql = neon(process.env.DATABASE_URL);
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
  } catch (err) {
    // Fail closed: unknown failures in subscription check must NOT grant access.
    // The previous behavior let requests through on any error, creating a free
    // pass for expired-trial users any time the DB hiccupped.
    console.error("[checkSubscription] unexpected failure", {
      userId,
      requestId,
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { success: false, error: "Service temporarily unavailable" },
      {
        status: 503,
        headers: {
          ...getCorsHeaders(origin),
          ...securityHeaders,
          "X-Request-ID": requestId,
          "Retry-After": "30",
        },
      }
    );
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

    // Subscription guard for protected API paths.
    // Uses jose.jwtVerify to perform FULL signature verification — the prior
    // implementation (decodeJwtPayload) only base64-decoded the claims, which
    // meant a forged JWT with role:"admin" could bypass the subscription check.
    if (isProtectedApiPath(pathname)) {
      const authToken = request.cookies.get("auth_token")?.value;
      if (authToken) {
        const payload = await verifyTokenEdge(authToken);
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
