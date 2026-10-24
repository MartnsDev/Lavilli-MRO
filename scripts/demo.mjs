// Local demonstration only: never imports .env.local or production credentials.
import { execFileSync, spawn } from "node:child_process";
import { randomBytes, createHash, randomUUID, randomInt } from "node:crypto";
import { mkdir, writeFile, readFile, cp, rm } from "node:fs/promises";
import { hash } from "@node-rs/argon2";
import { createClient } from "@supabase/supabase-js";
import WebSocket from "ws";
import { createServer } from "node:net";
import { PDFDocument } from "pdf-lib";
import { encodePinHash } from "../src/lib/domain/pin-hash.mjs";
const status = JSON.parse(
  execFileSync(
    "npx",
    [
      "--yes",
      "supabase@2.122.0",
      "status",
      "--workdir",
      ".demo-local",
      "--output",
      "json",
    ],
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
  ),
);
if (!["localhost", "127.0.0.1"].includes(new URL(status.API_URL).hostname))
  throw Error("Somente Supabase local");
// Keep the owner's configured demo PIN across restarts; never commit its value.
await mkdir(".local-secrets", { recursive: true, mode: 0o700 });
const pinFile = ".local-secrets/demo-pin.txt";
let pin;
try {
  pin = (await readFile(pinFile, "utf8")).trim();
} catch (error) {
  if (error.code !== "ENOENT") throw error;
  pin = String(randomInt(1000, 10000));
  await writeFile(pinFile, pin + "\n", { mode: 0o600, flag: "wx" });
}
if (!/^\d{4}$/.test(pin))
  throw Error(
    "Configure quatro dígitos no arquivo privado de PIN da demonstração.",
  );
