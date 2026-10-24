import { test, expect } from "@playwright/test";
import {
  initialAccessMode,
  type AccessState,
} from "../../src/lib/domain/access";

test("access layout fits desktop and mobile, official logo renders, theme persists", async ({
  page,
  request,
}, testInfo) => {
  const state = (await (
    await request.get("/api/auth/status")
  ).json()) as AccessState;
  await page.goto("/login");
  const expected = {
    login: "Bom ter você por aqui",
    initialize: "Defina a senha do hangar",
    bootstrap: "Autorize este dispositivo",
    email: "Confira seu e-mail",
    unavailable: "Preparação do acesso",
  }[initialAccessMode(state)];
  await expect(page.getByRole("heading", { name: expected })).toBeVisible();
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
test("unconfigured PIN has an explicit owner initialization flow instead of a broken login", async ({
  page,
  request,
}) => {
  const state = (await (
    await request.get("/api/auth/status")
  ).json()) as AccessState;
  await page.goto("/login");
  if (!state.passwordConfigured && state.localSetupEnabled) {
    await expect(
      page.getByLabel("Código de primeiro acesso", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByLabel("Defina a senha geral", { exact: true }),
    ).toHaveAttribute("type", "password");
    await expect(
      page.getByLabel("Repita a senha geral", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Definir senha e continuar" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Entrar no hangar" }),
    ).toHaveCount(0);
    await page.getByText("Onde encontro esse código?", { exact: true }).click();
    await expect(
      page.getByText(".local-secrets/device-bootstrap.txt", { exact: true }),
    ).toBeVisible();
  } else if (state.passwordConfigured && !state.deviceAuthorized) {
    await expect(page.getByLabel("Nome deste dispositivo")).toBeVisible();
    await expect(
      page.getByLabel("Código de recuperação", { exact: true }),
    ).toBeVisible();
  } else if (state.passwordConfigured) {
    await expect(page.getByLabel("Senha geral", { exact: true })).toBeVisible();
  } else {
    await expect(
      page.getByText("A senha geral ainda não foi definida"),
    ).toBeVisible();
  }
  if (!state.emailEnabled)
    await expect(
      page.getByText("Receber um código por e-mail", { exact: true }),
    ).toHaveCount(0);
});
