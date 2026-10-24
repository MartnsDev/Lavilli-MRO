import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
export const digest = (v: string) =>
  createHash("sha256").update(v).digest("hex");
export const token = () => randomBytes(32).toString("base64url");
export function sign(value: string, secret: string) {
  return (
    value + "." + createHmac("sha256", secret).update(value).digest("base64url")
  );
}
export function unsign(value: string | undefined, secret: string) {
  if (!value || !/^[A-Za-z0-9_-]{1,128}\.[A-Za-z0-9_-]{43}$/.test(value))
    return null;
  const index = value.lastIndexOf(".");
  if (index < 1) return null;
  const raw = value.slice(0, index),
    expected = sign(raw, secret);
  return expected.length === value.length &&
    timingSafeEqual(Buffer.from(expected), Buffer.from(value))
    ? raw
    : null;
}
export function canonical(value: unknown): string {
  if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]";
  if (value && typeof value === "object")
    return (
      "{" +
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => JSON.stringify(k) + ":" + canonical(v))
        .join(",") +
      "}"
    );
  return JSON.stringify(value);
}
export function operationHash(value: unknown) {
  return digest(canonical(value));
}
export function safeCSV(value: unknown) {
  const s = String(value ?? "");
  return (
    '"' +
    (/^[\s\p{Cc}\p{Cf}]*[=+@\-]/u.test(s) ? "'" + s : s).replaceAll('"', '""') +
    '"'
  );
}

export function sameAppOrigin(
  origin: string | null,
  appURL: string | undefined,
  development = false,
) {
  if (!origin || !appURL) return false;
  try {
    const expected = new URL(appURL),
      actual = new URL(origin);
    if (
      !["http:", "https:"].includes(expected.protocol) ||
      actual.origin !== origin
    )
      return false;
    if (actual.origin === expected.origin) return true;
    const loopback = new Set(["localhost", "127.0.0.1", "[::1]"]);
    return (
      development &&
      loopback.has(actual.hostname) &&
      loopback.has(expected.hostname) &&
      actual.port === expected.port &&
      actual.protocol === expected.protocol
    );
  } catch {
    return false;
  }
}
