import { encodePinHash, decodePinHash } from "../src/lib/domain/pin-hash.mjs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { randomBytes, randomInt } from "node:crypto";
import { hash, verify } from "@node-rs/argon2";
import { digest } from "../src/lib/domain/security";
import { initialAccessMode, type AccessState } from "../src/lib/domain/access";
const fake = vi.hoisted(() => ({
  used: false,
  audit: vi.fn().mockResolvedValue({ error: null }),
  from: vi.fn(),
}));
vi.mock("../src/lib/server/db", () => ({ db: () => ({ from: fake.from }) }));
import {
  initializeLocalPin,
  localPinSetupEnabled,
  persistInitialPinHash,
  validBootstrapCode,
} from "../src/lib/server/local-pin";
let folder: string, envPath: string, code: string;
beforeEach(async () => {
  folder = await fs.mkdtemp(path.join(os.tmpdir(), "lavilli-pin-test-"));
  envPath = path.join(folder, ".env.local");
  await fs.writeFile(
    envPath,
    "APP_URL=http://localhost:3000\nPIN_HASH=\nPRESERVE_TEST_VALUE=yes\n",
    { mode: 0o600 },
  );
  code = randomBytes(32).toString("base64url");
  vi.stubEnv("NODE_ENV", "development");
  vi.stubEnv("APP_URL", "http://localhost:3000");
  vi.stubEnv("DEVICE_BOOTSTRAP_HASH", digest(code));
  vi.stubEnv("PIN_HASH", "");
  fake.used = false;
  fake.audit.mockClear();
  fake.from.mockReset();
  fake.from.mockImplementation((table: string) =>
    table === "bootstrap_uses"
      ? {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: fake.used ? { token_hash: digest(code) } : null,
                error: null,
              }),
            }),
          }),
        }
      : { insert: fake.audit },
  );
});
afterEach(async () => {
  vi.unstubAllEnvs();
  await fs.rm(folder, { recursive: true, force: true });
});
describe("owner initialization boundary", () => {
  it("requires local development and refuses production or remote hosts", () => {
    expect(localPinSetupEnabled()).toBe(true);
    expect(
      localPinSetupEnabled({ ...process.env, NODE_ENV: "production" }),
    ).toBe(false);
    expect(
      localPinSetupEnabled({
        ...process.env,
        APP_URL: "https://hangar.example.invalid",
      }),
    ).toBe(false);
  });
  it("validates high-entropy bootstrap proof without accepting the PIN as proof", () => {
    expect(validBootstrapCode(code, digest(code))).toBe(true);
    expect(validBootstrapCode("invalid", digest(code))).toBe(false);
    expect(
      validBootstrapCode(randomBytes(32).toString("hex"), digest(code)),
    ).toBe(false);
  });
  it("rejects initialization without owner proof and leaves configuration unchanged", async () => {
    await expect(
      initializeLocalPin("invalid", "invalid", { envPath }),
    ).rejects.toThrow("INVALID_BOOTSTRAP");
    expect(fake.from).not.toHaveBeenCalled();
    expect(await fs.readFile(envPath, "utf8")).toContain("PIN_HASH=\n");
  });
  it("cannot initialize the production environment even with valid bootstrap proof", async () => {
    vi.stubEnv("NODE_ENV", "production");
    await expect(
      initializeLocalPin(code, String(randomInt(1000, 10000)), { envPath }),
    ).rejects.toThrow("LOCAL_SETUP_ONLY");
    expect(fake.from).not.toHaveBeenCalled();
  });
  it("rejects consumed recovery proof", async () => {
    fake.used = true;
    const pin = String(randomInt(1000, 10000));
    await expect(initializeLocalPin(code, pin, { envPath })).rejects.toThrow(
      "BOOTSTRAP_USED",
    );
    expect(process.env.PIN_HASH).toBe("");
  });
  it("sets only an Argon2id hash, preserves environment values and audits no secrets", async () => {
    const pin = String(randomInt(1000, 10000));
    await initializeLocalPin(code, pin, { envPath });
    const text = await fs.readFile(envPath, "utf8"),
      encoded = text.match(/^PIN_HASH=(.*)$/m)![1];
    expect(await verify(decodePinHash(encoded), pin)).toBe(true);
    expect(text).toContain("PRESERVE_TEST_VALUE=yes");
    expect((await fs.stat(envPath)).mode & 0o777).toBe(0o600);
    expect(fake.audit).toHaveBeenCalledOnce();
    const payload = JSON.stringify(fake.audit.mock.calls[0][0]);
    expect(payload).not.toContain(pin);
    expect(payload).not.toContain(encoded);
    expect(payload).not.toContain(code);
    expect(payload).toContain("Sistema");
  });
  it("does not permit replacing an existing PIN", async () => {
    vi.stubEnv("PIN_HASH", "test-only-existing-hash");
    await expect(
      initializeLocalPin(code, String(randomInt(1000, 10000)), { envPath }),
    ).rejects.toThrow();
    expect(process.env.PIN_HASH).toBe("test-only-existing-hash");
  });
  it("serializes simultaneous initialization so only one hash is installed", async () => {
    const a = await hash(randomBytes(8).toString("hex"), {
        algorithm: 2,
        memoryCost: 4096,
        timeCost: 1,
      }),
      b = await hash(randomBytes(8).toString("hex"), {
        algorithm: 2,
        memoryCost: 4096,
        timeCost: 1,
      });
    const result = await Promise.allSettled([
      persistInitialPinHash(a, envPath),
      persistInitialPinHash(b, envPath),
    ]);
    expect(result.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const encoded = (await fs.readFile(envPath, "utf8")).match(
      /^PIN_HASH=(.*)$/m,
    )![1];
    expect([encodePinHash(a), encodePinHash(b)]).toContain(encoded);
    await expect(
      persistInitialPinHash(decodePinHash(encoded), envPath),
    ).rejects.toThrow("PIN_ALREADY_CONFIGURED");
  });
});
describe("access flow states", () => {
  const base: AccessState = {
    infrastructureReady: true,
    passwordConfigured: true,
    deviceAuthorized: true,
    emailEnabled: false,
    localSetupEnabled: true,
    recoveryAvailable: true,
  };
  it("shows PIN only after setup and device authorization", () => {
    expect(initialAccessMode(base)).toBe("login");
    expect(initialAccessMode({ ...base, passwordConfigured: false })).toBe(
      "initialize",
    );
    expect(initialAccessMode({ ...base, deviceAuthorized: false })).toBe(
      "bootstrap",
    );
    expect(
      initialAccessMode({
        ...base,
        passwordConfigured: false,
        localSetupEnabled: false,
      }),
    ).toBe("unavailable");
    expect(initialAccessMode({ ...base, infrastructureReady: false })).toBe(
      "unavailable",
    );
  });
});
