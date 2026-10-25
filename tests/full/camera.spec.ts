import { test, expect, type Page } from "@playwright/test";
import QRCode from "qrcode";
import bwipjs from "bwip-js/node";
import sharp from "sharp";
import { admin, create, foundation, isolated, login, tag } from "./helpers";
let f: Awaited<ReturnType<typeof foundation>>;

test.beforeAll(async ({ request }) => {
  isolated();
  f = await foundation(request);
});
test.beforeEach(async ({ page }) => {
  await login(page.request);
});
async function confirm(page: Page) {
  const dialog = page.getByRole("dialog");
  await dialog
    .getByLabel("Motivo / resumo da alteração")
    .fill("Validação isolada de câmera e OCR");
  await dialog.getByRole("button", { name: "Revisar e confirmar" }).click();
  await dialog
    .locator('select[name="mechanic_id"]')
    .selectOption({ label: "César" });
  await dialog.getByLabel("Redigite a senha geral").fill(process.env.TEST_PIN!);
  const response = page.waitForResponse(
    (r) =>
      /\/api\/(operations|documents\/upload)$/.test(
        new URL(r.url()).pathname,
      ) && r.request().method() === "POST",
  );
  await dialog.getByRole("button", { name: "Confirmar e registrar" }).click();
  const result = await response;
  expect(result.status(), await result.text()).toBe(200);
  await expect(dialog).toBeHidden();
  return (await result.json()).data;
}
async function documentPhoto(pn: string, sn: string, width = 1800) {
  const svg = `<svg width="${width}" height="800" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="white"/><g fill="black" font-family="sans-serif" font-size="60"><text x="80" y="150">PART IDENTIFICATION</text><text x="80" y="320">P/N: ${pn}</text><text x="80" y="490">S/N: ${sn}</text></g></svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}
test("reads a QR photo with no native BarcodeDetector and never sends the image", async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(window, "BarcodeDetector", {
      value: undefined,
      configurable: true,
    }),
  );
  await page.goto("/scan");
  const posts: string[] = [];
  page.on("request", (r) => {
    if (r.method() === "POST") posts.push(new URL(r.url()).pathname);
  });
  const path = "/records/locations/" + f.location.id;
  const png = await QRCode.toBuffer("http://localhost:3100" + path, {
    width: 700,
    margin: 4,
  });
  await page.getByLabel("Ler foto da galeria", { exact: true }).setInputFiles({
    name: "etiqueta.png",
    mimeType: "image/png",
    buffer: png,
  });
  await expect(page).toHaveURL(new RegExp(path + "$"));
  expect(posts).toEqual([]);
});
test("reads a photographed Code 128 and searches its actual value", async ({
  page,
}) => {
  await page.goto("/scan");
  const png = await bwipjs.toBuffer({
    bcid: "code128",
    text: f.t,
    scale: 3,
    height: 22,
    padding: 20,
    backgroundcolor: "FFFFFF",
  });
  await page
    .getByLabel("Fotografar etiqueta", { exact: true })
    .setInputFiles({ name: "barcode.png", mimeType: "image/png", buffer: png });
  await expect(page).toHaveURL(/\/search\?q=/);
  expect(new URL(page.url()).searchParams.get("q")).toBe(f.t);
});
test("decodes a real synthetic camera stream and releases its track after opening the record", async ({
  page,
}) => {
  const path = "/records/locations/" + f.location.id;
  const image = await QRCode.toDataURL("http://localhost:3100" + path, {
    width: 700,
    margin: 4,
  });
  await page.addInitScript(
    ({ image }) => {
      const state = window as unknown as {
        cameraStopped?: boolean;
        cameraCanvas?: HTMLCanvasElement;
      };
      Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
        configurable: true,
        value: async () => {
          const img = new Image();
          img.src = image;
          await img.decode();
          const canvas = document.createElement("canvas");
          canvas.width = canvas.height = 700;
          state.cameraCanvas = canvas;
          const ctx = canvas.getContext("2d")!;
          const media = canvas.captureStream(10);
          const timer = setInterval(() => ctx.drawImage(img, 0, 0), 80);
          ctx.drawImage(img, 0, 0);
          for (const track of media.getTracks()) {
            const stop = track.stop.bind(track);
            track.stop = () => {
              state.cameraStopped = true;
              clearInterval(timer);
              stop();
            };
          }
          return media;
        },
      });
    },
    { image },
  );
  await page.goto("/scan");
  await page
    .getByRole("button", { name: "Iniciar câmera", exact: true })
    .click();
  await expect(page).toHaveURL(new RegExp(path + "$"), { timeout: 30000 });
  expect(
    await page.evaluate(
      () => (window as unknown as { cameraStopped: boolean }).cameraStopped,
    ),
  ).toBe(true);
});
test("permission denial leaves photo and manual lookup available", async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
      configurable: true,
      value: async () => {
        throw new DOMException("Denied", "NotAllowedError");
      },
    }),
  );
  await page.goto("/scan");
  await page
    .getByRole("button", { name: "Iniciar câmera", exact: true })
    .click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Permita o acesso" }),
  ).toContainText("Permita o acesso");
  await expect(
    page.getByLabel("Ler foto da galeria", { exact: true }),
  ).toBeEnabled();
  await expect(page.locator('input[name="code"]')).toBeVisible();
});
test("cancels a pending permission request and stops the stream when it finally resolves", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const state = window as unknown as {
      resolveCamera?: () => void;
      cameraStopped?: boolean;
    };
    Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
      configurable: true,
      value: () =>
        new Promise<MediaStream>((resolve) => {
          state.resolveCamera = () => {
            const canvas = document.createElement("canvas");
            canvas.width = canvas.height = 10;
            const media = canvas.captureStream();
            for (const track of media.getTracks()) {
              const stop = track.stop.bind(track);
              track.stop = () => {
                state.cameraStopped = true;
                stop();
              };
            }
            resolve(media);
          };
        }),
    });
  });
  await page.goto("/scan");
  await page
    .getByRole("button", { name: "Iniciar câmera", exact: true })
    .click();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          typeof (window as unknown as { resolveCamera?: () => void })
            .resolveCamera,
      ),
    )
    .toBe("function");
  await page
    .getByRole("button", { name: "Encerrar câmera", exact: true })
    .click();
  await page.evaluate(() =>
    (window as unknown as { resolveCamera: () => void }).resolveCamera(),
  );
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as unknown as { cameraStopped?: boolean }).cameraStopped,
      ),
    )
    .toBe(true);
  await expect(
    page.getByRole("button", { name: "Iniciar câmera", exact: true }),
  ).toBeEnabled();
});
test("camera photo is normalized, previewed and saved as a private pending JPEG", async ({
  page,
}) => {
  const d = await create(page.request, "documents", {
    name: tag() + " câmera",
    category: "internal",
  });
  const png = await documentPhoto("TEST-PN-123", "TEST-SN-456", 4000);
  await page.goto("/records/documents/" + d.id);
  const camera = page.getByLabel("Tirar foto do documento", { exact: true });
  await expect(camera).toHaveAttribute("capture", "environment");
  await camera.setInputFiles({
    name: "camera.png",
    mimeType: "image/png",
    buffer: png,
  });
  await expect(
    page.getByRole("img", { name: "Prévia da foto do documento" }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page
        .getByRole("img", { name: "Prévia da foto do documento" })
        .evaluate((img: HTMLImageElement) => img.naturalWidth),
    )
    .toBe(3000);
  await page
    .getByRole("button", { name: "Adicionar versão privada", exact: true })
    .click();
  await confirm(page);
  await expect(
    page.getByText("Aguardando verificação de segurança", { exact: true }),
  ).toBeVisible();
  const saved = await admin()
    .from("document_versions")
    .select("id,sha256,mime_type,size_bytes,scan_status")
    .eq("document_id", d.id)
    .single();
  expect(saved.error).toBeNull();
  expect(saved.data!.mime_type).toBe("image/jpeg");
  expect(saved.data!.scan_status).toBe("pending");
  expect(saved.data!.size_bytes).toBeLessThanOrEqual(4194304);
  await expect(page.getByText("Visualizar foto verificada")).toHaveCount(0);
  // Trusted verdict simulation only in the isolated database; actual ClamAV is checked separately.
  const verdict = await admin().rpc("record_document_scan", {
    p_version: saved.data!.id,
    p_sha: saved.data!.sha256,
    p_clean: true,
  });
  expect(verdict.error).toBeNull();
  await page.reload();
  await page.getByText("Visualizar foto verificada", { exact: true }).click();
  const verified = page.getByRole("img", {
    name: "Foto do documento após verificação de segurança",
  });
  await expect(verified).toBeVisible();
  await expect
    .poll(() => verified.evaluate((img: HTMLImageElement) => img.naturalWidth))
    .toBe(3000);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
test("real local OCR prefills the exact catalog and serial and preserves its photo for the linked document", async ({
  page,
  context,
}, info) => {
  test.setTimeout(180000);
  const sn = tag().toUpperCase() + "-SN";
  const image = await documentPhoto("TEST-PN-789456", "SN-789456");
  const external: string[] = [],
    uploads: string[] = [];
  context.on("request", (r) => {
    if (new URL(r.url()).origin !== "http://localhost:3100")
      external.push(new URL(r.url()).origin);
    if (new URL(r.url()).pathname === "/api/documents/upload")
      uploads.push(r.method());
  });
  await page.goto("/scan");
  await page
    .getByLabel("Selecionar foto do documento", { exact: true })
    .setInputFiles({
      name: "identificacao.png",
      mimeType: "image/png",
      buffer: image,
    });
  await expect(page.getByLabel("Part Number (conferir)")).toHaveValue(
    "TEST-PN-789456",
    { timeout: 120000 },
  );
  await expect(page.getByLabel("Serial Number (conferir)")).toHaveValue(
    "SN-789456",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: info.outputPath("ocr-reviewed.png"),
    fullPage: true,
  });
  // Review/editing is deliberate: OCR must never silently commit a possibly ambiguous identifier.
  await page.getByLabel("Part Number (conferir)").fill(f.catalog.part_number);
  await page.getByLabel("Serial Number (conferir)").fill(sn);
  expect(uploads).toEqual([]);
  expect(external).toEqual([]);
  await page
    .getByRole("link", { name: "Usar PN e serial no cadastro" })
    .click();
  await page
    .getByRole("button", { name: "Novo cadastro", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await expect(
    dialog.getByRole("combobox", { name: "Item do catálogo", exact: true }),
  ).toHaveValue(f.catalog.id);
  await expect(
    dialog.getByRole("textbox", { name: "Serial Number", exact: true }),
  ).toHaveValue(sn);
  await dialog
    .getByRole("combobox", { name: "Localização", exact: true })
    .selectOption(f.location.id);
  const created = await confirm(page);
  await page
    .locator(`a[href="/records/part_instances/${created.id}"]`)
    .first()
    .click();
  await page
    .getByRole("button", {
      name: "Cadastrar documento desta peça",
      exact: true,
    })
    .click();
  const captured = await confirm(page);
  await page
    .getByRole("button", {
      name: "Confirmar vínculo do documento",
      exact: true,
    })
    .click();
  await confirm(page);
  await expect(
    page.getByRole("button", { name: "Usar foto da leitura", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Usar foto da leitura", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Adicionar versão privada", exact: true })
    .click();
  await confirm(page);
  await expect(
    page.getByRole("status").filter({ hasText: "Arquivo enviado e salvo" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Usar foto da leitura", exact: true }),
  ).toHaveCount(0);
  const links = await admin()
    .from("document_links")
    .select("entity_id")
    .eq("document_id", captured.id)
    .eq("entity", "part_instances");
  expect(links.data).toEqual([{ entity_id: created.id }]);
  const unit = await admin()
    .from("part_instances")
    .select("catalog_id,serial_number")
    .eq("id", created.id)
    .single();
  expect(unit.data).toEqual({ catalog_id: f.catalog.id, serial_number: sn });
});

test("a new PN can be created before its serialized unit without losing the reviewed serial", async ({
  page,
}) => {
  const pn = tag().toUpperCase() + "-NEWPN",
    sn = tag().toUpperCase() + "-NEW-SN";
  await page.goto(
    "/records/part_instances?" +
      new URLSearchParams({ part_number: pn, serial_number: sn }),
  );
  await page
    .getByRole("link", { name: "cadastre primeiro o Part Number", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Novo cadastro", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await expect(
    dialog.getByRole("textbox", { name: "Part Number", exact: true }),
  ).toHaveValue(pn);
  await dialog
    .getByRole("textbox", { name: "Descrição", exact: true })
    .fill("Componente de ensaio isolado");
  const catalog = await confirm(page);
  await expect(page).toHaveURL(/\/records\/part_instances\?/);
  await page
    .getByRole("button", { name: "Novo cadastro", exact: true })
    .click();
  await expect(
    dialog.getByRole("combobox", { name: "Item do catálogo", exact: true }),
  ).toHaveValue(catalog.id);
  await expect(
    dialog.getByRole("textbox", { name: "Serial Number", exact: true }),
  ).toHaveValue(sn);
  await dialog
    .getByRole("combobox", { name: "Localização", exact: true })
    .selectOption(f.location.id);
  const unit = await confirm(page);
  const saved = await admin()
    .from("part_instances")
    .select("catalog_id,serial_number")
    .eq("id", unit.id)
    .single();
  expect(saved.error).toBeNull();
  expect(saved.data).toEqual({ catalog_id: catalog.id, serial_number: sn });
});
