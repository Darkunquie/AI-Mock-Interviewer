// v1: POST /api/v1/webhooks/payments  (reserved)
// Payment integration is scheduled but not implemented — per roadmap,
// this route returns 501 with a stable contract so external integrators
// can wire signature verification + retry logic without blocking on our
// implementation.

import { NextResponse } from "next/server";
import { Errors } from "@/lib/errors";

export async function POST() {
  return Errors.notImplemented();
}

export async function GET() {
  // Liveness probe — returns 501 + a contract advert so monitoring tools
  // can distinguish "route exists but off" from "route doesn't exist at all".
  return NextResponse.json(
    {
      success: false,
      error: "Webhook endpoint registered but not yet active",
      contract: {
        method: "POST",
        headers: { "X-Signature": "hmac-sha256" },
        events: ["payment.succeeded", "payment.failed", "subscription.cancelled"],
      },
    },
    { status: 501 },
  );
}
