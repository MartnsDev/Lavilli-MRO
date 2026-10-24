import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import { randomBytes, randomInt } from "node:crypto";
import { hash } from "@node-rs/argon2";
import { digest, sign, unsign } from "../src/lib/domain/security";
const fake = vi.hoisted(() => ({
  devicePresent: true,
  jar: new Map<string, { value: string }>(),
  set: vi.fn(),
  insert: vi.fn(),
  rpc: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("next/headers", () => ({
  headers: async () => new Headers(),
  cookies: async () => ({
    get: (name: string) => fake.jar.get(name),
    set: fake.set,
    delete: vi.fn(),
  }),
}));
vi.mock("../src/lib/server/db", () => ({
  infrastructureConfigured: () => true,
  configured: () => Boolean(process.env.PIN_HASH),
  rpc: fake.rpc,
  db: () => ({
    from: (table: string) =>
      table === "authorized_devices"
        ? {
            select: () => ({
              eq: () => ({
                is: () => ({
                  gt: () => ({
                    maybeSingle: async () => ({
                      data: fake.devicePresent
                        ? { id: "00000000-0000-4000-8000-000000000001" }
                        : null,
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          }
        : { insert: fake.insert },
  }),
}));
vi.mock("../src/lib/server/local-pin", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../src/lib/server/local-pin")>();
  return {
    ...actual,
    initializeLocalPin: vi.fn(async () => {
      throw new Error("FORBIDDEN");
    }),
  };
});
let pin: string, secret: string;
beforeEach(async () => {
  vi.resetModules();
  pin = String(randomInt(1000, 10000));
  secret = randomBytes(32).toString("base64url");
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("APP_URL", "https://hangar.example.invalid");
  vi.stubEnv("SESSION_SECRET", secret);
  vi.stubEnv(
    "PIN_HASH",
    await hash(pin, { algorithm: 2, memoryCost: 4096, timeCost: 1 }),
  );
  fake.jar.clear();
  fake.jar.set("lavilli_device", {
    value: sign(randomBytes(32).toString("base64url"), secret),
  });
  fake.devicePresent = true;
  fake.set.mockClear();
  fake.insert.mockReset().mockResolvedValue({ error: null });
  fake.rpc.mockClear();
});
afterEach(() => vi.unstubAllEnvs());
async function post(
  action: string,
  body: unknown,
  origin = process.env.APP_URL!,
) {
  const { POST } = await import("../src/app/api/auth/[action]/route");
  return POST(
    new Request(process.env.APP_URL + "/api/auth/" + action, {
      method: "POST",
      headers: { origin, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ action }) },
  );
}
describe("server authentication routes", () => {
  it("accepts the configured PIN only with a valid authorized device and creates an opaque secure session", async () => {
    const response = await post("login", { pin });
    expect(response.status).toBe(200);
    expect(fake.insert).toHaveBeenCalledOnce();
    expect(fake.set).toHaveBeenCalledOnce();
    const [name, signed, options] = fake.set.mock.calls[0];
    expect(name).toBe("lavilli_session");
    expect(options).toMatchObject({
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 28800,
    });
    const raw = unsign(signed, secret);
    expect(raw).toBeTruthy();
    expect(fake.insert.mock.calls[0][0].token_hash).toBe(digest(raw!));
  });
  it("rejects an incorrect PIN without creating a session", async () => {
    const wrong = String((Number(pin) + 1) % 10000).padStart(4, "0");
    expect((await post("login", { pin: wrong })).status).toBe(403);
    expect(fake.insert).not.toHaveBeenCalled();
    expect(fake.set).not.toHaveBeenCalled();
  });
  it("directs a new or revoked device to authorization rather than misreporting the PIN", async () => {
    fake.devicePresent = false;
    const r = await post("login", { pin });
    expect(r.status).toBe(401);
    expect((await r.json()).code).toBe("DEVICE_REQUIRED");
    expect(fake.insert).not.toHaveBeenCalled();
  });
  it("explains the unconfigured PIN and refuses access instead of silently failing", async () => {
    vi.stubEnv("PIN_HASH", "");
    const r = await post("login", { pin });
    expect(r.status).toBe(503);
    expect((await r.json()).code).toBe("PIN_NOT_CONFIGURED");
    expect(fake.set).not.toHaveBeenCalled();
  });
  it("rejects a foreign origin before authentication", async () => {
    expect(
      (await post("login", { pin }, "https://foreign.example.invalid")).status,
    ).toBe(403);
    expect(fake.insert).not.toHaveBeenCalled();
  });
  it("does not expose a public password-setting endpoint in production", async () => {
    vi.stubEnv("PIN_HASH", "");
    const r = await post("initialize", {
      code: randomBytes(32).toString("base64url"),
      pin,
      pin_confirmation: pin,
    });
    expect(r.status).toBe(403);
    expect((await r.json()).code).toBe("LOCAL_SETUP_ONLY");
    expect(fake.rpc).not.toHaveBeenCalled();
    expect(fake.insert).not.toHaveBeenCalled();
  });
  it("rejects mismatched initialization PINs before any credential write", async () => {
    vi.stubEnv("PIN_HASH", "");
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("APP_URL", "http://localhost:3000");
    vi.stubEnv("DEVICE_BOOTSTRAP_HASH", digest("test-only-unrelated-proof"));
    const r = await post("initialize", {
      code: randomBytes(32).toString("base64url"),
      pin,
      pin_confirmation: "invalid",
    });
    expect(r.status).toBe(400);
    expect(fake.insert).not.toHaveBeenCalled();
  });
});

it("accepts the portable Argon2id representation stored in .env.local", async () => {
  const { encodePinHash } = await import("../src/lib/domain/pin-hash.mjs");
  vi.stubEnv("PIN_HASH", encodePinHash(process.env.PIN_HASH!));
  const r = await post("login", { pin });
  expect(r.status).toBe(200);
  expect(fake.set).toHaveBeenCalledOnce();
});
