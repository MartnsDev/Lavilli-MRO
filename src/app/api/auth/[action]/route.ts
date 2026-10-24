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
  device,
  cookieName,
  cookieOptions,
  secret,
} from "@/lib/server/auth";
import { db, rpc, configured } from "@/lib/server/db";
import { failure } from "@/lib/server/errors";
import { accessState } from "@/lib/server/access-state";
import { jsonBody } from "@/lib/server/request";
import { digest, token, sign } from "@/lib/domain/security";
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
    if (!["login", "logout", "enroll"].includes(action))
      return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    if (!configured()) throw Error("SETUP_REQUIRED");
    if (action === "enroll") {
      await limit("enroll");
      const b = z
        .object({ code: z.string().regex(/^[A-Za-z0-9_-]{43}$/) })
        .strict()
        .parse(await jsonBody(request, 1024));
      const raw = token();
      await rpc("authorize_device", {
        p_grant: digest(b.code),
        p_token: digest(raw),
      });
      (await cookies()).set(cookieName("device"), sign(raw, secret()), {
        ...cookieOptions,
        maxAge: 90 * 86400,
      });
      return NextResponse.json({ ok: true });
    }
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
    const d = await device();
    await limit("login", d.id);
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
    const id = await startSession(data.id);
    await clearLimit("login", d.id);
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
