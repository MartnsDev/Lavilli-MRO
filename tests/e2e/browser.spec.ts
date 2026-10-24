import { test, expect } from "@playwright/test";

test("access layout fits desktop and mobile, official logo renders, theme persists", async ({
  page,
  request,
}, testInfo) => {
  await request.get("/api/auth/status");
  await page.goto("/login");
  await expect(
    page.getByRole("heading", { name: "Autorizar este aparelho" }),
  ).toBeVisible();
  await expect(
    page.getByRole("img", { name: "Lavilli Jet", exact: true }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page
        .getByRole("img", { name: "Lavilli Jet", exact: true })
        .evaluate((node) => (node as HTMLImageElement).naturalWidth),
    )
    .toBeGreaterThan(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  const theme = await page.locator("html").getAttribute("data-theme");
  await page
    .getByRole("button", { name: "Alternar tema claro e escuro" })
    .click();
  await expect(page.locator("html")).not.toHaveAttribute(
    "data-theme",
    theme ?? "light",
  );
  const next = await page.locator("html").getAttribute("data-theme");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", next!);
  await page.screenshot({
    path: testInfo.outputPath(`access-${next}.png`),
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Alternar tema claro e escuro" })
    .click();
  await page.screenshot({
    path: testInfo.outputPath("access-light.png"),
    fullPage: true,
  });
});
test("unauthorized visitor sees enrollment, not mechanic identities or a PIN-only login", async ({
  page,
}) => {
  await page.goto("/login");
  await expect(page.locator("form.access-form")).toHaveAttribute(
    "method",
    "post",
  );
  await expect(
    page.getByLabel("Código administrativo temporário"),
  ).toHaveAttribute("type", "password");
  await expect(page.getByLabel("Senha do hangar", { exact: true })).toHaveCount(
    0,
  );
  await expect(
    page.getByRole("button", { name: "Autorizar acesso", exact: true }),
  ).toBeEnabled();
});
