import { test, expect, type Page, type Locator } from "@playwright/test";
import { resources, type Field } from "../../src/lib/domain/resources";
import { isolated, login, foundation, create, tag, admin } from "./helpers";
let f: Awaited<ReturnType<typeof foundation>>;
let auxToolId: string,
  toolId: string,
  kitId: string,
  taskId: string,
  shipmentId: string,
  documentId: string;
test.beforeAll(async ({ request }) => {
  isolated();
  f = await foundation(request);
  toolId = (
    await create(request, "tools", {
      name: f.t + " tool",
      code: f.t + "-T",
      location_id: f.location.id,
      calibration_required: false,
    })
  ).id;
  auxToolId = (
    await create(request, "tools", {
      name: f.t + " auxiliary",
      code: f.t + "-AUX",
      location_id: f.location.id,
      calibration_required: false,
    })
  ).id;
  kitId = (
    await create(request, "tool_kits", {
      name: f.t + " kit",
      code: f.t + "-K",
      require_check: true,
    })
  ).id;
  taskId = (
    await create(request, "maintenance_tasks", {
      name: f.t + " task",
      priority: "normal",
    })
  ).id;
  shipmentId = (
    await create(request, "external_shipments", {
      name: f.t + " shipment",
      recipient_id: f.org.id,
      purpose: "Reparo",
    })
  ).id;
  documentId = (
    await create(request, "documents", {
      name: f.t + " doc",
      category: "internal",
    })
  ).id;
});
test.beforeEach(async ({ page }) => {
  await login(page.request);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/dashboard");
  await expect(
    page.getByRole("heading", { name: "Visão geral do hangar" }),
  ).toBeVisible();
  // Track all uncaught browser errors, including those emitted during navigation.
  (page as Page & { _verificationErrors?: string[] })._verificationErrors =
    errors;
});
test.afterEach(async ({ page }) => {
  expect(
    (page as Page & { _verificationErrors?: string[] })._verificationErrors,
  ).toEqual([]);
});
async function confirm(dialog: Locator) {
  await dialog
    .getByLabel("Motivo / resumo da alteração")
    .fill("Validação profissional automatizada");
  await dialog.getByRole("button", { name: "Revisar e confirmar" }).click();
  await dialog
    .locator('select[name="mechanic_id"]')
    .selectOption({ label: "César" });
  await dialog.getByLabel("Redigite a senha geral").fill(process.env.TEST_PIN!);
  const reply = dialog
    .page()
    .waitForResponse(
      (r) =>
        /\/api\/(operations|documents\/upload)$/.test(
          new URL(r.url()).pathname,
        ) && r.request().method() === "POST",
    );
  const submit = dialog.getByRole("button", { name: "Confirmar e registrar" });
  if (test.info().project.name === "mobile") await submit.tap();
  else await submit.click();
  const response = await reply;
  expect(response.status(), await response.text()).toBe(200);
  await expect(dialog).toBeHidden();
  return (await response.json()).data;
}
async function fill(dialog: Locator, field: Field, value: unknown) {
  const control = dialog.locator(`[name="${field.key}"]`);
  if (field.type === "boolean") await control.setChecked(Boolean(value));
  else if (field.type.startsWith("ref:") || field.type.startsWith("select:"))
    await control.selectOption(String(value));
  else await control.fill(String(value));
}
function values(entity: string) {
  const t = tag();
  const refs: Record<string, string> = {
    locations: f.location.id,
    organizations: f.org.id,
    aircraft: f.aircraft.id,
    part_catalog: f.catalog.id,
    tools: auxToolId,
    tool_kits: kitId,
    maintenance_tasks: taskId,
    external_shipments: shipmentId,
    documents: documentId,
  };
  const data: Record<string, unknown> = {};
  for (const field of resources[entity].fields) {
    if (!field.required) continue;
    data[field.key] = field.type.startsWith("ref:")
      ? refs[field.type.slice(4)]
      : field.type.startsWith("select:")
        ? field.type.slice(7).split(",")[0]
        : field.type === "boolean"
          ? false
          : field.type === "number"
            ? 1
            : field.type === "uuid"
              ? taskId
              : field.type === "email"
                ? t.toLowerCase() + "@example.invalid"
                : t;
  }
  if (entity === "tool_inspections") data.tool_id = toolId;
  if (entity === "aircraft")
    data.registration = "PT-" + t.slice(-5).toUpperCase();
  if (entity === "activity_comments") {
    data.entity = "maintenance_tasks";
    data.entity_id = taskId;
  }
  if (entity === "document_links") {
    data.entity = "tools";
    data.entity_id = toolId;
  }
  if (entity === "app_settings") {
    data.name = "company_name";
    data.value = t;
  }
  return data;
}
const creatable = Object.entries(resources)
  .filter(([key, v]) => v.fields.length && key !== "mechanics")
  .map(([k]) => k);
