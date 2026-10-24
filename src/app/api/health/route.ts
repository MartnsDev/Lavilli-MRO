import { NextResponse } from "next/server";
import { session } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { failure } from "@/lib/server/errors";
export async function GET() {
  try {
    await session();
    const { error } = await db().from("mechanics").select("id").limit(1);
    return NextResponse.json(
      {
        database: error ? "unavailable" : "ok",
        email: process.env.EMAIL_MODE === "resend" ? "configured" : "disabled",
        checked_at: new Date().toISOString(),
      },
      { headers: { "Cache-Control": "no-store" }, status: error ? 503 : 200 },
    );
  } catch (e) {
    return failure(e);
  }
}
