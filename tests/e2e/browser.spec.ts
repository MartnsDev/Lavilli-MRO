import { test, expect } from "@playwright/test";
test("login fits viewport, PIN field and theme persist", async ({ page }) => {
  await page.goto("/login");
  await expect(
    page.getByRole("heading", { name: "Acesso à operação" }),
  ).toBeVisible();
  await expect(page.getByLabel("Senha geral", { exact: true })).toHaveAttribute(
    "type",
    "password",
  );
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
});
test("first device flow is accessible", async ({ page }) => {
  await page.goto("/login");
  await page
    .getByRole("button", { name: "Primeiro acesso / recuperação" })
    .click();
  await expect(
    page.getByLabel("Código de recuperação", { exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Nome deste dispositivo")).toBeVisible();
});
