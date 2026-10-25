import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import { randomBytes, randomInt } from "node:crypto";
import { hash } from "@node-rs/argon2";
import { sign, unsign, digest } from "../src/lib/domain/security";
const id = "00000000-0000-4000-8000-000000000001";
const fake = vi.hoisted(() => ({
  device: true,
  hardened: true,
  jar: new Map<string, { value: string }>(),
  set: vi.fn(),
  insert: vi.fn(),
  rpc: vi.fn(),
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
  configured: () => Boolean(process.env.PIN_HASH),
  securityBoundaryReady: async () => fake.hardened,
  infrastructureConfigured: () => true,
  rpc: fake.rpc,
  db: () => ({
    from: () => {
      const q = {
        select: () => q,
        eq: () => q,
        maybeSingle: async () => ({ data: { id }, error: null }),
        single: async () => ({ data: { id }, error: null }),
        insert: (data: unknown) => {
          fake.insert(data);
          return q;
        },
        update: () => q,
        then: (resolve: (v: unknown) => void) => resolve({ error: null }),
      };
      return q;
    },
  }),
}));
let pin: string, secret: string;
beforeEach(async () => {
  vi.resetModules();
  pin = String(randomInt(1000, 10000));
  secret = randomBytes(32).toString("hex");
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("APP_URL", "https://hangar.example.invalid");
  vi.stubEnv("SESSION_SECRET", secret);
  vi.stubEnv(
    "PIN_HASH",
    await hash(pin, { algorithm: 2, memoryCost: 4096, timeCost: 1 }),
  );
  fake.device = true;
  fake.hardened = true;
  fake.jar.clear();
  fake.jar.set("__Host-lavilli_device", {
    value: sign(randomBytes(32).toString("base64url"), secret),
  });
  fake.set.mockClear();
  fake.insert.mockClear();
  fake.rpc
    .mockReset()
    .mockImplementation(async (name: string) =>
      name === "authorize_device"
        ? id
        : name === "check_device"
          ? fake.device
            ? id
            : null
          : name === "security_limit"
            ? { allowed: true, delay_ms: 0 }
            : null,
    );
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
describe("shared PIN authentication", () => {
  it("supports the existing database schema without applying migrations", async () => {
    fake.hardened = false;
    fake.jar.clear();
    expect((await post("login", { pin, mechanic_id: id })).status).toBe(200);
    expect(fake.rpc).toHaveBeenCalledWith("take_attempt", expect.any(Object));
    expect(fake.rpc.mock.calls.some((c) => c[0] === "issue_device_grant")).toBe(
      false,
    );
  });
  it("accepts the correct PIN in a fresh browser without enrollment", async () => {
    fake.jar.clear();
    expect((await post("login", { pin, mechanic_id: id })).status).toBe(200);
    expect(fake.rpc).toHaveBeenCalledWith(
      "authorize_device",
      expect.any(Object),
    );
  });
  it("does not provision access before checking the PIN", async () => {
    fake.jar.clear();
    expect(
      (await post("login", { pin: "00000", mechanic_id: id })).status,
    ).toBe(400);
    expect(fake.insert).not.toHaveBeenCalled();
    expect(fake.rpc.mock.calls.some((c) => c[0] === "issue_device_grant")).toBe(
      false,
    );
  });
  it("refuses a wrong four-digit PIN before creating a session", async () => {
    fake.jar.clear();
    expect((await post("login", { pin: "0000", mechanic_id: id })).status).toBe(
      403,
    );
    expect(fake.insert).not.toHaveBeenCalled();
    expect(fake.rpc.mock.calls.some((c) => c[0] === "issue_device_grant")).toBe(
      false,
    );
  });
  it("creates an opaque device-bound secure session", async () => {
    const r = await post("login", { pin, mechanic_id: id });
    expect(r.status).toBe(200);
    const [name, value, opts] = fake.set.mock.calls.find(
      (c) => c[0] === "__Host-lavilli_session",
    )!;
    expect(name).toBe("__Host-lavilli_session");
    expect(opts).toMatchObject({
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
      maxAge: 28800,
    });
    const raw = unsign(value, secret);
    expect(raw).toBeTruthy();
    expect(fake.insert.mock.calls[0][0]).toMatchObject({
      device_id: id,
      mechanic_id: id,
      token_hash: digest(raw!),
    });
  });
  it("rejects incorrect PIN and foreign origins without sessions", async () => {
    expect(
      (await post("login", { pin: "invalid", mechanic_id: id })).status,
    ).toBe(400);
    expect(
      (
        await post(
          "login",
          { pin, mechanic_id: id },
          "https://foreign.example.invalid",
        )
      ).status,
    ).toBe(403);
    expect(fake.insert).not.toHaveBeenCalled();
  });
  it("does not expose the retired enrollment endpoint", async () => {
    expect(
      (await post("enroll", { code: randomBytes(32).toString("base64url") }))
        .status,
    ).toBe(404);
    expect(fake.set).not.toHaveBeenCalled();
  });
  it("does not allow public PIN initialization", async () => {
    for (const action of ["initialize", "bootstrap", "request-otp"])
      expect((await post(action, { pin })).status).toBe(404);
  });
});
