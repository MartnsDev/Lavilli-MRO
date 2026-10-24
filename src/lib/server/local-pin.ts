import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID, timingSafeEqual } from "node:crypto";
import { hash } from "@node-rs/argon2";
import { digest } from "@/lib/domain/security";
import { db } from "./db";
import { encodePinHash, decodePinHash } from "@/lib/domain/pin-hash.mjs";

export function localPinSetupEnabled(env: NodeJS.ProcessEnv = process.env) {
  if (env.NODE_ENV !== "development" || !env.DEVICE_BOOTSTRAP_HASH)
    return false;
  try {
    return ["localhost", "127.0.0.1", "[::1]"].includes(
      new URL(env.APP_URL ?? "").hostname,
    );
  } catch {
    return false;
  }
}
export function validBootstrapCode(code: string, expected: string | undefined) {
  if (code.length < 32 || !/^[a-f0-9]{64}$/.test(expected ?? "")) return false;
  return timingSafeEqual(
    Buffer.from(digest(code), "hex"),
    Buffer.from(expected!, "hex"),
  );
}
// Authorization is enforced by initializeLocalPin before this file operation.
// The explicit path supports isolated filesystem tests; it is never accepted from HTTP.
export async function persistInitialPinHash(
  encoded: string,
  envPath = path.resolve(".env.local"),
) {
  if (!encoded.startsWith("$argon2id$")) throw new Error("INVALID_OPERATION");
  const folder = path.join(path.dirname(envPath), ".local-secrets");
  await fs.mkdir(folder, { recursive: true, mode: 0o700 });
  const lockPath = path.join(folder, "pin-initialization.lock");
  let lock;
  try {
    lock = await fs.open(lockPath, "wx", 0o600);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST")
      throw new Error("SETUP_WRITE_FAILED");
    throw new Error("SETUP_BUSY");
  }
  const stored = encodePinHash(encoded);
  const temporary = envPath + ".pin-" + randomUUID() + ".tmp";
  try {
    const stat = await fs.lstat(envPath);
    if (!stat.isFile()) throw new Error("SETUP_WRITE_FAILED");
    let content = await fs.readFile(envPath, "utf8");
    const existing = content
      .match(/^PIN_HASH=(.*)$/m)?.[1]
      ?.trim()
      .replace(/^['"]|['"]$/g, "");
    if (existing) throw new Error("PIN_ALREADY_CONFIGURED");
    content = /^PIN_HASH=.*$/m.test(content)
      ? content.replace(/^PIN_HASH=.*$/m, () => `PIN_HASH=${stored}`)
      : content + `\nPIN_HASH=${stored}\n`;
    await fs.writeFile(temporary, content, { mode: 0o600, flag: "wx" });
    await fs.rename(temporary, envPath);
  } catch (error) {
    if ((error as Error).message === "PIN_ALREADY_CONFIGURED") throw error;
    throw new Error("SETUP_WRITE_FAILED");
  } finally {
    await fs.unlink(temporary).catch(() => {});
    await lock.close();
    await fs.unlink(lockPath).catch(() => {});
  }
}
export async function initializeLocalPin(
  code: string,
  pin: string,
  options: { envPath?: string } = {},
) {
  if (!localPinSetupEnabled()) throw new Error("LOCAL_SETUP_ONLY");
  if (!validBootstrapCode(code, process.env.DEVICE_BOOTSTRAP_HASH))
    throw new Error("INVALID_BOOTSTRAP");
  if (!/^\d{4}$/.test(pin)) throw new Error("INVALID_PIN");
  if (process.env.PIN_HASH) throw new Error("PIN_ALREADY_CONFIGURED");
  const { data, error } = await db()
    .from("bootstrap_uses")
    .select("token_hash")
    .eq("token_hash", digest(code))
    .maybeSingle();
  if (error) throw new Error("INTERNAL");
  if (data) throw new Error("BOOTSTRAP_USED");
  const encoded = await hash(pin, {
    algorithm: 2,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 1,
  });
  try {
    await persistInitialPinHash(encoded, options.envPath);
  } catch (error) {
    if ((error as Error).message === "PIN_ALREADY_CONFIGURED") {
      const content = await fs.readFile(
        options.envPath ?? path.resolve(".env.local"),
        "utf8",
      );
      const existing = content
        .match(/^PIN_HASH=(.*)$/m)?.[1]
        ?.trim()
        .replace(/^['"]|['"]$/g, "");
      if (existing) {
        try {
          decodePinHash(existing);
          process.env.PIN_HASH = existing;
        } catch {}
      }
    }
    throw error;
  }
  process.env.PIN_HASH = encodePinHash(encoded);
  const { error: auditError } = await db()
    .from("audit_events")
    .insert({
      entity: "app_settings",
      action: "pin_initialized",
      after_data: { source: "local_owner_setup", actor: "Sistema" },
    });
  if (auditError)
    console.warn(
      JSON.stringify({
        event: "pin_initialization_audit_failed",
        at: new Date().toISOString(),
      }),
    );
}
