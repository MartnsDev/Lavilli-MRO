import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import {
  sameOrigin,
  limit,
  clearLimit,
  checkPin,
  startSession,
  session,
} from "@/lib/server/auth";
import { db, configured } from "@/lib/server/db";
import { failure } from "@/lib/server/errors";
import { accessState } from "@/lib/server/access-state";
export async function POST(
  request: Request,
  { params }: { params: Promise<{ action: string }> },
) {
  try {
    sameOrigin(request);
    const { action } = await params;
    if (!["login", "logout"].includes(action))
      return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    if (!configured()) throw new Error("SETUP_REQUIRED");
    if (action === "logout") {
      const s = await session();
      const { error } = await db()
        .from("access_sessions")
        .update({ revoked_at: new Date().toISOString() })
        .eq("id", s.id);
      if (error) throw error;
      (await cookies()).delete("lavilli_session");
      return NextResponse.json({ ok: true });
    }
    await limit("login");
    const body = z
      .object({ pin: z.string().regex(/^\d{4}$/), mechanic_id: z.uuid() })
      .strict()
      .parse(await request.json());
    await checkPin(body.pin);
    const { data: mechanic, error } = await db()
      .from("mechanics")
      .select("id,name")
      .eq("id", body.mechanic_id)
      .eq("active", true)
      .in("name", ["César", "Maranhão"])
      .maybeSingle();
    if (error || !mechanic) throw new Error("INVALID_OPERATION");
    await startSession(mechanic.id);
    await clearLimit("login");
    return NextResponse.json({ ok: true });
  } catch (error) {
    return failure(error);
  }
}
export async function GET(
  _: Request,
  { params }: { params: Promise<{ action: string }> },
) {
  if ((await params).action !== "status")
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  try {
    return NextResponse.json(await accessState(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return failure(error);
  }
}
