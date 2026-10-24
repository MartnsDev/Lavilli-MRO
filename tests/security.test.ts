import { describe, it, expect, vi } from "vitest";
import {
  digest,
  sign,
  unsign,
  operationHash,
  safeCSV,
} from "../src/lib/domain/security";
import { parseCommand } from "../src/lib/domain/commands";
import { fileType, validExtension } from "../src/lib/domain/files";
import { parseImport } from "../src/lib/domain/imports";
import ExcelJS from "exceljs";
const id = "00000000-0000-4000-8000-000000000001";
describe("security boundaries", () => {
  it("rejects tampered, truncated and unsigned session cookies", () => {
    const secret = "unit-test-secret".repeat(4);
    expect(unsign(sign("opaque", secret), secret)).toBe("opaque");
    for (const s of [
      "opaque",
      sign("opaque", secret) + "x",
      sign("other", secret).slice(1),
    ])
      expect(unsign(s, secret)).toBeNull();
  });
  it("binds confirmation to every command field and idempotency key", () => {
    const a = {
      operation_id: id,
      command: { action: "stock", data: { quantity: 1, lot_id: id } },
    };
    expect(operationHash(a)).toBe(
      operationHash({ command: a.command, operation_id: id }),
    );
    expect(operationHash(a)).not.toBe(
      operationHash({
        ...a,
        command: { ...a.command, data: { quantity: 2, lot_id: id } },
      }),
    );
  });
  it("does not accept actor spoofing, stock balance edits or unknown tables", () => {
    for (const c of [
      { action: "create", entity: "stock_lots", data: { quantity: 999 } },
      { action: "create", entity: "access_sessions", data: {} },
      {
        action: "stock",
        actor_id: id,
        data: { lot_id: id, kind: "consume", quantity: 1 },
      },
    ])
      expect(() =>
        parseCommand({ ...c, reason: "Teste de segurança" }),
      ).toThrow();
  });
  it("rejects negative and NaN quantities and missing verification fields", () => {
    for (const n of [-1, 0, NaN])
      expect(() =>
        parseCommand({
          action: "stock",
          data: { lot_id: id, kind: "consume", quantity: n },
          reason: "Teste",
        }),
      ).toThrow();
    expect(() =>
      parseCommand({
        action: "stock",
        data: { lot_id: id, kind: "verify", quantity: 1 },
        reason: "Teste",
      }),
    ).toThrow();
  });
  it("requires version and justification for updates", () => {
    expect(() =>
      parseCommand({
        action: "update",
        entity: "mechanics",
        id,
        data: { name: "Teste", active: true },
        reason: "x",
      }),
    ).toThrow();
  });
  it("neutralizes spreadsheet formula injection and escapes quotes", () => {
    for (const v of ['=HYPERLINK("a")', " +1", "@SUM(1)", "-2", "\t=1"])
      expect(safeCSV(v).startsWith("\"'")).toBe(true);
    expect(safeCSV('a"b')).toBe('"a""b"');
  });
  it("checks file magic and extensions", () => {
    expect(fileType(Buffer.from("%PDF-1.7"))).toBe("application/pdf");
    expect(fileType(Buffer.from("<script>"))).toBeNull();
    expect(validExtension("fake.exe", "application/pdf")).toBe(false);
  });
  it("hashes opaque tokens deterministically without retaining plaintext", () => {
    expect(digest("token")).toHaveLength(64);
    expect(digest("token")).not.toContain("token");
  });
});
describe("untrusted imports", () => {
  it("reads CSV without evaluating values", async () => {
    expect(
      await parseImport("test.csv", Buffer.from("name,part_number\nPeça,PN-1")),
    ).toEqual([
      ["name", "part_number"],
      ["Peça", "PN-1"],
    ]);
  });
  it("rejects excessive rows and unsupported files", async () => {
    await expect(
      parseImport("test.csv", Buffer.from("a\n" + "row\n".repeat(101))),
    ).rejects.toThrow();
    await expect(
      parseImport("test.xlsm", Buffer.from("bad")),
    ).rejects.toThrow();
  });
  it("reads XLSX and rejects formula cells", async () => {
    const book = new ExcelJS.Workbook();
    const sheet = book.addWorksheet("Peças");
    sheet.addRow(["name", "part_number"]);
    sheet.addRow(["Peça", "PN-1"]);
    const bytes = Buffer.from(await book.xlsx.writeBuffer());
    expect((await parseImport("test.xlsx", bytes))[1]).toEqual([
      "Peça",
      "PN-1",
    ]);
    sheet.getCell("B2").value = { formula: "1+1", result: 2 };
    await expect(
      parseImport("test.xlsx", Buffer.from(await book.xlsx.writeBuffer())),
    ).rejects.toThrow();
  });
  it("validates each mapped import record on the server", () => {
    expect(() =>
      parseCommand({
        action: "import_rows",
        reason: "Importação teste",
        data: {
          name: "arquivo.csv",
          category: "tools",
          mode: "create",
          rows: [
            {
              name: "Ferramenta",
              code: "T1",
              location_id: "invalid",
              calibration_required: false,
            },
          ],
        },
      }),
    ).toThrow();
  });
});

describe("PIN hashing", () => {
  it("uses Argon2id and rejects a different PIN without plaintext persistence", async () => {
    const { hash, verify } = await import("@node-rs/argon2");
    const { randomInt } = await import("node:crypto");
    const pin = String(randomInt(1000, 10000));
    const encoded = await hash(pin, {
      algorithm: 2,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 1,
    });
    expect(encoded.startsWith("$argon2id$")).toBe(true);
    expect(await verify(encoded, pin)).toBe(true);
    expect(await verify(encoded, "invalid")).toBe(false);
  });
});

describe("Brazilian date boundary", () => {
  it("uses São Paulo day rather than UTC calendar day", async () => {
    const { dayKeySP } = await import("../src/lib/utils");
    expect(dayKeySP(new Date("2026-10-24T01:00:00Z"))).toBe("2026-10-23");
  });
});

describe("Supabase server transport", () => {
  it("constructs on Node 20 without requiring native WebSocket or network", async () => {
    const values = {
      SUPABASE_URL: "https://example.invalid",
      SUPABASE_SERVICE_ROLE_KEY: "test-only-server-key",
      PIN_HASH: "test-only-hash",
      SESSION_SECRET: "test-only-session-secret",
      APP_URL: "http://localhost:3000",
    };
    for (const [key, value] of Object.entries(values)) vi.stubEnv(key, value);
    try {
      const { db } = await import("../src/lib/server/db");
      expect(() => db()).not.toThrow();
    } finally {
      vi.unstubAllEnvs();
    }
  });
});
