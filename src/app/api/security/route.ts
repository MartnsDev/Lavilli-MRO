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
import { rpc, db } from "@/lib/server/db";
import { digest } from "@/lib/domain/security";
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
        code: z
          .string()
          .regex(/^[A-Za-z0-9_-]{43}$/)
          .optional(),
        device_id: z.uuid().optional(),
      })
      .strict()
      .parse(await jsonBody(request, 2048));
    await limit("elevate", s.id);
    await checkPin(b.pin);
    if (b.action === "elevate") {
      if (!b.code) throw Error("FORBIDDEN");
      await rpc("elevate_session", {
        p_session: s.id,
        p_grant: digest(b.code),
      });
    } else {
      requireElevation(s);
      await rpc("manage_access", {
        p_session: s.id,
        p_action: b.action,
        p_device: b.device_id ?? null,
      });
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
      .select("id,label,created_at,last_seen_at,expires_at,revoked_at")
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
