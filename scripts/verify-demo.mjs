// Verify the local shared-PIN flow; no enrollment or administrative codes.
import { chromium, expect } from "@playwright/test";
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";
import WebSocket from "ws";
const file = ".local-secrets/demo-access.txt",
  access = JSON.parse(fs.readFileSync(file, "utf8"));
if (access.url !== "http://localhost:3200")
  throw Error("Somente demonstração local autorizada");
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
const endpoint = new URL(status.API_URL);
if (
  !["localhost", "127.0.0.1"].includes(endpoint.hostname) ||
  endpoint.port !== "54331"
)
  throw Error("Backend DEMO dedicado obrigatório");
const db = createClient(status.API_URL, status.SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
  realtime: { transport: WebSocket },
});
const browser = await chromium.launch({
  channel: process.env.PLAYWRIGHT_CHANNEL || "chrome",
});
try {
  const page = await browser.newPage({
      viewport: { width: 1366, height: 768 },
    }),
    errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(access.url + "/login");
  await expect(page.locator("form.access-form")).toHaveAttribute(
    "method",
    "post",
  );
  await expect(
    page.getByRole("heading", { name: "Bem-vindo à Lavilli" }),
  ).toBeVisible();
  await expect(page.getByLabel(/Código administrativo/)).toHaveCount(0);
  await page
    .getByLabel("Quem está acessando?")
    .selectOption({ label: "César" });
  await expect(page.locator("form.access-form")).toHaveAttribute(
    "method",
    "post",
  );
  await page.getByLabel("Senha do hangar", { exact: true }).fill(access.pin);
  await page
    .getByRole("button", { name: "Entrar no hangar", exact: true })
    .click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.locator("main h1")).toBeVisible();
  fs.mkdirSync("test-results/demo", { recursive: true });
  await page.screenshot({
    path: "test-results/demo/dashboard-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "test-results/demo/dashboard-mobile.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Abrir menu" }).click();
  await expect(
    page.getByRole("dialog", { name: "Menu operacional" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Sair", exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page
    .getByLabel("Quem está acessando?")
    .selectOption({ label: "Maranhão" });
  await page.getByLabel("Senha do hangar", { exact: true }).fill(access.pin);
  await page
    .getByRole("button", { name: "Entrar no hangar", exact: true })
    .click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.screenshot({
    path: "test-results/demo/dashboard-maranhao-mobile.png",
    fullPage: true,
  });
  const doc = await db
    .from("documents")
    .select("id")
    .eq("name", access.label + " • PDF fictício")
    .single();
  expect(doc.error).toBeNull();
  await page.goto(access.url + "/records/documents/" + doc.data.id);
  await expect(
    page.getByText("Aguardando verificação de segurança", { exact: true }),
  ).toBeVisible();
  await expect(
    page.locator('.document-versions a[href^="/api/documents/"]'),
  ).toHaveCount(0);
  await page.screenshot({
    path: "test-results/demo/document-pending-mobile.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
  const { count: testRows, error: te } = await db
    .from("locations")
    .select("*", { count: "exact", head: true })
    .like("name", "TEST-%");
  const { count: alerts, error: ae } = await db
    .from("alerts")
    .select("*", { count: "exact", head: true });
  const { count: pending, error: pe } = await db
    .from("document_versions")
    .select("*", { count: "exact", head: true })
    .eq("scan_status", "pending");
  expect([te, ae, pe]).toEqual([null, null, null]);
  expect(testRows).toBe(0);
  expect(alerts).toBeGreaterThan(0);
  expect(pending).toBeGreaterThan(0);
  fs.writeFileSync(file, JSON.stringify(access, null, 2), { mode: 0o600 });
  console.log(
    JSON.stringify({
      demoLoginUI: "PASS",
      mechanics: ["César", "Maranhão"],
      credentialFormMethod: "POST",
      desktopMobile: "PASS",
      pendingDocumentUI: "PASS",
      pageErrors: errors.length,
      testFixturesInDemo: testRows,
      internalAlerts: alerts,
      pendingDocuments: pending,
    }),
  );
} finally {
  await browser.close();
}
