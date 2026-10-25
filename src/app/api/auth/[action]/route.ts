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
  loginDevice,
  cookieName,
} from "@/lib/server/auth";
import { db, configured } from "@/lib/server/db";
import { failure } from "@/lib/server/errors";
import { accessState } from "@/lib/server/access-state";
import { jsonBody } from "@/lib/server/request";
import { audit } from "@/lib/server/audit";
export async function POST(
  request: Request,
  { params }: { params: Promise<{ action: string }> },
) {
  let actionName = "auth";
  try {
    sameOrigin(request);
    const { action } = await params;
    actionName = action;
    if (!["login", "logout"].includes(action))
      return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    if (!configured()) throw Error("SETUP_REQUIRED");
    if (action === "logout") {
      const s = await session();
      const { error } = await db()
        .from("access_sessions")
        .update({ revoked_at: new Date().toISOString() })
        .eq("id", s.id);
      if (error) throw Error("INTERNAL");
      await audit("logout", s.id, "access_sessions", s.id, "success");
      (await cookies()).delete(cookieName("session"));
      return NextResponse.json({ ok: true });
    }
    await limit("login");
    const b = z
      .object({ pin: z.string().regex(/^\d{4}$/), mechanic_id: z.uuid() })
      .strict()
      .parse(await jsonBody(request, 2048));
    await checkPin(b.pin);
    const { data, error } = await db()
      .from("mechanics")
      .select("id")
      .eq("id", b.mechanic_id)
      .eq("active", true)
      .maybeSingle();
    if (error || !data) throw Error("UNAUTHORIZED");
    const d = await loginDevice();
    const id = await startSession(data.id, d);
    await clearLimit("login");
    await audit("login", id, "access_sessions", id, "success");
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (!(e instanceof Error && e.message === "RATE_LIMIT"))
      await audit(
        actionName === "login"
          ? "login_failed"
          : actionName === "enroll"
            ? "device_authorization_failed"
            : "authentication_failed",
      );
    return failure(e);
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
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (e) {
    return failure(e);
  }
}