const env = {
  ...process.env,
  APP_MODE: "demo",
  APP_URL: "http://localhost:3200",
  SUPABASE_URL: status.API_URL,
  SUPABASE_SERVICE_ROLE_KEY: status.SERVICE_ROLE_KEY,
  PIN_HASH: encodePinHash(await hash(pin, { algorithm: 2 })),
  SESSION_SECRET: randomBytes(32).toString("hex"),
  CRON_SECRET: randomBytes(32).toString("hex"),
  EMAIL_MODE: "disabled",
  RESEND_API_KEY: "",
  NEXT_BUILD_DIR: ".next-demo",
};
const db = createClient(status.API_URL, status.SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
  realtime: { transport: WebSocket },
});
await new Promise((resolve, reject) => {
  const check = createServer();
  check.once("error", () =>
    reject(
      Error("A demonstração já está aberta ou a porta 3200 está ocupada."),
    ),
  );
  check.listen(3200, "127.0.0.1", () => check.close(resolve));
});
// Keep the demo independent from subsequent verification builds.
await rm(".next-demo", { recursive: true, force: true });
await cp(".next-verification", ".next-demo", { recursive: true });
const server = spawn(
  "node",
  [
    "node_modules/next/dist/bin/next",
    "start",
    "--hostname",
    "127.0.0.1",
    "--port",
    "3200",
  ],
  { env, stdio: ["ignore", "pipe", "pipe"] },
);
let ready = false;
server.stdout.on("data", (b) => {
  if (b.toString().includes("Ready in")) ready = true;
});
server.stderr.on("data", () => {});
const shutdown = () => server.kill("SIGTERM");
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
try {
  for (let n = 0; n < 120 && !ready; n++) {
    if (server.exitCode !== null)
      throw Error("Servidor não iniciou; confira porta 3200/build.");
    await new Promise((r) => setTimeout(r, 500));
  }
  if (!ready) throw Error("Servidor não iniciou");
  const cookies = new Map();
  async function post(path, data) {
    const r = await fetch(env.APP_URL + path, {
      method: "POST",
      headers: {
        origin: env.APP_URL,
        ...(data instanceof FormData
          ? {}
          : { "content-type": "application/json" }),
        cookie: [...cookies].map(([k, v]) => k + "=" + v).join("; "),
      },
      body: data instanceof FormData ? data : JSON.stringify(data),
    });
    for (const value of r.headers.getSetCookie()) {
      const first = value.split(";")[0],
        i = first.indexOf("=");
      cookies.set(first.slice(0, i), first.slice(i + 1));
    }
    const body = await r.json();
    if (!r.ok)
      throw Error(
        "Demo: " +
          path +
          " retornou " +
          r.status +
          ": " +
          String(body.error || "Falha"),
      );
    return body;
  }
  async function grant(purpose) {
    const code = randomBytes(32).toString("base64url");
    const { error } = await db.rpc("issue_device_grant", {
      p_hash: createHash("sha256").update(code).digest("hex"),
      p_purpose: purpose,
    });
    if (error) throw Error("Migration de segurança local ausente");
    return code;
  }
  await post("/api/auth/enroll", { code: await grant("enroll") });
  const { data: mechanics, error } = await db
    .from("mechanics")
    .select("id,name")
    .eq("active", true);
  if (error || !mechanics?.length) throw Error("Mecânicos locais ausentes");
  const actor = mechanics.find((m) => m.name === "César") || mechanics[0];
  await post("/api/auth/login", { pin, mechanic_id: actor.id });
  async function confirmed(command) {
    const operation_id = randomUUID();
    const c = await post("/api/confirm", {
      pin,
      mechanic_id: actor.id,
      command,
      operation_id,
    });
    return { command, operation_id, confirmation_id: c.confirmation_id };
  }
  async function operate(action, data, entity) {
    const command = {
      action,
      ...(entity ? { entity } : {}),
      data,
      reason: "Demonstração fictícia isolada",
    };
    return (await post("/api/operations", await confirmed(command))).data;
  }
  const create = (entity, data) => operate("create", data, entity);
  let reusable;
  if (!process.argv.includes("--new-data")) {
    try {
      const previous = JSON.parse(
        await readFile(".local-secrets/demo-access.txt", "utf8"),
      );
      if (/^DEMO-[a-f0-9]{6}$/.test(previous.label)) {
        const { data, error } = await db
          .from("locations")
          .select("id")
          .eq("code", previous.label)
          .maybeSingle();
        if (!error && data) reusable = previous.label;
      }
    } catch {
      /* A fresh isolated demo creates its first dataset. */
    }
  }
  const label = reusable || "DEMO-" + randomUUID().slice(0, 6),
    suffix = label.slice(5);
  if (!reusable) {
    const location = await create("locations", {
      name: label + " • Oficina fictícia",
      code: label,
      kind: "workshop",
      active: true,
    });
    const catalog = await create("part_catalog", {
      name: label + " • Filtro de demonstração",
      part_number: label + "-F",
      unit: "un",
      minimum_stock: 25,
    });
    const aircraft = await create("aircraft", {
      registration: "DM-" + suffix.slice(0, 5).toUpperCase(),
      model: label + " • Aeronave fictícia",
      status: "active",
    });
    const lot = await create("stock_lots", {
      catalog_id: catalog.id,
      code: label + "-L",
      location_id: location.id,
      condition: "pending",
      documentation: "pending",
    });
    const tool = await create("tools", {
      name: label + " • Torquímetro fictício",
      code: label + "-T",
      location_id: location.id,
      calibration_required: true,
    });
    await operate("stock", { lot_id: lot.id, kind: "receive", quantity: 20 });
    await operate("stock", {
      lot_id: lot.id,
      kind: "verify",
      quantity: 1,
      condition: "serviceable",
      documentation: "complete",
    });
    await operate("stock", { lot_id: lot.id, kind: "reserve", quantity: 3 });
    await operate("calibration", {
      tool_id: tool.id,
      performed_at: new Date().toISOString().slice(0, 10),
      due_at: "2099-01-01",
      result: "accepted",
      certificate_reference: label + "-CERT-FICTICIO",
    });
    await operate("tool_condition", { tool_id: tool.id, status: "available" });
    const organization = await create("organizations", {
      name: label + " • Oficina externa fictícia",
      kind: "third_party",
    });
    const receiving = await create("locations", {
      name: label + " • Recebimento",
      code: label + "-R",
      kind: "receiving",
      active: true,
    });
    await create("part_instances", {
      catalog_id: catalog.id,
      serial_number: label + "-SERIE",
      location_id: location.id,
      condition: "pending",
      documentation: "pending",
    });
    const shipment = await create("external_shipments", {
      name: label + " • Remessa fictícia",
      recipient_id: organization.id,
      purpose: "Ensaio de retorno parcial",
    });
    const item = await operate("shipment_add", {
      shipment_id: shipment.id,
      lot_id: lot.id,
      quantity: 4,
    });
    await operate("shipment_dispatch", { shipment_id: shipment.id });
    await operate("shipment_return", {
      item_id: item.id,
      quantity: 2,
      location_id: receiving.id,
    });
    const document = await create("documents", {
      name: label + " • PDF fictício",
      category: "internal",
    });
    await create("document_links", {
      document_id: document.id,
      entity: "aircraft",
      entity_id: aircraft.id,
    });
    const pdf = await PDFDocument.create();
    pdf.addPage().drawText("DEMO - FICTICIO - NAO E DOCUMENTO TECNICO");
    const bytes = Buffer.from(await pdf.save());
    const payload = await confirmed({
      action: "document_version",
      data: {
        document_id: document.id,
        sha256: createHash("sha256").update(bytes).digest("hex"),
        mime_type: "application/pdf",
        size_bytes: bytes.length,
      },
      reason: "PDF fictício em quarentena",
    });
    const upload = new FormData();
    upload.set("payload", JSON.stringify(payload));
    upload.set(
      "file",
      new Blob([bytes], { type: "application/pdf" }),
      "DEMO.pdf",
    );
    await post("/api/documents/upload", upload);
    const order = await create("work_orders", {
      name: label + " • Inspeção fictícia",
      aircraft_id: aircraft.id,
      priority: "normal",
    });
    await create("maintenance_tasks", {
      name: label + " • Conferir filtro",
      work_order_id: order.id,
      aircraft_id: aircraft.id,
      priority: "high",
      due_at: new Date(Date.now() - 86400000).toISOString(),
    });
    const alerts = await fetch(env.APP_URL + "/api/jobs", {
      method: "POST",
      headers: { authorization: "Bearer " + env.CRON_SECRET },
    });
    if (!alerts.ok && alerts.status !== 409)
      throw Error("Alertas internos de demo falharam");
  }
  await mkdir(".local-secrets", { recursive: true, mode: 0o700 });
  await writeFile(
    ".local-secrets/demo-access.txt",
    JSON.stringify(
      {
        url: env.APP_URL,
        pin,
        enrollmentCode: await grant("enroll"),
        adminCode: await grant("admin"),
        codeExpiresMinutes: 15,
        label,
      },
      null,
      2,
    ),
    { mode: 0o600 },
  );
  console.log(
    "Demo local em http://localhost:3200. Credenciais temporárias: .local-secrets/demo-access.txt (privado). Todos os dados são fictícios; e-mail desativado. Ctrl+C encerra o servidor.",
  );
  await new Promise((resolve) => server.once("exit", resolve));
} catch (error) {
  shutdown();
  console.error(error.message);
  process.exitCode = 1;
}
