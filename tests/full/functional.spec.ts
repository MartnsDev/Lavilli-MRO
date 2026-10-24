import { test, expect } from "@playwright/test";
import { randomUUID, createHash } from "node:crypto";
import { PDFDocument } from "pdf-lib";
import ExcelJS from "exceljs";
import {
  admin,
  isolated,
  login,
  confirmed,
  operate,
  create,
  row,
  action,
  tag,
  foundation,
  available,
} from "./helpers";
import { resources } from "../../src/lib/domain/resources";
test.beforeEach(() => isolated());
test("shared login works for both mechanics, wrong PIN fails, logout invalidates session", async ({
  request,
}) => {
  for (const name of ["César", "Maranhão"]) {
    await login(request, name);
    expect((await request.get("/api/health")).status()).toBe(200);
    expect((await request.get("/dashboard")).status()).toBe(200);
    expect(
      (
        await request.post("/api/auth/logout", {
          headers: { origin: "http://localhost:3100" },
        })
      ).status(),
    ).toBe(200);
    expect((await request.get("/api/health")).status()).toBe(401);
  }
  const state = await (await request.get("/api/auth/status")).json();
  const wrong = String((Number(process.env.TEST_PIN) + 1) % 10000).padStart(
    4,
    "0",
  );
  expect(
    (
      await request.post("/api/auth/login", {
        headers: { origin: "http://localhost:3100" },
        data: { mechanic_id: state.mechanics[0].id, pin: wrong },
      })
    ).status(),
  ).toBe(403);
  await login(request);
});
for (const [entity, meta] of Object.entries(resources)) {
  test(
    "authenticated list and reference options: " + entity,
    async ({ request }) => {
      await login(request);
      const r = await request.get("/records/" + entity);
      expect(r.status(), await r.text()).toBe(200);
      expect(await r.text()).toContain(meta.title);
      const o = await request.get("/api/options/" + entity);
      expect(o.status(), await o.text()).toBe(200);
      expect(Array.isArray((await o.json()).data)).toBe(true);
    },
  );
}
test("CRUD, optimistic concurrency, archive, hierarchy and audit preserve the actor", async ({
  request,
}) => {
  const f = await foundation(request);
  const child = await create(request, "locations", {
    name: f.t + " child",
    code: f.t + "-C",
    parent_id: f.location.id,
    kind: "drawer",
    active: true,
  });
  const updated = await operate(request, {
    action: "update",
    entity: "locations",
    id: child.id,
    version: child.version,
    data: {
      name: f.t + " revised",
      code: f.t + "-C",
      parent_id: f.location.id,
      kind: "drawer",
      active: true,
    },
    reason: "Corrigir localização",
  });
  expect(updated.version).toBe(child.version + 1);
  await operate(
    request,
    {
      action: "update",
      entity: "locations",
      id: child.id,
      version: child.version,
      data: {
        name: "Versão antiga",
        code: f.t + "-C",
        kind: "drawer",
        active: true,
      },
      reason: "Conflito esperado",
    },
    409,
  );
  await operate(
    request,
    {
      action: "update",
      entity: "locations",
      id: f.location.id,
      version: f.location.version,
      data: {
        name: f.t,
        code: f.t,
        kind: "workshop",
        active: true,
        parent_id: child.id,
      },
      reason: "Ciclo inválido",
    },
    400,
  );
  await operate(
    request,
    {
      action: "archive",
      entity: "locations",
      id: f.location.id,
      version: f.location.version,
      reason: "Local ocupado",
    },
    409,
  );
  await operate(request, {
    action: "archive",
    entity: "locations",
    id: child.id,
    version: updated.version,
    reason: "Arquivar local vazio",
  });
  expect((await row("locations", child.id)).archived_at).toBeTruthy();
  const { data: events, error } = await admin()
    .from("audit_events")
    .select("*,mechanics(name)")
    .eq("entity_id", child.id)
    .order("created_at");
  expect(error).toBeNull();
  expect(events!.length).toBeGreaterThanOrEqual(3);
  expect(events!.every((e) => e.mechanics.name === "César")).toBe(true);
});
test("stock receipt, verification, reservation, release, consumption, transfer and discard reconcile balances", async ({
  request,
}) => {
  const f = await foundation(request);
  await action(request, "stock", {
    lot_id: f.lot.id,
    kind: "receive",
    quantity: 20,
  });
  await action(
    request,
    "stock",
    { lot_id: f.lot.id, kind: "consume", quantity: 1 },
    409,
  );
  await action(request, "stock", {
    lot_id: f.lot.id,
    kind: "verify",
    quantity: 1,
    condition: "serviceable",
    documentation: "complete",
  });
  const reserve = await action(request, "stock", {
    lot_id: f.lot.id,
    kind: "reserve",
    quantity: 4,
  });
  expect((await row("stock_lots", f.lot.id)).reserved).toBe(4);
  await action(
    request,
    "stock",
    { lot_id: f.lot.id, kind: "consume", quantity: 17 },
    409,
  );
  await action(request, "stock", {
    lot_id: f.lot.id,
    kind: "release",
    quantity: 4,
    reservation_id: reserve.reservation_id,
  });
  const r2 = await action(request, "stock", {
    lot_id: f.lot.id,
    kind: "reserve",
    quantity: 3,
  });
  await action(request, "stock", {
    lot_id: f.lot.id,
    kind: "consume_reserved",
    quantity: 3,
    reservation_id: r2.reservation_id,
  });
  await action(request, "stock", {
    lot_id: f.lot.id,
    kind: "consume",
    quantity: 2,
  });
  await action(request, "stock", {
    lot_id: f.lot.id,
    kind: "transfer",
    quantity: 5,
    destination_id: f.receiving.id,
  });
  await action(request, "stock", {
    lot_id: f.lot.id,
    kind: "discard",
    quantity: 1,
  });
  expect(await row("stock_lots", f.lot.id)).toMatchObject({
    quantity: 9,
    reserved: 0,
  });
  const { data } = await admin()
    .from("stock_lots")
    .select("*")
    .eq("catalog_id", f.catalog.id)
    .eq("location_id", f.receiving.id);
  expect(data![0].quantity).toBe(5);
  await action(request, "stock", {
    lot_id: f.lot.id,
    kind: "receive",
    quantity: 1,
  });
  expect(await row("stock_lots", f.lot.id)).toMatchObject({
    quantity: 10,
    condition: "pending",
    documentation: "pending",
  });
});
test("inventory count rejects stale stock, reconciles once and requires resolution before closure", async ({
  request,
}) => {
  const f = await foundation(request);
  await available(request, f.lot.id, 10);
  const inv = await create(request, "physical_counts", {
    name: f.t,
    location_id: f.location.id,
  });
  const count = await action(request, "inventory_count", {
    count_id: inv.id,
    lot_id: f.lot.id,
    counted: 8,
  });
  await action(request, "inventory_close", { id: inv.id }, 409);
  await action(request, "inventory_reconcile", { id: count.id });
  expect((await row("stock_lots", f.lot.id)).quantity).toBe(8);
  await action(request, "inventory_reconcile", { id: count.id }, 400);
  await action(request, "inventory_close", { id: inv.id });
  expect((await row("physical_counts", inv.id)).status).toBe("closed");
  const next = await create(request, "physical_counts", {
    name: f.t + " changed",
    location_id: f.location.id,
  });
  const stale = await action(request, "inventory_count", {
    count_id: next.id,
    lot_id: f.lot.id,
    counted: 7,
  });
  await action(request, "stock", {
    lot_id: f.lot.id,
    kind: "receive",
    quantity: 1,
  });
  await action(request, "inventory_reconcile", { id: stale.id }, 409);
});
test("serialized part transfers, installs, removes, verifies and rejects stale versions", async ({
  request,
}) => {
  const f = await foundation(request);
  let p = await create(request, "part_instances", {
    catalog_id: f.catalog.id,
    serial_number: f.t,
    location_id: f.location.id,
    condition: "pending",
    documentation: "pending",
  });
  await action(
    request,
    "part_move",
    {
      part_id: p.id,
      version: p.version,
      kind: "install",
      aircraft_id: f.aircraft.id,
    },
    409,
  );
  await action(request, "part_verify", {
    part_id: p.id,
    version: p.version,
    condition: "serviceable",
    documentation: "complete",
  });
  p = await row("part_instances", p.id);
  await action(request, "part_move", {
    part_id: p.id,
    version: p.version,
    kind: "transfer",
    location_id: f.receiving.id,
  });
  p = await row("part_instances", p.id);
  await action(request, "part_move", {
    part_id: p.id,
    version: p.version,
    kind: "install",
    aircraft_id: f.aircraft.id,
    position: "Motor",
  });
  expect(await row("part_instances", p.id)).toMatchObject({
    logistics: "installed",
    location_id: null,
    aircraft_id: f.aircraft.id,
  });
  await action(
    request,
    "part_move",
    {
      part_id: p.id,
      version: p.version,
      kind: "remove",
      location_id: f.location.id,
    },
    409,
  );
  p = await row("part_instances", p.id);
  await action(request, "part_move", {
    part_id: p.id,
    version: p.version,
    kind: "remove",
    location_id: f.location.id,
  });
  p = await row("part_instances", p.id);
  expect(p).toMatchObject({
    logistics: "stored",
    condition: "pending",
    documentation: "pending",
    aircraft_id: null,
  });
  await action(request, "part_move", {
    part_id: p.id,
    version: p.version,
    kind: "unknown",
  });
  expect((await row("part_instances", p.id)).location_id).toBeNull();
});
test("tools enforce single checkout, due date, return location, discrepancies and calibration", async ({
  request,
}) => {
  const f = await foundation(request);
  const tool = await create(request, "tools", {
    name: f.t,
    code: f.t,
    location_id: f.location.id,
    calibration_required: false,
  });
  await action(request, "tool_checkout", {
    tool_id: tool.id,
    destination: "Oficina",
    aircraft_id: f.aircraft.id,
    due_at: "2030-01-01T12:00:00-03:00",
  });
  expect((await row("tools", tool.id)).status).toBe("in_use");
  await action(
    request,
    "tool_checkout",
    { tool_id: tool.id, destination: "Outro" },
    409,
  );
  await action(
    request,
    "tool_condition",
    { tool_id: tool.id, status: "available" },
    409,
  );
  await action(request, "tool_return", {
    tool_id: tool.id,
    location_id: f.receiving.id,
    condition: "damaged",
  });
  expect(await row("tools", tool.id)).toMatchObject({
    status: "damaged",
    location_id: f.receiving.id,
  });
  await action(
    request,
    "tool_condition",
    { tool_id: tool.id, status: "available" },
    409,
  );
  const { data: ds } = await admin()
    .from("tool_discrepancies")
    .select("*")
    .eq("tool_id", tool.id);
  const d = ds![0];
  await operate(request, {
    action: "update",
    entity: "tool_discrepancies",
    id: d.id,
    version: d.version,
    data: {
      tool_id: tool.id,
      name: d.name,
      status: "resolved",
      notes: "Ocorrência analisada",
    },
    reason: "Resolver ocorrência",
  });
  await action(request, "tool_condition", {
    tool_id: tool.id,
    status: "available",
  });
  const cal = await create(request, "tools", {
    name: f.t + " calibrated",
    code: f.t + "-CAL",
    location_id: f.location.id,
    calibration_required: true,
  });
  await action(
    request,
    "tool_checkout",
    { tool_id: cal.id, destination: "Oficina" },
    409,
  );
  await action(request, "calibration", {
    tool_id: cal.id,
    performed_at: "2026-01-01",
    due_at: "2099-01-01",
    result: "accepted",
    certificate_reference: "CERT-TEST",
  });
  expect((await row("tools", cal.id)).status).toBe("quarantine");
  await action(request, "tool_condition", {
    tool_id: cal.id,
    status: "available",
  });
  await action(request, "tool_checkout", {
    tool_id: cal.id,
    destination: "Oficina",
  });
  await action(request, "tool_return", {
    tool_id: cal.id,
    location_id: f.location.id,
    condition: "available",
  });
});
test("kit checklist is atomic and incomplete return opens a missing-item discrepancy", async ({
  request,
}) => {
  const f = await foundation(request);
  const kit = await create(request, "tool_kits", {
    name: f.t,
    code: f.t,
    require_check: true,
  });
  const tools = [];
  for (let i = 0; i < 2; i++) {
    const t = await create(request, "tools", {
      name: f.t + i,
      code: f.t + i,
      location_id: f.location.id,
      calibration_required: false,
    });
    tools.push(t);
    await create(request, "tool_kit_items", { kit_id: kit.id, tool_id: t.id });
  }
  await action(
    request,
    "tool_checkout",
    { tool_id: tools[0].id, destination: "Separado" },
    409,
  );
  await action(
    request,
    "kit_checkout",
    { kit_id: kit.id, checked_tool_ids: [tools[0].id], destination: "Oficina" },
    409,
  );
  expect((await row("tools", tools[0].id)).status).toBe("available");
  await action(request, "kit_checkout", {
    kit_id: kit.id,
    checked_tool_ids: tools.map((t) => t.id),
    destination: "Oficina",
  });
  await action(request, "kit_return", {
    kit_id: kit.id,
    checked_tool_ids: [tools[0].id],
    location_id: f.location.id,
  });
  expect((await row("tools", tools[1].id)).status).toBe("missing");
  expect((await row("tools", tools[0].id)).status).toBe("available");
  const k = await request.get("/api/kits/" + kit.id);
  expect(k.status(), await k.text()).toBe(200);
});
test("tasks, OS, comments and aircraft registration preserve operational history", async ({
  request,
}) => {
  const f = await foundation(request);
  const os = await create(request, "work_orders", {
    name: f.t,
    aircraft_id: f.aircraft.id,
    priority: "normal",
  });
  let task = await create(request, "maintenance_tasks", {
    name: f.t,
    work_order_id: os.id,
    aircraft_id: f.aircraft.id,
    priority: "high",
    due_at: "2030-01-01T12:00:00-03:00",
  });
  await create(request, "activity_comments", {
    entity: "maintenance_tasks",
    entity_id: task.id,
    body: "Comentário de verificação",
  });
  await action(
    request,
    "task_status",
    { id: os.id, version: os.version, status: "administratively_complete" },
    409,
    "work_orders",
  );
  for (const status of [
    "in_progress",
    "waiting_part",
    "waiting_tool",
    "waiting_document",
    "waiting_inspection",
    "paused",
    "administratively_complete",
  ]) {
    await action(
      request,
      "task_status",
      { id: task.id, version: task.version, status },
      200,
      "maintenance_tasks",
    );
    task = await row("maintenance_tasks", task.id);
    expect(task.status).toBe(status);
  }
  await action(
    request,
    "task_status",
    { id: os.id, version: os.version, status: "administratively_complete" },
    200,
    "work_orders",
  );
  await action(
    request,
    "task_status",
    { id: task.id, version: task.version, status: "open" },
    200,
    "maintenance_tasks",
  );
  expect((await row("maintenance_tasks", task.id)).closed_at).toBeNull();
  await action(request, "aircraft_registration", {
    id: f.aircraft.id,
    version: f.aircraft.version,
    registration: "PT-" + randomUUID().slice(0, 5).toUpperCase(),
  });
  const { data } = await admin()
    .from("audit_events")
    .select("*")
    .eq("entity", "aircraft")
    .eq("entity_id", f.aircraft.id);
  expect(data!.length).toBeGreaterThanOrEqual(2);
});
test("external shipment dispatch, tracking, partial returns and administrative closure preserve custody", async ({
  request,
}) => {
  const f = await foundation(request);
  await available(request, f.lot.id, 10);
  const s = await create(request, "external_shipments", {
    name: f.t,
    recipient_id: f.org.id,
    purpose: "Reparo",
  });
  await action(request, "shipment_dispatch", { shipment_id: s.id }, 409);
  const item = await action(request, "shipment_add", {
    shipment_id: s.id,
    lot_id: f.lot.id,
    quantity: 4,
  });
  await action(request, "shipment_dispatch", { shipment_id: s.id });
  expect((await row("stock_lots", f.lot.id)).quantity).toBe(6);
  await create(request, "external_tracking_events", {
    shipment_id: s.id,
    name: "Recebido pelo fornecedor",
  });
  await action(request, "shipment_status", {
    shipment_id: s.id,
    status: "received_by_third_party",
  });
  await action(
    request,
    "shipment_status",
    { shipment_id: s.id, status: "administratively_closed" },
    409,
  );
  await action(request, "shipment_return", {
    item_id: item.id,
    quantity: 2,
    location_id: f.receiving.id,
  });
  expect(
    (await row("external_shipment_items", item.id)).returned_quantity,
  ).toBe(2);
  await action(
    request,
    "shipment_return",
    { item_id: item.id, quantity: 3, location_id: f.receiving.id },
    400,
  );
  await action(request, "shipment_return", {
    item_id: item.id,
    quantity: 2,
    location_id: f.receiving.id,
  });
  expect((await row("external_shipments", s.id)).status).toBe(
    "pending_verification",
  );
  await action(request, "shipment_status", {
    shipment_id: s.id,
    status: "administratively_closed",
  });
  const { data } = await admin()
    .from("stock_lots")
    .select("*")
    .eq("catalog_id", f.catalog.id)
    .eq("location_id", f.receiving.id);
  expect(data!.reduce((s, l) => s + l.quantity, 0)).toBe(4);
  expect(
    data!.every(
      (l) => l.condition === "pending" && l.documentation === "pending",
    ),
  ).toBe(true);
});
test("operation confirmation binds contents, session and idempotency key; retry applies once", async ({
  request,
}) => {
  const f = await foundation(request);
  const c = {
    action: "stock",
    data: { lot_id: f.lot.id, kind: "receive", quantity: 2 },
    reason: "Recebimento de teste",
  };
  const p = await confirmed(request, c);
  const bad = await request.post("/api/operations", {
    headers: { origin: "http://localhost:3100" },
    data: { ...p, command: { ...c, data: { ...c.data, quantity: 999 } } },
  });
  expect(bad.status()).toBe(403);
  expect((await row("stock_lots", f.lot.id)).quantity).toBe(0);
  for (let i = 0; i < 2; i++) {
    const r = await request.post("/api/operations", {
      headers: { origin: "http://localhost:3100" },
      data: p,
    });
    expect(r.status(), await r.text()).toBe(200);
  }
  expect((await row("stock_lots", f.lot.id)).quantity).toBe(2);
});
test("CSV/XLSX preview, templates and import execution record duplicates and row errors", async ({
  request,
}) => {
  await login(request);
  for (const category of [
    "locations",
    "organizations",
    "aircraft",
    "part_catalog",
    "tools",
    "stock_lots",
  ]) {
    const r = await request.get("/api/imports/template?category=" + category);
    expect(r.status()).toBe(200);
    expect(await r.text()).toContain(resources[category].fields[0].key);
  }
  const t = tag();
  const csv = "name,code,kind,active\n" + t + "," + t + ",workshop,true";
  const preview = await request.post("/api/imports/preview", {
    headers: { origin: "http://localhost:3100" },
    multipart: {
      file: {
        name: "local.csv",
        mimeType: "text/csv",
        buffer: Buffer.from(csv),
      },
    },
  });
  expect(preview.status()).toBe(200);
  expect((await preview.json()).rows).toHaveLength(1);
  const book = new ExcelJS.Workbook();
  book.addWorksheet("Dados").addRows([
    ["name", "code"],
    [t, t],
  ]);
  const x = await request.post("/api/imports/preview", {
    headers: { origin: "http://localhost:3100" },
    multipart: {
      file: {
        name: "local.xlsx",
        mimeType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        buffer: Buffer.from(await book.xlsx.writeBuffer()),
      },
    },
  });
  expect(x.status(), await x.text()).toBe(200);
  const result = await action(request, "import_rows", {
    category: "locations",
    name: "local.csv",
    mode: "skip_duplicates",
    rows: [
      { name: t, code: t, kind: "workshop", active: true },
      { name: t, code: t, kind: "workshop", active: true },
    ],
  });
  expect(result).toMatchObject({ success_rows: 1, error_rows: 1 });
  expect((await row("import_jobs", result.id)).status).toBe("partial");
});
for (const entity of [
  "stock_lots",
  "stock_movements",
  "physical_count_items",
  "tools",
  "tool_checkouts",
  "tool_calibrations",
  "aircraft",
  "maintenance_tasks",
  "work_orders",
  "external_shipments",
  "audit_events",
  "alerts",
]) {
  test("CSV and PDF export: " + entity, async ({ request }) => {
    await login(request);
    for (const format of ["csv", "pdf"]) {
      const r = await request.get(
        `/api/reports?entity=${entity}&format=${format}`,
      );
      expect(r.status(), format === "csv" ? await r.text() : "PDF error").toBe(
        200,
      );
      expect(r.headers()["content-disposition"]).toContain(`.${format}`);
      if (format === "pdf")
        expect(
          (await PDFDocument.load(await r.body())).getPageCount(),
        ).toBeGreaterThan(0);
    }
  });
}
test("private document upload, version history, signed download, invalid file and link validation", async ({
  request,
}) => {
  const f = await foundation(request);
  const d = await create(request, "documents", {
    name: f.t,
    category: "internal",
    reference_url: "https://example.invalid/manual",
  });
  await create(request, "document_links", {
    document_id: d.id,
    entity: "aircraft",
    entity_id: f.aircraft.id,
  });
  for (let i = 1; i <= 2; i++) {
    const pdf = await PDFDocument.create();
    pdf.addPage();
    const bytes = Buffer.from(await pdf.save());
    const command = {
      action: "document_version",
      data: {
        document_id: d.id,
        sha256: createHash("sha256").update(bytes).digest("hex"),
        mime_type: "application/pdf",
        size_bytes: bytes.length,
      },
      reason: "Versão de teste " + i,
    };
    const payload = await confirmed(request, command);
    const r = await request.post("/api/documents/upload", {
      headers: { origin: "http://localhost:3100" },
      multipart: {
        payload: JSON.stringify(payload),
        file: {
          name: "manual.pdf",
          mimeType: "application/pdf",
          buffer: bytes,
        },
      },
    });
    expect(r.status(), await r.text()).toBe(200);
    const retry = await request.post("/api/documents/upload", {
      headers: { origin: "http://localhost:3100" },
      multipart: {
        payload: JSON.stringify(payload),
        file: {
          name: "manual.pdf",
          mimeType: "application/pdf",
          buffer: bytes,
        },
      },
    });
    expect(retry.status(), await retry.text()).toBe(200);
  }
  const { data: versions } = await admin()
    .from("document_versions")
    .select("*")
    .eq("document_id", d.id)
    .order("revision");
  expect(versions!.map((v) => v.revision)).toEqual([1, 2]);
  const download = await request.get("/api/documents/" + versions![1].id, {
    maxRedirects: 0,
  });
  expect(download.status()).toBe(307);
  const signed = download.headers().location;
  expect(signed).toContain("token=");
  const file = await request.get(signed);
  expect(file.status()).toBe(200);
  expect((await PDFDocument.load(await file.body())).getPageCount()).toBe(1);
  const anon = await request.get(
    process.env.SUPABASE_URL +
      "/storage/v1/object/public/operational-documents/" +
      versions![1].object_path,
  );
  expect(anon.status()).toBeGreaterThanOrEqual(400);
  const bytes = Buffer.from("not a PDF");
  const p = await confirmed(request, {
    action: "document_version",
    data: {
      document_id: d.id,
      sha256: createHash("sha256").update(bytes).digest("hex"),
      mime_type: "application/pdf",
      size_bytes: bytes.length,
    },
    reason: "Arquivo inválido",
  });
  const bad = await request.post("/api/documents/upload", {
    headers: { origin: "http://localhost:3100" },
    multipart: {
      payload: JSON.stringify(p),
      file: { name: "bad.pdf", mimeType: "application/pdf", buffer: bytes },
    },
  });
  expect(bad.status()).toBe(400);
});
test("labels encode authenticated URLs for tools, kits, locations and serialized parts and escape HTML", async ({
  request,
}) => {
  const f = await foundation(request);
  const tool = await create(request, "tools", {
    name: "<script>alert(1)</script>",
    code: f.t,
    location_id: f.location.id,
    calibration_required: false,
  });
  const kit = await create(request, "tool_kits", {
    name: f.t,
    code: f.t,
    require_check: true,
  });
  const part = await create(request, "part_instances", {
    catalog_id: f.catalog.id,
    serial_number: f.t,
    location_id: f.location.id,
    condition: "pending",
    documentation: "pending",
  });
  for (const [entity, id] of [
    ["tools", tool.id],
    ["tool_kits", kit.id],
    ["locations", f.location.id],
    ["part_instances", part.id],
  ]) {
    const r = await request.get(`/api/labels?entity=${entity}&id=${id}`);
    expect(r.status()).toBe(200);
    const html = await r.text();
    expect(html).toContain("data:image/png;base64,");
    expect(html).not.toContain("<script>");
  }
});
test("scheduled alerts deduplicate and can be acknowledged/resolved; email remains disabled", async ({
  request,
}) => {
  const f = await foundation(request);
  await login(request);
  const headers = { authorization: "Bearer " + process.env.CRON_SECRET };
  const r = await request.post("/api/jobs", { headers });
  expect(r.status(), await r.text()).toBe(200);
  expect((await r.json()).email).toBe("disabled");
  const { data } = await admin()
    .from("alerts")
    .select("*")
    .eq("entity_id", f.catalog.id);
  expect(data!.length).toBeGreaterThan(0);
  await request.post("/api/jobs", { headers });
  const { data: again } = await admin()
    .from("alerts")
    .select("*")
    .eq("entity_id", f.catalog.id);
  expect(again!.length).toBe(data!.length);
  await action(request, "alert_status", {
    id: data![0].id,
    status: "acknowledged",
  });
  await action(request, "alert_status", {
    id: data![0].id,
    status: "resolved",
  });
  expect((await row("alerts", data![0].id)).status).toBe("resolved");
});
test("simultaneous API withdrawals serialize and concurrent retry cannot duplicate stock", async ({
  request,
}) => {
  const f = await foundation(request);
  await available(request, f.lot.id, 10);
  const make = (quantity: number) =>
    confirmed(request, {
      action: "stock",
      data: { lot_id: f.lot.id, kind: "consume", quantity },
      reason: "Corrida controlada",
    });
  const [a, b] = await Promise.all([make(8), make(8)]);
  const responses = await Promise.all(
    [a, b].map((data) =>
      request.post("/api/operations", {
        headers: { origin: "http://localhost:3100" },
        data,
      }),
    ),
  );
  expect(responses.map((r) => r.status()).sort()).toEqual([200, 409]);
  expect((await row("stock_lots", f.lot.id)).quantity).toBe(2);
  const p = await confirmed(request, {
    action: "stock",
    data: { lot_id: f.lot.id, kind: "receive", quantity: 1 },
    reason: "Retry concorrente",
  });
  const retries = await Promise.all(
    [1, 2].map(() =>
      request.post("/api/operations", {
        headers: { origin: "http://localhost:3100" },
        data: p,
      }),
    ),
  );
  expect(retries.map((r) => r.status())).toEqual([200, 200]);
  expect((await row("stock_lots", f.lot.id)).quantity).toBe(3);
});
test("session expiry, expired confirmation and cross-session replay are rejected", async ({
  request,
}) => {
  const f = await foundation(request);
  const command = {
    action: "stock",
    data: { lot_id: f.lot.id, kind: "receive", quantity: 1 },
    reason: "Confirmação vencida",
  };
  const p = await confirmed(request, command);
  await admin()
    .from("confirmations")
    .update({ expires_at: "2000-01-01T00:00:00Z" })
    .eq("id", p.confirmation_id);
  let r = await request.post("/api/operations", {
    headers: { origin: "http://localhost:3100" },
    data: p,
  });
  expect(r.status()).toBe(403);
  const other = await confirmed(request, command);
  await login(request, "Maranhão");
  r = await request.post("/api/operations", {
    headers: { origin: "http://localhost:3100" },
    data: other,
  });
  expect(r.status()).toBe(403);
  expect((await row("stock_lots", f.lot.id)).quantity).toBe(0);
});
test("authenticated endpoints reject invalid entity, file, filters, foreign origin and unknown records", async ({
  request,
}) => {
  await login(request);
  for (const path of [
    "/api/options/unknown",
    "/api/options/constructor",
    "/api/options/__proto__",
    "/api/documents/" + randomUUID(),
    "/api/reports?entity=access_sessions",
    "/api/reports?entity=tools&from=bad",
    "/api/reports?entity=tools&page=-1",
    "/api/labels?entity=access_sessions&id=" + randomUUID(),
  ]) {
    const r = await request.get(path);
    expect(r.status(), path).toBeGreaterThanOrEqual(400);
    expect(r.status(), path).toBeLessThan(500);
  }
  for (const path of [
    "/api/confirm",
    "/api/operations",
    "/api/documents/upload",
    "/api/imports/preview",
  ]) {
    const r = await request.post(path, {
      headers: { origin: "https://foreign.example.invalid" },
      data: {},
    });
    expect(r.status(), path).toBe(403);
  }
  const bad = await request.post("/api/imports/preview", {
    headers: { origin: "http://localhost:3100" },
    multipart: {
      file: {
        name: "macro.xlsm",
        mimeType: "application/octet-stream",
        buffer: Buffer.from("bad"),
      },
    },
  });
  expect(bad.status()).toBe(400);
});
test("unknown alert and inventory cannot report a successful mutation", async ({
  request,
}) => {
  await action(
    request,
    "alert_status",
    { id: randomUUID(), status: "resolved" },
    404,
  );
  await action(request, "inventory_close", { id: randomUUID() }, 404);
});
test("invalid inherited action names return a validation error without server failure", async ({
  request,
}) => {
  const mechanic_id = await login(request);
  for (const action of ["constructor", "toString", "__proto__"]) {
    const r = await request.post("/api/confirm", {
      headers: { origin: "http://localhost:3100" },
      data: {
        pin: process.env.TEST_PIN,
        mechanic_id,
        operation_id: randomUUID(),
        command: { action, data: {}, reason: "Ação inválida de teste" },
      },
    });
    expect(r.status(), await r.text()).toBe(400);
  }
});
