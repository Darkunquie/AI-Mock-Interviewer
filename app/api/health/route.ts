import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { groqCircuit } from "@/lib/groq";

// The detailed `checks` block (DB latency, circuit failure counts, version)
// is internal telemetry — useful for our monitors, but reconnaissance for an
// attacker. Expose it only to callers presenting HEALTH_STATUS_TOKEN
// (?token=… or Authorization: Bearer …). Anonymous callers still get the
// coarse up/down status a public uptime monitor needs.
function isAuthorizedForDetail(request: NextRequest): boolean {
  const expected = process.env.HEALTH_STATUS_TOKEN;
  if (!expected) return false;
  const provided =
    request.nextUrl.searchParams.get("token") ||
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  return provided === expected;
}

interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  version: string;
  uptime: number;
  services: {
    database: "up" | "down";
    api: "up";
    groq: "ok" | "degraded" | "fail";
  };
  checks?: {
    database?: {
      status: "up" | "down";
      latency?: number;
      error?: string;
    };
    groq?: {
      state: "closed" | "open" | "half_open";
      consecutiveFailures: number;
    };
  };
}

const startTime = Date.now();

export async function GET(request: NextRequest) {
  const timestamp = new Date().toISOString();
  const uptime = Math.floor((Date.now() - startTime) / 1000);

  let dbStatus: "up" | "down" = "down";
  let dbLatency: number | undefined;
  let dbError: string | undefined;

  // Check database connectivity
  try {
    const dbStart = Date.now();
    await db.execute(sql`SELECT 1`);
    dbLatency = Date.now() - dbStart;
    dbStatus = "up";
  } catch (error) {
    dbError = error instanceof Error ? error.message : "Unknown database error";
    dbStatus = "down";
  }

  // Groq circuit breaker snapshot
  const circuit = groqCircuit.snapshot();
  let groqHealth: "ok" | "degraded" | "fail";
  if (circuit.state === "closed") groqHealth = "ok";
  else if (circuit.state === "half_open") groqHealth = "degraded";
  else groqHealth = "fail";

  // Determine overall status — DB down = unhealthy; Groq open = degraded.
  let status: HealthStatus["status"];
  if (dbStatus !== "up") {
    status = "unhealthy";
  } else if (groqHealth === "fail") {
    status = "degraded";
  } else if (groqHealth === "degraded") {
    status = "degraded";
  } else {
    status = "healthy";
  }
  const detailed = isAuthorizedForDetail(request);

  const healthResponse: HealthStatus = {
    status,
    timestamp,
    // Version is a fingerprint — only for authorized callers.
    version: detailed ? process.env.npm_package_version || "1.0.0" : "",
    uptime,
    services: {
      database: dbStatus,
      api: "up",
      groq: groqHealth,
    },
    // Internal telemetry only when authorized.
    checks: detailed
      ? {
          database: {
            status: dbStatus,
            latency: dbLatency,
            error: process.env.NODE_ENV === "production" ? undefined : dbError,
          },
          groq: {
            state: circuit.state,
            consecutiveFailures: circuit.failures,
          },
        }
      : undefined,
  };

  // Return appropriate status code
  const statusCode = status === "healthy" ? 200 : 503;

  return NextResponse.json(healthResponse, { status: statusCode });
}

// HEAD request for simple uptime checks
export async function HEAD() {
  try {
    await db.execute(sql`SELECT 1`);
    return new NextResponse(null, { status: 200 });
  } catch {
    return new NextResponse(null, { status: 503 });
  }
}
