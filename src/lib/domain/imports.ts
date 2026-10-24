import Papa from "papaparse";
import ExcelJS from "exceljs";
export function guardZip(bytes: Buffer) {
  let total = 0,
    entries = 0;
  for (let i = 0; i + 46 < bytes.length; i++) {
    if (bytes.readUInt32LE(i) === 0x02014b50) {
      total += bytes.readUInt32LE(i + 24);
      entries++;
      if (total > 20 * 1024 * 1024 || entries > 2000)
        throw new Error("INVALID_OPERATION");
    }
  }
  if (!entries) throw new Error("INVALID_OPERATION");
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
  await book.xlsx.load(
    bytes as unknown as Parameters<typeof book.xlsx.load>[0],
  );
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
