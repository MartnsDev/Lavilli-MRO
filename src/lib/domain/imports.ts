import { inflateRawSync } from "node:zlib";
import Papa from "papaparse";
import ExcelJS from "exceljs";
export function guardZip(bytes: Buffer) {
  const reject = () => {
    throw Error("INVALID_OPERATION");
  };
  if (bytes.length < 22 || bytes.length > 2097152) reject();
  let end = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--)
    if (bytes.readUInt32LE(i) === 0x06054b50) {
      end = i;
      break;
    }
  if (end < 0) reject();
  const entries = bytes.readUInt16LE(end + 10),
    offset = bytes.readUInt32LE(end + 16),
    size = bytes.readUInt32LE(end + 12);
  if (
    !entries ||
    entries > 2000 ||
    offset + size !== end ||
    bytes.readUInt16LE(end + 4) ||
    bytes.readUInt16LE(end + 6)
  )
    reject();
  let pos = offset,
    total = 0;
  const names = new Set<string>();
  for (let i = 0; i < entries; i++) {
    if (pos + 46 > end || bytes.readUInt32LE(pos) !== 0x02014b50) reject();
    const flags = bytes.readUInt16LE(pos + 8),
      method = bytes.readUInt16LE(pos + 10),
      compressed = bytes.readUInt32LE(pos + 20),
      declared = bytes.readUInt32LE(pos + 24),
      n = bytes.readUInt16LE(pos + 28),
      extra = bytes.readUInt16LE(pos + 30),
      comment = bytes.readUInt16LE(pos + 32),
      local = bytes.readUInt32LE(pos + 42);
    if (
      pos + 46 + n + extra + comment > end ||
      flags & 1 ||
      ![0, 8].includes(method) ||
      local + 30 > offset ||
      bytes.readUInt32LE(local) !== 0x04034b50
    )
      reject();
    const name = bytes.subarray(pos + 46, pos + 46 + n).toString("utf8");
    if (
      names.has(name) ||
      name.includes("..") ||
      name.includes("\\") ||
      name.startsWith("/") ||
      /vbaProject|externalLinks|\.bin$|\.exe$|\.js$/i.test(name)
    )
      reject();
    names.add(name);
    const start =
      local +
      30 +
      bytes.readUInt16LE(local + 26) +
      bytes.readUInt16LE(local + 28);
    if (start + compressed > offset) reject();
    if (declared > 20971520 || declared > Math.max(compressed * 100, 65536))
      reject();
    let actual: Buffer;
    try {
      actual =
        method === 0
          ? bytes.subarray(start, start + compressed)
          : inflateRawSync(bytes.subarray(start, start + compressed), {
              maxOutputLength: 20971520,
            });
    } catch {
      reject();
      return;
    }
    if (actual.length !== declared) reject();
    total += actual.length;
    if (total > 20971520) reject();
    if (
      name.endsWith(".rels") &&
      /TargetMode\s*=\s*["']External["']/i.test(actual.toString("utf8"))
    )
      reject();
    pos += 46 + n + extra + comment;
  }
  if (
    pos !== end ||
    !names.has("[Content_Types].xml") ||
    !names.has("xl/workbook.xml")
  )
    reject();
}
export async function parseImport(
  name: string,
  bytes: Buffer,
): Promise<string[][]> {
  if (bytes.length > 2 * 1024 * 1024) throw new Error("INVALID_OPERATION");
  if (name.toLowerCase().endsWith(".csv")) {
    const r = Papa.parse<string[]>(bytes.toString("utf8"), {
      skipEmptyLines: "greedy",
    });
    if (r.errors.length) throw new Error("INVALID_OPERATION");
    if (r.data.length > 101 || r.data.some((r) => r.length > 60))
      throw new Error("INVALID_OPERATION");
    return r.data;
  }
  if (!name.toLowerCase().endsWith(".xlsx"))
    throw new Error("INVALID_OPERATION");
  guardZip(bytes);
  const book = new ExcelJS.Workbook();
  try {
    await book.xlsx.load(
      bytes as unknown as Parameters<typeof book.xlsx.load>[0],
    );
  } catch {
    throw Error("INVALID_OPERATION");
  }
  const sheet = book.worksheets[0];
  if (!sheet || sheet.rowCount > 101 || sheet.columnCount > 60)
    throw new Error("INVALID_OPERATION");
  const rows: string[][] = [];
  sheet.eachRow((row) => {
    const cells: string[] = [];
    row.eachCell({ includeEmpty: true }, (cell, index) => {
      if (
        cell.type === ExcelJS.ValueType.Formula ||
        cell.type === ExcelJS.ValueType.Hyperlink
      )
        throw new Error("INVALID_OPERATION");
      cells[index - 1] =
        cell.value instanceof Date
          ? cell.value.toISOString().slice(0, 10)
          : cell.text;
    });
    rows.push(cells);
  });
  return rows;
}