for (const entity of creatable) {
  test(
    "create " + entity + " through visible form and open audited record",
    async ({ page }) => {
      await page.goto("/records/" + entity);

      const existing =
        entity === "app_settings"
          ? await admin()
              .from("app_settings")
              .select("id")
              .eq("name", "company_name")
              .maybeSingle()
          : null;
      if (existing?.data) {
        await page.goto("/records/app_settings/" + existing.data.id);
        await page.getByRole("button", { name: "Editar cadastro" }).click();
      } else await page.getByRole("button", { name: "Novo cadastro" }).click();
      const dialog = page.getByRole("dialog");
      const data = values(entity);
      for (const field of resources[entity].fields) {
        if (data[field.key] !== undefined)
          await fill(dialog, field, data[field.key]);
      }
      const saved = await confirm(dialog);
      if (!(entity === "app_settings" && existing?.data))
        await page
          .locator(`a.record-link[href="/records/${entity}/${saved.id}"]`)
          .click();
      await expect(
        page.getByRole("heading", { name: "Dados do registro" }),
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: "Histórico cronológico" }),
      ).toBeVisible();
      await expect(page.locator(".timeline")).toContainText(
        "Validação profissional automatizada",
      );
    },
  );
}
test("all sidebar links and secondary modules render without runtime errors on desktop and mobile", async ({
  page,
}, info) => {
  const menu = page.getByRole("button", { name: "Abrir menu" });
  if (info.project.name === "mobile") await menu.click();
  const hrefs = await page
    .getByRole("navigation", { name: "Navegação principal" })
    .locator("a")
    .evaluateAll((nodes) =>
      nodes.map((n) => (n as HTMLAnchorElement).getAttribute("href")!),
    );
  for (const href of [...hrefs, "/locations", "/search?q=TEST"]) {
    const r = await page.goto(href);
    expect(r?.status(), href).toBe(200);
    await expect(page.locator("main h1")).toBeVisible();
    expect(await page.locator("body").innerText()).not.toContain(
      "Algo deu errado",
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      href,
    ).toBe(true);
  }
});
test("dashboard counters match database and quick links open the corresponding module", async ({
  page,
}) => {
  const { count } = await admin()
    .from("tools")
    .select("*", { head: true, count: "exact" })
    .eq("status", "in_use");
  const card = page
    .locator("a")
    .filter({ has: page.getByText("Ferramentas em uso", { exact: true }) });
  await expect(card).toContainText(String(count));
  await card.click();
  await expect(page).toHaveURL(/\/records\/tool_checkouts/);
});
test("tool withdrawal and return operate through confirmation dialogs", async ({
  page,
}) => {
  await page.goto("/records/tools/" + toolId);
  await page.getByRole("button", { name: "Retirar ferramenta" }).click();
  let dialog = page.getByRole("dialog");
  await dialog.getByLabel("Destino / finalidade").fill("Inspeção automatizada");
  await confirm(dialog);
  await expect(
    page.getByRole("button", { name: "Devolver ferramenta" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Devolver ferramenta" }).click();
  dialog = page.getByRole("dialog");
  await dialog.getByLabel("Local de guarda").selectOption(f.location.id);
  await confirm(dialog);
  await expect(
    page.getByRole("button", { name: "Retirar ferramenta" }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Registrar condição", exact: true })
    .click();
  dialog = page.getByRole("dialog");
  await dialog.locator('select[name="status"]').selectOption("available");
  await confirm(dialog);
  await expect(
    page.getByRole("button", { name: "Retirar ferramenta" }),
  ).toBeVisible();
});
test("stock receipt updates quantity and verification allows consumption", async ({
  page,
}) => {
  await page.goto("/records/stock_lots/" + f.lot.id);
  await page.getByRole("button", { name: "Movimentar estoque" }).click();
  let dialog = page.getByRole("dialog");
  await dialog.locator('select[name="kind"]').selectOption("receive");
  await dialog.locator('input[name="quantity"]').fill("10");
  await confirm(dialog);
  await page
    .getByRole("button", { name: "Conferir condição / documentação" })
    .click();
  dialog = page.getByRole("dialog");
  await dialog.getByLabel("Condição registrada").selectOption("serviceable");
  await dialog.locator('select[name="documentation"]').selectOption("complete");
  await confirm(dialog);
  await page.getByRole("button", { name: "Movimentar estoque" }).click();
  dialog = page.getByRole("dialog");
  await dialog.locator('select[name="kind"]').selectOption("consume");
  await dialog.locator('input[name="quantity"]').fill("2");
  await confirm(dialog);
  await expect(page.locator(".timeline")).toContainText(
    "Validação profissional automatizada",
  );
});
test("edit, review/cancel and archive preserve intended values", async ({
  page,
}) => {
  const location = await create(page.request, "locations", {
    name: tag(),
    code: tag(),
    kind: "cabinet",
    active: true,
  });
  await page.goto("/records/locations/" + location.id);
  await page.getByRole("button", { name: "Editar cadastro" }).click();
  const dialog = page.getByRole("dialog");
  const changed = tag();
  await dialog.locator('input[name="name"]').fill(changed);
  await dialog
    .getByLabel("Motivo / resumo da alteração")
    .fill("Revisão antes de salvar");
  await dialog.getByRole("button", { name: "Revisar e confirmar" }).click();
  await dialog.getByRole("button", { name: "Revisar", exact: true }).click();
  await expect(dialog.locator('input[name="name"]')).toHaveValue(changed);
  await confirm(dialog);
  await expect(
    page.getByRole("heading", { name: changed, exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Arquivar cadastro" }).click();
  await confirm(page.getByRole("dialog"));
});
test("global search and QR manual fallback find a record without camera permissions", async ({
  page,
}) => {
  await page.getByRole("textbox", { name: "Busca global" }).fill(f.t);
  await page.getByRole("textbox", { name: "Busca global" }).press("Enter");
  await expect(
    page.getByRole("heading", { name: "Busca global" }),
  ).toBeVisible();
  await expect(page.locator(".search-results")).not.toHaveCount(0);
  await page.goto("/scan");
  await page
    .getByLabel("Código patrimonial, P/N, S/N ou endereço da etiqueta")
    .fill("/records/tools/" + toolId);
  await page.getByRole("button", { name: "Buscar código informado" }).click();
  await expect(page).toHaveURL("/records/tools/" + toolId);
});
test("search, empty result, pagination, theme persistence and logout work", async ({
  page,
}) => {
  await page.goto("/records/locations?q=" + f.t);
  await expect(page.locator(".record-link").first()).toBeVisible();
  await page.getByLabel("Pesquisar registros").fill("no-such-record-" + tag());
  await page.getByRole("button", { name: "Buscar", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Nenhum resultado encontrado" }),
  ).toBeVisible();
  const old = await page.locator("html").getAttribute("data-theme");
  await page
    .getByRole("button", { name: "Alternar tema claro e escuro" })
    .click();
  await expect(page.locator("html")).not.toHaveAttribute("data-theme", old!);
  const next = await page.locator("html").getAttribute("data-theme");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", next!);
  await page.getByRole("button", { name: "Sair" }).click();
  await expect(page).toHaveURL(/\/login/);
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
});
test("document upload and version download work through the UI", async ({
  page,
}) => {
  if (test.info().project.name === "mobile")
    await page.setViewportSize({ width: 320, height: 640 });
  const { PDFDocument } = await import("pdf-lib");
  const pdf = await PDFDocument.create();
  pdf.addPage();
  const bytes = Buffer.from(await pdf.save());
  await page.goto("/records/documents/" + documentId);
  const picker = page.getByLabel("Nova versão (PDF, PNG ou JPEG; até 4 MB)");
  for (let version = 1; version <= 2; version++) {
    await expect(picker).toBeEnabled();
    await picker.setInputFiles({
      name: "documento.pdf",
      mimeType: "application/pdf",
      buffer: bytes,
    });
    await page
      .getByRole("button", { name: "Adicionar versão privada" })
      .click();
    await confirm(page.getByRole("dialog"));
    await expect(
      page.getByText("Aguardando verificação de segurança", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: new RegExp("Versão " + version) }),
    ).toHaveCount(0);
    const { data: pending, error } = await admin()
      .from("document_versions")
      .select("id,sha256")
      .eq("document_id", documentId)
      .eq("revision", version)
      .single();
    expect(error).toBeNull();
    // Simulated trusted scanner verdict ONLY in the disposable local integration environment.
    const verdict = await admin().rpc("record_document_scan", {
      p_version: pending!.id,
      p_sha: pending!.sha256,
      p_clean: true,
    });
    expect(verdict.error).toBeNull();
    await page.reload();
    const link = page.getByRole("link", {
      name: new RegExp("Versão " + version),
    });
    await expect(link).toBeVisible();
    expect(
      (await page.request.get((await link.getAttribute("href"))!)).status(),
    ).toBe(200);
  }
});
test("CSV import can be previewed, mapped and confirmed through the UI", async ({
  page,
}) => {
  const t = tag();
  await page.goto("/imports");
  await page
    .getByRole("combobox", { name: /^Categoria/ })
    .selectOption("locations");
  await expect(page.getByLabel("Arquivo (.xlsx ou .csv)")).toBeEnabled();
  await page.getByLabel("Arquivo (.xlsx ou .csv)").setInputFiles({
    name: "locais.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(`name,code,kind,active\n${t},${t},workshop,true`),
  });
  await expect(
    page.getByRole("heading", { name: "Prévia · 1 linhas" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Confirmar importação", exact: true })
    .click();
  await confirm(page.getByRole("dialog"));
  await page.goto("/records/locations?q=" + t);
  await expect(page.getByRole("link", { name: t, exact: true })).toBeVisible();
});
test("record pagination keeps the search and shows the remaining records", async ({
  page,
}) => {
  const prefix = tag() + "-page";
  for (let i = 0; i < 27; i++)
    await create(page.request, "locations", {
      name: prefix + "-" + i,
      code: prefix + "-" + i,
      kind: "drawer",
      active: true,
    });
  await page.goto("/records/locations?q=" + prefix);
  await expect(page.locator(".record-link")).toHaveCount(25);
  await page.getByRole("link", { name: "Próxima", exact: true }).click();
  await expect(page.locator(".record-link")).toHaveCount(2);
  await expect(page).toHaveURL(new RegExp("page=2.*q=" + prefix));
  await page.getByRole("link", { name: "Anterior", exact: true }).click();
  await expect(page.locator(".record-link")).toHaveCount(25);
});
test("report form downloads a PDF with blank optional filters", async ({
  page,
}) => {
  await page.goto("/reports");
  await page.locator('select[name="entity"]').selectOption("tools");
  await page.locator('select[name="format"]').selectOption("pdf");
  const promise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Gerar relatório" }).click();
  const download = await promise;
  expect(download.suggestedFilename()).toBe("lavilli-tools-1.pdf");
  expect(await download.failure()).toBeNull();
});
