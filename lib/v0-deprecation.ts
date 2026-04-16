/**
 * Deprecation headers for v0 routes (RFC 8594 + IETF draft-ietf-httpapi-deprecation-header).
 * Wraps NextResponse so v0 handlers can advertise their v1 successor without
 * changing any business logic.
 *
 * Usage in a v0 route handler:
 *   return deprecated(NextResponse.json(...), "/api/v1/interviews");
 *
 * Sunset date is read from V0_SUNSET_DATE env var (ISO date) or defaults to
 * 60 days from now at first request. This keeps the window honest without
 * hand-updating a hardcoded date across 20 files.
 */

import type { NextResponse } from "next/server";

const SIXTY_DAYS_MS = 60 * 24 * 60 * 60 * 1000;

let sunsetCache: string | null = null;

function sunsetDate(): string {
  const envDate = process.env.V0_SUNSET_DATE;
  if (envDate) {
    const parsed = new Date(envDate);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toUTCString();
    }
    // Invalid date format — fall through to default
  }
  // Fallback: 60 days from today. Cached per process so headers stay consistent.
  if (!sunsetCache) {
    sunsetCache = new Date(Date.now() + SIXTY_DAYS_MS).toUTCString();
  }
  return sunsetCache;
}

export function deprecated<T extends NextResponse>(response: T, successor: string): T {
  response.headers.set("Deprecation", "true");
  response.headers.set("Sunset", sunsetDate());
  response.headers.set("Link", `<${successor}>; rel="successor-version"`);
  return response;
}
