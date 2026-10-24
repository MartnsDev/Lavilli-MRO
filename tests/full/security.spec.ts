import { test, expect } from "@playwright/test";
import { randomBytes, randomUUID, createHash, createHmac } from "node:crypto";
import { admin, isolated, login } from "./helpers";
const origin = "http://localhost:3100";
const hash = (v: string) => createHash("sha256").update(v).digest("hex");
test.beforeEach(() => isolated());
test("correct shared PIN alone cannot create a session or reveal mechanic identities", async ({
  request,
}) => {
  const state = await (await request.get("/api/auth/status")).json();
  expect(state.deviceAuthorized).toBe(false);
  expect(state.mechanics).toEqual([]);
  const { data } = await admin()
    .from("mechanics")
    .select("id")
    .eq("name", "César")
    .single();
  const r = await request.post("/api/auth/login", {
    headers: { origin },
    data: { pin: process.env.TEST_PIN, mechanic_id: data!.id },
  });
  expect(r.status()).toBe(401);
  expect(r.headers()["set-cookie"]).toBeUndefined();
});
test("invalid, expired and replayed independent enrollment grants cannot authorize devices", async ({
  playwright,
  request,
}) => {
  const code = randomBytes(32).toString("base64url");
  const issue = await admin().rpc("issue_device_grant", {
    p_hash: hash(code),
    p_purpose: "enroll",
  });
  expect(issue.error).toBeNull();
  const other = await playwright.request.newContext({ baseURL: origin });
  const responses = await Promise.all(
    [request, other].map((r) =>
      r.post("/api/auth/enroll", { headers: { origin }, data: { code } }),
    ),
  );
  expect(responses.map((r) => r.status()).sort()).toEqual([200, 403]);
  const bad = await other.post("/api/auth/enroll", {
    headers: { origin },
    data: { code: randomBytes(32).toString("base64url") },
  });
  expect(bad.status()).toBe(403);
  await other.dispose();
});
test("every private API refuses anonymous reads and writes with no-store responses", async ({
  request,
}) => {
  const paths = [
    "/api/security",
    "/api/health",
    "/api/options/mechanics",
    "/api/options/tools",
    "/api/kits/" + randomUUID(),
    "/api/reports?entity=tools",
    "/api/labels?entity=tools&id=" + randomUUID(),
    "/api/documents/" + randomUUID(),
    "/api/imports/template?category=tools",
  ];
  for (const path of paths) {
    const r = await request.get(path);
    expect(r.status(), path).toBe(401);
    expect(r.headers()["cache-control"]).toContain("no-store");
  }
  for (const path of [
    "/api/confirm",
    "/api/operations",
    "/api/documents/upload",
    "/api/imports/preview",
    "/api/security",
  ]) {
    const r = await request.post(path, { headers: { origin }, data: {} });
    expect(r.status(), path).toBe(401);
  }
});
test("session token alone, revoked device and copied cookies fail the central data boundary", async ({
  request,
  playwright,
}) => {
  await login(request);
  const state = await request.storageState();
  const clone = await playwright.request.newContext({
    baseURL: origin,
    storageState: state,
  });
  const sessionOnly = await playwright.request.newContext({
    baseURL: origin,
    storageState: {
      cookies: state.cookies.filter((c) => c.name.endsWith("lavilli_session")),
      origins: [],
    },
  });
  expect((await sessionOnly.get("/api/health")).status()).toBe(401);
  const { data } = await (await request.get("/api/security")).json();
  const current = data.find(
    (d: { revoked_at: string | null }) => !d.revoked_at,
  );
  expect(current).toBeTruthy();
  // Revoke every active device through its real admin endpoint to include this session's device.
  for (const d of data.filter(
    (d: { revoked_at: string | null }) => !d.revoked_at,
  )) {
    const r = await request.post("/api/security", {
      headers: { origin },
      data: {
        action: "revoke_device",
        pin: process.env.TEST_PIN,
        device_id: d.id,
      },
    });
    if (r.status() === 401) break;
    expect(r.status()).toBe(200);
  }
  expect((await clone.get("/api/health")).status()).toBe(401);
  await clone.dispose();
  await sessionOnly.dispose();
});
test("ordinary session cannot export or change security; the short PIN cannot elevate itself", async ({
  request,
}) => {
  await login(request, "César", false);
  expect((await request.get("/api/reports?entity=tools")).status()).toBe(403);
  const r = await request.post("/api/security", {
    headers: { origin },
    data: { action: "elevate", pin: process.env.TEST_PIN },
  });
  expect(r.status()).toBe(403);
  const forbidden = await request.post("/api/security", {
    headers: { origin },
    data: { action: "revoke_sessions", pin: process.env.TEST_PIN },
  });
  expect(forbidden.status()).toBe(403);
});
test("distributed limiter persists and serializes concurrent attempts in database", async () => {
  const key = hash(randomUUID());
  const r = await Promise.all(
    Array.from({ length: 12 }, () =>
      admin().rpc("security_limit", {
        p_keys: [key],
        p_limits: [5],
        p_window: 900,
      }),
    ),
  );
  expect(r.every((v) => !v.error)).toBe(true);
  expect(r.filter((v) => v.data.allowed)).toHaveLength(5);
  expect(r.filter((v) => !v.data.allowed)).toHaveLength(7);
});
test("invalid Origin, cross-site fetch and oversized chunked JSON are rejected", async ({
  request,
}) => {
  await login(request);
  expect(
    (
      await request.post("/api/confirm", {
        headers: { origin: "https://attacker.invalid" },
        data: {},
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await request.post("/api/confirm", {
        headers: { origin, "sec-fetch-site": "cross-site" },
        data: {},
      })
    ).status(),
  ).toBe(403);
  const r = await request.post("/api/operations", {
    headers: { origin, "content-type": "application/json" },
    data: JSON.stringify({ padding: "x".repeat(70000) }),
  });
  expect(r.status()).toBe(413);
});
test("CSP uses a fresh nonce and blocks inline/eval scripts in production; cache is private", async ({
  request,
}) => {
  const a = await request.get("/login"),
    b = await request.get("/login");
  const csp = a.headers()["content-security-policy"];
  expect(csp).toContain("'nonce-");
  expect(csp.split("script-src")[1].split(";")[0]).not.toMatch(
    /unsafe-inline|unsafe-eval/,
  );
  expect(csp).not.toBe(b.headers()["content-security-policy"]);
  expect(csp).toContain("frame-ancestors 'none'");
  expect(a.headers()["cache-control"]).toContain("no-store");
  expect(a.headers()["x-request-id"]).toMatch(/^[a-f0-9-]{36}$/);
});
test("anon and authenticated Data API roles cannot access application tables or RPCs", async ({
  request,
}) => {
  const claims = {
    role: "authenticated",
    sub: randomUUID(),
    iss: "supabase-demo",
    exp: Math.floor(Date.now() / 1000) + 300,
  };
  const header = Buffer.from(
    JSON.stringify({ alg: "HS256", typ: "JWT" }),
  ).toString("base64url");
  const body = Buffer.from(JSON.stringify(claims)).toString("base64url");
  const jwt =
    header +
    "." +
    body +
    "." +
    createHmac("sha256", process.env.TEST_JWT_SECRET!)
      .update(header + "." + body)
      .digest("base64url");
  const api = process.env.SUPABASE_URL!;
  const anon = process.env.TEST_SUPABASE_ANON_KEY!;
  for (const bearer of [anon, jwt]) {
    for (const table of [
      "stock_lots",
      "mechanics",
      "authorized_devices",
      "access_sessions",
      "audit_events",
      "documents",
      "document_versions",
    ]) {
      const r = await request.get(
        api + "/rest/v1/" + table + "?select=id&limit=1",
        { headers: { apikey: anon, Authorization: "Bearer " + bearer } },
      );
      expect(r.status(), table).toBeGreaterThanOrEqual(400);
      expect((await r.json()).code).toBe("42501");
    }
    const rpc = await request.post(api + "/rest/v1/rpc/run_operation", {
      headers: { apikey: anon, Authorization: "Bearer " + bearer },
      data: {
        p_session: randomUUID(),
        p_confirmation: randomUUID(),
        p_operation: randomUUID(),
        p_hash: "forged",
        p_command: {},
      },
    });
    expect(rpc.status()).toBeGreaterThanOrEqual(400);
  }
});
test("deceptive file headers, traversal names and public Storage cannot bypass the private proxy", async ({
  request,
}) => {
  await login(request);
  const r = await request.post("/api/documents/upload", {
    headers: { origin },
    multipart: {
      file: {
        name: "../../payload.svg",
        mimeType: "image/svg+xml",
        buffer: Buffer.from('<svg onload="alert(1)"></svg>'),
      },
      payload: "{}",
    },
  });
  expect(r.status()).toBe(400);
  const path =
    process.env.SUPABASE_URL +
    "/storage/v1/object/public/operational-documents/unknown";
  expect((await request.get(path)).status()).toBeGreaterThanOrEqual(400);
});
