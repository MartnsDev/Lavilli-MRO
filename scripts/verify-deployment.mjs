// HTTPS smoke checks only. Never creates business records, uploads files or captures real data.
import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import {
  deploymentTarget,
  deploymentPassed,
  deploymentPin,
} from "./lib/deployment-check.mjs";

const report = {
  checkedAt: new Date().toISOString(),
  checks: [],
  operationalWritesAttempted: false,
  filesUploaded: false,
  documentBytesRead: false,
  fullFunctionalValidation: false,
};
let browser,
  context,
  stage = "configuration";
async function check(name, action) {
  stage = name;
  await action();
  report.checks.push({ name, passed: true });
}
try {
  if (process.argv.slice(2).some((arg) => arg !== "--smoke-only"))
    throw Error("Unknown option");
  const base = deploymentTarget(
    process.env.DEPLOY_TEST_URL || "https://lavilli-control.vercel.app",
  );
  report.url = base;
  const requireDocuments = !process.argv.includes("--smoke-only");
  report.requireDocuments = requireDocuments;
  const pin = await deploymentPin(process.env);
  browser = await chromium.launch({
    channel: process.env.PLAYWRIGHT_CHANNEL || "chrome",
  });
  for (const [index, actor] of ["César", "Maranhão"].entries()) {
    context = await browser.newContext({
      viewport:
        index === 0
          ? { width: 1366, height: 768 }
          : { width: 390, height: 844 },
    });
    // Restrict all navigation/resources so the PIN cannot be sent to an unexpected host.
    await context.route("**/*", (route) =>
      new URL(route.request().url()).origin === base
        ? route.continue()
        : route.abort(),
    );
    const page = await context.newPage();
    let errors = 0;
    page.on("pageerror", () => errors++);
    await check(actor + ":login-page-and-headers", async () => {
      const response = await page.goto(base + "/login");
      assert.equal(response.status(), 200);
      assert.equal(new URL(page.url()).origin, base);
      const headers = response.headers();
      assert.match(headers["cache-control"] || "", /no-store/);
      assert.match(headers["content-security-policy"] || "", /'nonce-/);
      assert.ok(headers["strict-transport-security"]);
      await page
        .getByRole("heading", { name: "Bem-vindo à Lavilli" })
        .waitFor();
      assert.equal(await page.getByLabel(/Código administrativo/).count(), 0);
      assert.equal(
        (await context.request.get(base + "/api/health")).status(),
        401,
      );
    });
    await check(actor + ":login-and-dashboard", async () => {
      await page
        .getByLabel("Quem está acessando?")
        .selectOption({ label: actor });
      await page.getByLabel("Senha do hangar", { exact: true }).fill(pin);
      await page
        .getByRole("button", { name: "Entrar no hangar", exact: true })
        .click();
      await page.waitForURL(base + "/dashboard", { timeout: 60000 });
      await page
        .getByRole("heading", { name: "Visão geral do hangar" })
        .waitFor();
      const health = await context.request.get(base + "/api/health");
      assert.equal(health.status(), 200);
      assert.equal((await health.json()).database, "ok");
      const cookies = (await context.cookies(base)).filter((c) =>
        c.name.startsWith("__Host-lavilli_"),
      );
      assert.ok(cookies.some((c) => c.name.endsWith("session")));
      assert.ok(cookies.some((c) => c.name.endsWith("device")));
      for (const cookie of cookies) {
        assert.ok(cookie.httpOnly && cookie.secure);
        assert.equal(cookie.sameSite, "Strict");
        assert.equal(cookie.path, "/");
      }
    });
    if (index === 0) {
      stage = "document-upload-capability";
      // Invalid input deliberately reaches only the availability/parser checks, never Storage.
      const upload = await context.request.post(
        base + "/api/documents/upload",
        {
          headers: { origin: base, "content-type": "application/json" },
          data: {},
        },
      );
      const status = upload.status();
      assert.ok([400, 503].includes(status));
      report.checks.push({ name: stage, passed: status === 400, status });
      report.documentUploadCapability = status === 400;
    } else {
      await check("mobile-menu", async () => {
        await page.getByRole("button", { name: "Abrir menu" }).click();
        await page.getByRole("dialog", { name: "Menu operacional" }).waitFor();
        await page.keyboard.press("Escape");
      });
    }
    await check(actor + ":logout-and-anonymous-denial", async () => {
      await page.getByRole("button", { name: "Sair", exact: true }).click();
      await page.waitForURL(base + "/login");
      assert.equal(
        (await context.request.get(base + "/api/health")).status(),
        401,
      );
      assert.equal(errors, 0);
    });
    await context.close();
    context = undefined;
  }
  report.passed = deploymentPassed(report.checks, requireDocuments);
  if (!report.passed)
    report.blocker = "Document upload is unavailable on this deployment";
} catch {
  // Never print Playwright errors: their call logs can contain typed secrets or real DOM data.
  report.checks.push({ name: stage, passed: false });
  report.passed = false;
  report.blocker =
    stage === "configuration"
      ? "Check the authorized URL, private PIN source and browser installation"
      : "Deployment check failed at the reported stage; no private error data was exported";
} finally {
  if (context && report.url) {
    await context.request
      .post(report.url + "/api/auth/logout", {
        headers: { origin: report.url },
      })
      .catch(() => {});
  }
  await browser?.close();
}
const output =
  process.env.DEPLOY_TEST_REPORT || "test-results/deploy/result.json";
await mkdir(dirname(output), { recursive: true });
await writeFile(output, JSON.stringify(report, null, 2) + "\n", {
  mode: 0o600,
});
console.log(JSON.stringify(report, null, 2));
process.exitCode = report.passed ? 0 : 1;
