import { NextResponse } from "next/server";
import { z } from "zod";
import {
  session,
  sameOrigin,
  limit,
  clearLimit,
  checkPin,
  requireElevation,
} from "@/lib/server/auth";
import { rpc, db, securityBoundaryReady } from "@/lib/server/db";
import { jsonBody } from "@/lib/server/request";
import { failure } from "@/lib/server/errors";
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const s = await session();
    const b = z
      .object({
        action: z.enum(["elevate", "revoke_device", "revoke_sessions"]),
        pin: z.string().regex(/^\d{4}$/),
        device_id: z.uuid().optional(),
      })
      .strict()
      .parse(await jsonBody(request, 2048));
    await limit("elevate", s.id);
    await checkPin(b.pin);
    const hardened = await securityBoundaryReady();
    if (b.action === "elevate" && hardened) {
      const { error } = await db()
        .from("access_sessions")
        .update({
          elevated_until: new Date(Date.now() + 5 * 60000).toISOString(),
        })
        .eq("id", s.id);
      if (error) throw Error("INTERNAL");
    } else if (b.action !== "elevate") {
      requireElevation(s);
      if (hardened)
        await rpc("manage_access", {
          p_session: s.id,
          p_action: b.action,
          p_device: b.device_id ?? null,
        });
      else if (b.action === "revoke_sessions") {
        const { error } = await db()
          .from("access_sessions")
          .update({ revoked_at: new Date().toISOString() })
          .is("revoked_at", null);
        if (error) throw Error("INTERNAL");
      } else {
        if (!b.device_id) throw Error("INVALID_OPERATION");
        const a = await db()
          .from("authorized_devices")
          .update({ revoked_at: new Date().toISOString() })
          .eq("id", b.device_id);
        if (a.error) throw Error("INTERNAL");
        const r = await db()
          .from("access_sessions")
          .update({ revoked_at: new Date().toISOString() })
          .eq("device_id", b.device_id);
        if (r.error) throw Error("INTERNAL");
      }
    }
    await clearLimit("elevate", s.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
export async function GET() {
  try {
    const s = await session();
    requireElevation(s);
    const { data, error } = await db()
      .from("authorized_devices")
      .select(
        (await securityBoundaryReady())
          ? "id,label,created_at,last_seen_at,expires_at,revoked_at"
          : "id,label,created_at,expires_at,revoked_at",
      )
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw Error("INTERNAL");
    return NextResponse.json(
      { data },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (e) {
    return failure(e);
  }
}
