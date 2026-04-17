// GET /api/v1/reference/tech-stacks
// Serves TECH_STACK_DEEP_DIVE + TECH_CATEGORIES server-side so the 4 MB
// payload is never included in the client JS bundle.
// Cached in Redis for 1h; busted manually on redeploy via NEXT_BUILD_ID change.

import { NextResponse } from "next/server";
import { cacheGet, cacheSet } from "@/lib/cache";
import { TECH_STACK_DEEP_DIVE, TECH_CATEGORIES } from "@/data/techStackTopics";
import { handleUnexpectedError } from "@/lib/errors";

const BUILD_ID = process.env.NEXT_BUILD_ID ?? "dev";
const CACHE_KEY = `ref:techstacks:v1:${BUILD_ID}`;
const CACHE_TTL = 3600; // 1 hour

export async function GET() {
  try {
    const cached = await cacheGet<{ techStacks: typeof TECH_STACK_DEEP_DIVE; categories: typeof TECH_CATEGORIES }>(CACHE_KEY);
    if (cached) {
      return NextResponse.json({ success: true, data: cached }, {
        headers: { "X-Cache": "HIT", "Cache-Control": "public, max-age=3600" },
      });
    }

    const data = { techStacks: TECH_STACK_DEEP_DIVE, categories: TECH_CATEGORIES };
    // Fire-and-forget: don't block response on cache write
    cacheSet(CACHE_KEY, data, CACHE_TTL).catch(() => {});

    return NextResponse.json({ success: true, data }, {
      headers: { "X-Cache": "MISS", "Cache-Control": "public, max-age=3600" },
    });
  } catch (error) {
    return handleUnexpectedError(error, "reference/tech-stacks");
  }
}
