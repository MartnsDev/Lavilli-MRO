import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomInt } from "node:crypto";
import { z } from "zod";
import {
  sameOrigin,
  limit,
  clearLimit,
  checkPin,
  device,
  startSession,
  session,
  cookieOptions,
  secret,
} from "@/lib/server/auth";
import { db, rpc, configured } from "@/lib/server/db";
import { failure } from "@/lib/server/errors";
import { digest, token, sign, unsign } from "@/lib/domain/security";
import { sendMail } from "@/lib/server/mail";
export async function POST(
  request: Request,
  { params }: { params: Promise<{ action: string }> },
) {
  try {
    sameOrigin(request);
    if (!configured()) throw new Error("SETUP_REQUIRED");
    const { action } = await params;
    const c = await cookies();
    if (action === "logout") {
      const s = await session();
      const { error } = await db()
        .from("access_sessions")
        .update({ revoked_at: new Date().toISOString() })
        .eq("id", s.id);
      if (error) throw error;
      c.delete("lavilli_session");
      return NextResponse.json({ ok: true });
    }
    if (action === "login") {
      const d = await device();
      await limit("login", d);
      const { pin } = z
        .object({ pin: z.string().length(4) })
        .strict()
        .parse(await request.json());
      await checkPin(pin);
      await clearLimit("login", d);
      await startSession(d);
      return NextResponse.json({ ok: true });
    }
    await limit("enroll");
    if (action === "request-code") {
      const email = process.env.AUTHORIZED_EMAIL;
      if (!email) throw new Error("SETUP_REQUIRED");
      const browser = token();
      const code = String(randomInt(100000, 1000000));
      const { data, error } = await db()
        .from("device_challenges")
        .insert({
          browser_hash: digest(browser),
          token_hash: digest(code + secret()),
          expires_at: new Date(Date.now() + 10 * 60000).toISOString(),
        })
        .select("id")
        .single();
      if (error) throw error;
      await sendMail(
        email,
        "Lavilli Jet | Autorizar dispositivo",
        `Código para autorizar novo dispositivo: ${code}. Válido por 10 minutos. Se não solicitou, não compartilhe.`,
        data.id,
      );
      c.set("lavilli_enroll", sign(browser, secret()), {
        ...cookieOptions,
        maxAge: 600,
      });
      return NextResponse.json({ challenge: data.id });
    }
    if (action === "enroll") {
      const body = z
        .object({
          code: z.string().min(6).max(200),
          challenge: z.uuid().optional(),
          label: z.string().trim().min(2).max(100),
          bootstrap: z.boolean().optional(),
        })
        .strict()
        .parse(await request.json());
      const browser = unsign(c.get("lavilli_enroll")?.value, secret());
      let bootstrap: string | null = null;
      if (body.bootstrap) {
        if (
          !process.env.DEVICE_BOOTSTRAP_HASH ||
          body.code.length < 32 ||
          digest(body.code) !== process.env.DEVICE_BOOTSTRAP_HASH
        )
          throw new Error("FORBIDDEN");
        bootstrap = digest(body.code);
      } else if (!browser || !body.challenge) throw new Error("FORBIDDEN");
      const raw = token();
      await rpc("enroll_device", {
        p_bootstrap: bootstrap,
        p_challenge: body.challenge ?? null,
        p_code: digest(body.code + secret()),
        p_browser: browser ? digest(browser) : null,
        p_token: digest(raw),
        p_label: body.label,
      });
      c.set("lavilli_device", sign(raw, secret()), {
        ...cookieOptions,
        maxAge: 90 * 86400,
      });
      c.delete("lavilli_enroll");
      return NextResponse.json({ ok: true });
    }
    throw new Error("INVALID_OPERATION");
  } catch (error) {
    return failure(error);
  }
}
