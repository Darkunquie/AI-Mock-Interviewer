import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// In-memory rate limiter (simple implementation for single-server deployment)
// For multi-server deployment, use Redis-based rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Rate limit configurations per route pattern
const rateLimitConfig: Record<string, { limit: number; windowMs: number }> = {
  "/api/auth/signin": { limit: 5, windowMs: 60000 },      // 5 requests per minute
  "/api/auth/signup": { limit: 3, windowMs: 60000 },      // 3 requests per minute
  "/api/interview": { limit: 30, windowMs: 60000 },       // 30 requests per minute
  "/api/transcribe": { limit: 60, windowMs: 60000 },      // 60 requests per minute (for real-time transcription)
  "/api/flashcards": { limit: 20, windowMs: 60000 },      // 20 requests per minute
  "/api/projects": { limit: 10, windowMs: 60000 },        // 10 requests per minute
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

export function middleware(request: NextRequest) {
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
          error: {
            code: "RATE_001",
            message: "Too many requests. Please try again later.",
          },
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
