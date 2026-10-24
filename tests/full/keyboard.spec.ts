import { test, expect } from "@playwright/test";
import { login, isolated } from "./helpers";
test("mobile drawer, modal keyboard focus and 200 percent reflow", async ({
  page,
}) => {
  isolated();
  await login(page.request);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("/records/locations");
  const menu = page.locator(".mobile-menu");
  await page.bringToFront();
  await menu.click();
  await expect(menu).toHaveAttribute("aria-expanded", "true");
  const insideDrawer = () =>
    page.evaluate(() =>
      Boolean(
        document
          .querySelector(".mobile-drawer")
          ?.contains(document.activeElement),
      ),
    );
  await expect.poll(insideDrawer).toBe(true);
  for (let i = 0; i < 22; i++) await page.keyboard.press("Tab");
  await expect.poll(insideDrawer).toBe(true);
  await page.keyboard.press("Shift+Tab");
  await expect.poll(insideDrawer).toBe(true);
  await page.keyboard.press("Escape");
  await expect(menu).toBeFocused();
  await expect(menu).toHaveAttribute("aria-expanded", "false");
  await page.getByRole("button", { name: "Novo cadastro" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  const box = await dialog.boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(320);
  expect(box!.height).toBeLessThanOrEqual(640);
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(
    page.getByRole("button", { name: "Novo cadastro" }),
  ).toBeFocused();
  await page.setViewportSize({ width: 768, height: 430 });
  await page.goto("/dashboard");
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
  // 1366x768 at 200% browser zoom exposes approximately 683x384 CSS pixels.
  // Validate reflow in CSS pixels; native browser zoom remains a device smoke check.
  await page.setViewportSize({ width: 683, height: 384 });
  await expect
    .poll(async () =>
      page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
      ),
    )
    .toBe(true);
});

test("visible automatic refresh does not keep an unattended browser signed in", async ({
  page,
}) => {
  isolated();
  await login(page.request);
  await page.clock.install();
  await page.goto("/dashboard");
  const theme = await page.locator("html").getAttribute("data-theme");
  await page
    .getByRole("button", { name: "Alternar tema claro e escuro" })
    .click();
  await expect(page.locator("html")).not.toHaveAttribute(
    "data-theme",
    theme || "light",
  );
  await page.clock.fastForward(31 * 60000);
  await expect(page).toHaveURL(/\/login$/);
  expect(
    (await page.context().cookies()).some((c) =>
      c.name.endsWith("lavilli_session"),
    ),
  ).toBe(false);
  expect((await page.request.get("/api/options/tools")).status()).toBe(401);
});
