import { decodePinHash } from "@/lib/domain/pin-hash.mjs";
import "server-only";
import { cookies, headers } from "next/headers";
import { verify } from "@node-rs/argon2";
import { db, rpc, configured, securityBoundaryReady } from "./db";
import {
  digest,
  token,
  sign,
  unsign,
  sameAppOrigin,
} from "@/lib/domain/security";
export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
};
export function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("SETUP_REQUIRED");
  return s;
}
export function sameOrigin(request: Request) {
  if (
    !sameAppOrigin(
      new URL(request.url).origin,
      process.env.APP_URL,
      process.env.NODE_ENV === "development",
    ) ||
    request.headers.get("sec-fetch-site") === "cross-site" ||
    !sameAppOrigin(
      request.headers.get("origin"),
      process.env.APP_URL,
      process.env.NODE_ENV === "development",
    )
  )
    throw new Error("CSRF");
}
export async function fingerprint() {
  const h = await headers();
  const ip = process.env.VERCEL
    ? h.get("x-vercel-forwarded-for")?.split(",")[0]?.trim()
    : "local";
  return digest((ip || "unknown") + secret());
}
export function cookieName(kind: "session" | "device") {
  return (
    (process.env.APP_URL?.startsWith("https://") ? "__Host-" : "") +
    "lavilli_" +
    kind
  );
}
export async function limit(scope: string, identity = "", read = false) {
  const origin = await fingerprint();
  const key = digest(scope + (identity || origin) + secret());
  if (!(await securityBoundaryReady())) {
    const keys = [
      digest("global:" + scope + secret()),
      digest("origin:" + scope + origin),
      key,
    ];
    const limits = read
      ? [20000, 10000, 2000]
      : [
          10000,
          2000,
          ["login", "confirm", "elevate"].includes(scope) ? 5 : 200,
        ];
    for (let i = 0; i < keys.length; i++)
      await rpc("take_attempt", { p_key: keys[i], p_limit: limits[i] });
    return;
  }
  const result = await rpc<{ allowed: boolean; delay_ms: number }>(
    "security_limit",
    {
      p_keys: [
        digest("global:" + scope + secret()),
        digest("origin:" + scope + origin),
        key,
      ],
      p_limits: read
        ? [20000, 10000, 2000]
        : [
            10000,
            2000,
            scope === "login" || scope === "confirm" || scope === "elevate"
              ? 5
              : scope === "export"
                ? 10
                : scope === "download"
                  ? 30
                  : 200,
          ],
      p_window: read ? 60 : 900,
    },
  );
  if (!result.allowed) throw Error("RATE_LIMIT");
  if (!read && result.delay_ms)
    await new Promise((r) => setTimeout(r, result.delay_ms));
}
export async function clearLimit(scope: string, identity = "") {
  await rpc(
    (await securityBoundaryReady()) ? "clear_security_limit" : "reset_attempt",
    {
      p_key: digest(scope + (identity || (await fingerprint())) + secret()),
    },
  );
}
export async function checkPin(pin: string) {
  if (!/^\d{4}$/.test(pin) || !process.env.PIN_HASH) throw Error("INVALID_PIN");
  let valid = false;
  try {
    valid = await verify(decodePinHash(process.env.PIN_HASH), pin);
  } catch {
    throw Error("PIN_CONFIGURATION_INVALID");
  }
  if (!valid) throw Error("INVALID_PIN");
}
export async function device() {
  if (!configured()) throw Error("UNAUTHORIZED");
  const c = await cookies();
  const raw = unsign(c.get(cookieName("device"))?.value, secret());
  if (!raw) throw Error("UNAUTHORIZED");
  let id: string | null;
  if (await securityBoundaryReady())
    id = await rpc<string | null>("check_device", { p_hash: digest(raw) });
  else {
    const { data, error } = await db()
      .from("authorized_devices")
      .select("id")
      .eq("token_hash", digest(raw))
      .is("revoked_at", null)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();
    if (error) throw Error("INTERNAL");
    id = data?.id ?? null;
  }
  if (!id) throw Error("UNAUTHORIZED");
  return { id, hash: digest(raw) };
}
export type Session = {
  id: string;
  mechanic_id: string | null;
  device_id: string;
  elevated_until: string | null;
};
export async function session(): Promise<Session> {
  const d = await device();
  const c = await cookies();
  const raw = unsign(c.get(cookieName("session"))?.value, secret());
  if (!raw) throw Error("UNAUTHORIZED");
  if (!(await securityBoundaryReady())) {
    if (!raw.startsWith(digest(process.env.PIN_HASH!).slice(0, 32)))
      throw Error("UNAUTHORIZED");
    const { data: s, error } = await db()
      .from("access_sessions")
      .select("id,mechanic_id,device_id,created_at,expires_at")
      .eq("token_hash", digest(raw))
      .eq("device_id", d.id)
      .is("revoked_at", null)
      .gt("expires_at", new Date().toISOString())
      .gt("created_at", new Date(Date.now() - 8 * 3600000).toISOString())
      .maybeSingle();
    if (error || !s) throw Error("UNAUTHORIZED");
    const expires = new Date(
      Math.min(Date.parse(s.created_at) + 8 * 3600000, Date.now() + 30 * 60000),
    ).toISOString();
    const touched = await db()
      .from("access_sessions")
      .update({ expires_at: expires })
      .eq("id", s.id)
      .is("revoked_at", null);
    if (touched.error) throw Error("INTERNAL");
    await limit("read", d.id, true);
    return { ...s, elevated_until: expires };
  }
  const rows = await rpc<Session[]>("validate_session", {
    p_hash: digest(raw),
    p_device: d.hash,
    p_version: digest(process.env.PIN_HASH!),
  });
  if (!rows?.[0]) throw Error("UNAUTHORIZED");
  await limit("read", d.id, true);
  return rows[0];
}
export function requireElevation(s: Session) {
  if (!s.elevated_until || Date.parse(s.elevated_until) <= Date.now())
    throw Error("REAUTH_REQUIRED");
}
// Successful shared-PIN login provisions its internal session binding automatically.
// No grant, device authorization or extra credential is requested from the user.
export async function loginDevice() {
  const raw = token(),
    grant = token();
  let id: string;
  if (await securityBoundaryReady()) {
    await rpc("issue_device_grant", {
      p_hash: digest(grant),
      p_purpose: "enroll",
    });
    id = await rpc<string>("authorize_device", {
      p_grant: digest(grant),
      p_token: digest(raw),
    });
  } else {
    const { data, error } = await db()
      .from("authorized_devices")
      .insert({
        token_hash: digest(raw),
        label: "Sessão de acesso",
        expires_at: new Date(Date.now() + 90 * 86400000).toISOString(),
      })
      .select("id")
      .single();
    if (error || !data) throw Error("INTERNAL");
    id = data.id;
  }
  (await cookies()).set(cookieName("device"), sign(raw, secret()), {
    ...cookieOptions,
    maxAge: 90 * 86400,
  });
  return { id, hash: digest(raw) };
}
export async function startSession(
  mechanicId: string,
  loginDevice?: { id: string; hash: string },
) {
  const d = loginDevice ?? (await device());
  const c = await cookies();
  const old = unsign(c.get(cookieName("session"))?.value, secret());
  if (old) {
    const { error } = await db()
      .from("access_sessions")
      .update({ revoked_at: new Date().toISOString() })
      .eq("token_hash", digest(old));
    if (error) throw Error("INTERNAL");
  }
  const hardened = await securityBoundaryReady();
  const raw =
    (hardened ? "" : digest(process.env.PIN_HASH!).slice(0, 32)) + token();
  const { data, error } = await db()
    .from("access_sessions")
    .insert({
      mechanic_id: mechanicId,
      device_id: d.id,
      ...(hardened
        ? { credential_version: digest(process.env.PIN_HASH!) }
        : {}),
      token_hash: digest(raw),
      expires_at: new Date(
        Date.now() + (hardened ? 8 * 3600000 : 30 * 60000),
      ).toISOString(),
      ...(hardened
        ? { elevated_until: new Date(Date.now() + 8 * 3600000).toISOString() }
        : {}),
    })
    .select("id")
    .single();
  if (error) throw Error("INTERNAL");
  c.set(cookieName("session"), sign(raw, secret()), {
    ...cookieOptions,
    maxAge: 8 * 3600,
  });
  return data.id as string;
}
