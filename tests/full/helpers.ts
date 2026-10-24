import { expect, type APIRequestContext } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import WebSocket from "ws";
import { randomUUID, randomBytes, createHash } from "node:crypto";
const actors = new WeakMap<APIRequestContext, string>();
export function isolated() {
  if (
    process.env.FULL_VERIFICATION !== "local-only" ||
    !process.env.TEST_PIN ||
    !/^http:\/\/(localhost|127\.0\.0\.1):/.test(process.env.SUPABASE_URL || "")
  )
    throw Error(
      "Use npm run test:full with a local Supabase; production writes are forbidden",
    );
}
export function admin() {
  isolated();
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false },
      realtime: { transport: WebSocket as never },
    },
  );
}
export async function enroll(request: APIRequestContext) {
  isolated();
  const state = await (await request.get("/api/auth/status")).json();
  if (state.deviceAuthorized) return;
  const code = randomBytes(32).toString("base64url");
  const { error } = await admin().rpc("issue_device_grant", {
    p_hash: createHash("sha256").update(code).digest("hex"),
    p_purpose: "enroll",
  });
  expect(error).toBeNull();
  const r = await request.post("/api/auth/enroll", {
    headers: { origin: "http://localhost:3100" },
    data: { code },
  });
  expect(r.status(), await r.text()).toBe(200);
}
export async function elevate(request: APIRequestContext) {
  const code = randomBytes(32).toString("base64url");
  const { error } = await admin().rpc("issue_device_grant", {
    p_hash: createHash("sha256").update(code).digest("hex"),
    p_purpose: "admin",
  });
  expect(error).toBeNull();
  const r = await request.post("/api/security", {
    headers: { origin: "http://localhost:3100" },
    data: { action: "elevate", pin: process.env.TEST_PIN, code },
  });
  expect(r.status(), await r.text()).toBe(200);
}
export async function login(
  request: APIRequestContext,
  name = "César",
  elevated = true,
) {
  await enroll(request);
  const state = await (await request.get("/api/auth/status")).json();
  const mechanic = state.mechanics.find(
    (m: { name: string }) => m.name === name,
  );
  expect(mechanic).toBeTruthy();
  const r = await request.post("/api/auth/login", {
    timeout: 30000,
    headers: { origin: "http://localhost:3100" },
    data: { mechanic_id: mechanic.id, pin: process.env.TEST_PIN },
  });
  expect(r.status(), await r.text()).toBe(200);
  actors.set(request, mechanic.id);
  if (elevated) await elevate(request);
  return mechanic.id as string;
}
export async function confirmed(
  request: APIRequestContext,
  command: Record<string, unknown>,
  actor?: string,
) {
  const mechanic_id = actor ?? actors.get(request) ?? (await login(request));
  const operation_id = randomUUID();
  const c = await request.post("/api/confirm", {
    headers: { origin: "http://localhost:3100" },
    data: { pin: process.env.TEST_PIN, mechanic_id, operation_id, command },
  });
  expect(c.status(), await c.text()).toBe(200);
  return {
    command,
    operation_id,
    confirmation_id: (await c.json()).confirmation_id,
  };
}
export async function operate(
  request: APIRequestContext,
  command: Record<string, unknown>,
  status = 200,
) {
  const payload = await confirmed(request, command);
  const r = await request.post("/api/operations", {
    headers: { origin: "http://localhost:3100" },
    data: payload,
  });
  expect(r.status(), await r.text()).toBe(status);
  return (await r.json()).data;
}
export async function create(
  request: APIRequestContext,
  entity: string,
  data: Record<string, unknown>,
) {
  return operate(request, {
    action: "create",
    entity,
    data,
    reason: "Verificação automatizada isolada",
  });
}
export async function row(entity: string, id: string) {
  const { data, error } = await admin()
    .from(entity)
    .select("*")
    .eq("id", id)
    .single();
  expect(error).toBeNull();
  return data!;
}
export async function action(
  request: APIRequestContext,
  kind: string,
  data: Record<string, unknown>,
  status = 200,
  entity?: string,
) {
  if (kind === "import_rows" && !data.source_id) {
    const rows = data.rows as Record<string, unknown>[];
    const keys = Object.keys(rows[0]);
    const csv = [
      keys.join(","),
      ...rows.map((r) =>
        keys.map((k) => JSON.stringify(String(r[k] ?? ""))).join(","),
      ),
    ].join("\n");
    const preview = await request.post("/api/imports/preview", {
      headers: { origin: "http://localhost:3100" },
      multipart: {
        file: {
          name: "source.csv",
          mimeType: "text/csv",
          buffer: Buffer.from(csv),
        },
      },
    });
    expect(preview.status(), await preview.text()).toBe(200);
    data = { ...data, source_id: (await preview.json()).source_id };
  }
  return operate(
    request,
    {
      action: kind,
      ...(entity ? { entity } : {}),
      data,
      reason: "Verificação automatizada isolada",
    },
    status,
  );
}
export const tag = () => "TEST-" + randomUUID().slice(0, 8);
export async function foundation(request: APIRequestContext) {
  const t = tag();
  const location = await create(request, "locations", {
    name: t,
    code: t,
    kind: "workshop",
    active: true,
  });
  const receiving = await create(request, "locations", {
    name: t + " retorno",
    code: t + "-R",
    kind: "receiving",
    active: true,
  });
  const catalog = await create(request, "part_catalog", {
    name: t,
    part_number: t,
    unit: "un",
    minimum_stock: 5,
  });
  const org = await create(request, "organizations", {
    name: t,
    kind: "third_party",
  });
  const aircraft = await create(request, "aircraft", {
    registration:
      "PT-" + randomUUID().replaceAll("-", "").slice(0, 5).toUpperCase(),
    status: "active",
  });
  const lot = await create(request, "stock_lots", {
    catalog_id: catalog.id,
    code: t,
    location_id: location.id,
    condition: "pending",
    documentation: "pending",
  });
  return { t, location, receiving, catalog, org, aircraft, lot };
}
export async function available(
  request: APIRequestContext,
  id: string,
  quantity = 20,
) {
  await action(request, "stock", { lot_id: id, kind: "receive", quantity });
  await action(request, "stock", {
    lot_id: id,
    kind: "verify",
    quantity: 1,
    condition: "serviceable",
    documentation: "complete",
  });
}
