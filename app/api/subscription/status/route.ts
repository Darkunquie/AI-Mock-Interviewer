import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getSubscriptionDetails } from "@/lib/subscription";
import { Errors, handleUnexpectedError } from "@/lib/errors";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return Errors.unauthorized();

    const details = await getSubscriptionDetails(user.id);
    if (!details) return Errors.notFound("Subscription");

    // Spread at top level for v0 client compat (useSubscription reads
    // `data.subscriptionStatus` etc. directly).
    return NextResponse.json({ success: true, ...details });
  } catch (error) {
    return handleUnexpectedError(error, "subscription/status");
  }
}
