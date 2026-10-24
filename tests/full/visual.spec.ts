import { test, expect } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { login, foundation, create, isolated } from "./helpers";
import { resources } from "../../src/lib/domain/resources";
const widths = [
  320, 360, 375, 390, 430, 768, 820, 1024, 1280, 1366, 1440, 1920,
];
test("all routes in both themes across twelve widths, keyboard and modal geometry", async ({
  page,
}, info) => {
  test.setTimeout(600000);
  isolated();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await login(page.request);
  const f = await foundation(page.request);
  const tool = await create(page.request, "tools", {
    name: "DEMO • Torquímetro de ensaio",
    code: f.t + "-VIS",
    location_id: f.location.id,
    calibration_required: false,
  });
  const recordRoutes = Object.keys(resources).map((k) => "/records/" + k);
  const routes = [
    "/dashboard",
    "/locations",
    "/search?q=DEMO",
    "/scan",
    "/imports",
    "/reports",
    "/settings",
    "/help",
    ...recordRoutes,
    "/records/locations/" + f.location.id,
    "/records/tools/" + tool.id,
    "/records/aircraft/" + f.aircraft.id,
    "/records/part_catalog/" + f.catalog.id,
  ];
  const phase = process.env.VISUAL_PHASE || "after",
    folder = "test-results/visual/" + phase;
  await mkdir(folder, { recursive: true });
  const matrix = [];
  const errors: string[] = [];
  const network: { url: string; status?: number; failure?: string }[] = [];
  page.on("response", (r) => {
    if (r.status() >= 500) {
      network.push({ url: r.url(), status: r.status() });
      errors.push("HTTP " + r.status() + " " + new URL(r.url()).pathname);
    }
  });
  page.on("requestfailed", (r) => {
    const failure = r.failure()?.errorText || "unknown";
    network.push({ url: r.url(), failure });
    if (!/ABORTED|NS_BINDING_ABORTED/i.test(failure))
      errors.push("network " + failure);
  });
  page.on("console", (m) => {
    if (m.type() === "error") errors.push("console " + m.text().slice(0, 250));
  });
  page.on("pageerror", (e) => errors.push(e.message));
  for (const theme of ["light", "dark"]) {
    await page.addInitScript(
      (t) => localStorage.setItem("lavilli-theme", t),
      theme,
    );
    for (const [index, route] of routes.entries()) {
      const r = await page.goto(route);
      expect(r?.status(), route).toBe(200);
      await expect(page.locator("main h1")).toBeVisible();
      await page.evaluate(async () => {
        await document.fonts.ready;
      });
      for (const width of widths) {
        await page.setViewportSize({
          width,
          height: width === 1366 ? 768 : 900,
        });
        await page.evaluate(
          () =>
            new Promise<void>((resolve) =>
              requestAnimationFrame(() =>
                requestAnimationFrame(() => resolve()),
              ),
            ),
        );
        if (phase !== "before")
          await expect
            .poll(
              async () =>
                page.evaluate(
                  () =>
                    document.documentElement.scrollWidth <=
                    document.documentElement.clientWidth,
                ),
              { timeout: 1500 },
            )
            .toBe(true);
        const dimensions = await page.evaluate(() => ({
          scroll: document.documentElement.scrollWidth,
          client: document.documentElement.clientWidth,
        }));
        matrix.push({ route, theme, width, ...dimensions });
        if (phase !== "before")
          expect
            .soft(dimensions.scroll, `${route} ${theme} ${width}`)
            .toBeLessThanOrEqual(dimensions.client);
        if (
          [320, 768, 1366].includes(width) &&
          [0, 1, 4, 5, 6, 8, 18, routes.length - 3].includes(index)
        )
          await page.screenshot({
            path: `${folder}/${index}-${theme}-${width}.png`,
            fullPage: true,
          });
      }
    }
  }
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.evaluate(() => {
    document.documentElement.style.zoom = "2";
  });
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
  await page.evaluate(() => {
    document.documentElement.style.zoom = "";
  });
  await writeFile(
    `${folder}/matrix.json`,
    JSON.stringify({ matrix, errors, network }, null, 2),
  );
  await writeFile(
    `${folder}/matrix.json`,
    JSON.stringify({ matrix, errors, network }, null, 2),
  );
  expect(errors).toEqual([]);
  await info.attach("responsive-matrix", {
    path: `${folder}/matrix.json`,
    contentType: "application/json",
  });
});
