import "server-only";
import { cookies, headers } from "next/headers";
import { verify } from "@node-rs/argon2";
import { db, rpc } from "./db";
import { digest, token, sign, unsign } from "@/lib/domain/security";
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
  const expected = process.env.APP_URL;
  if (!expected || request.headers.get("origin") !== new URL(expected).origin)
    throw new Error("CSRF");
}
export async function fingerprint() {
  const h = await headers();
  const ip = process.env.VERCEL
    ? h.get("x-vercel-forwarded-for")?.split(",")[0]?.trim()
    : "local";
  return digest((ip || "unknown") + secret());
}
export async function limit(scope: string, device = "") {
  await rpc("take_attempt", {
    p_key: digest(scope + (await fingerprint()) + device),
    p_limit: 5,
  });
}
export async function clearLimit(scope: string, device = "") {
  await rpc("reset_attempt", {
    p_key: digest(scope + (await fingerprint()) + device),
  });
}
export async function checkPin(pin: string) {
  if (
    !/^\d{4}$/.test(pin) ||
    !process.env.PIN_HASH ||
    !(await verify(process.env.PIN_HASH, pin))
  )
    throw new Error("INVALID_PIN");
}
export async function device() {
  const c = await cookies();
  const cookie = c.get("lavilli_device")?.value;
  if (!cookie) throw new Error("UNAUTHORIZED");
  const raw = unsign(cookie, secret());
  if (!raw) throw new Error("UNAUTHORIZED");
  const { data, error } = await db()
    .from("authorized_devices")
    .select("id")
    .eq("token_hash", digest(raw))
    .is("revoked_at", null)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  if (error || !data) throw new Error("UNAUTHORIZED");
  return data.id as string;
}
export async function session() {
  const c = await cookies();
  const cookie = c.get("lavilli_session")?.value;
  if (!cookie) throw new Error("UNAUTHORIZED");
  const raw = unsign(cookie, secret());
  if (!raw) throw new Error("UNAUTHORIZED");
  const deviceId = await device();
  const { data, error } = await db()
    .from("access_sessions")
    .select("id,device_id")
    .eq("token_hash", digest(raw))
    .eq("device_id", deviceId)
    .is("revoked_at", null)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  if (error || !data) throw new Error("UNAUTHORIZED");
  return data as { id: string; device_id: string };
}
export async function startSession(deviceId: string) {
  const raw = token();
  const { error } = await db()
    .from("access_sessions")
    .insert({
      device_id: deviceId,
      token_hash: digest(raw),
      expires_at: new Date(Date.now() + 8 * 3600_000).toISOString(),
    });
  if (error) throw new Error("INTERNAL");
  (await cookies()).set("lavilli_session", sign(raw, secret()), {
    ...cookieOptions,
    maxAge: 8 * 3600,
  });
}
