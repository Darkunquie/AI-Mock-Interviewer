import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  version: string;
  uptime: number;
  services: {
    database: "up" | "down";
    api: "up";
  };
  checks?: {
    database?: {
      status: "up" | "down";
      latency?: number;
      error?: string;
    };
  };
}

const startTime = Date.now();

export async function GET() {
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

  // Determine overall status
  const status: HealthStatus["status"] =
    dbStatus === "up" ? "healthy" : "unhealthy";

  const healthResponse: HealthStatus = {
    status,
    timestamp,
    version: process.env.npm_package_version || "1.0.0",
    uptime,
    services: {
      database: dbStatus,
      api: "up",
    },
    checks: {
      database: {
        status: dbStatus,
        latency: dbLatency,
        error: process.env.NODE_ENV === "production" ? undefined : dbError,
      },
    },
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
