import { NextResponse } from "next/server";
import { signOut } from "@/lib/auth";
import { handleUnexpectedError } from "@/lib/errors";

export async function POST() {
  try {
    await signOut();
    return NextResponse.json({ success: true, message: "Signed out successfully" });
  } catch (error) {
    return handleUnexpectedError(error, "auth/signout");
  }
}
