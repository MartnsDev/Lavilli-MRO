import { describe, expect, it } from "vitest";
import { identifiersFromText } from "../src/lib/domain/part-ocr";
import { scanDestination } from "../src/lib/domain/scan";
describe("photo identifiers require explicit labels and human review", () => {
  it.each([
    ["P/N: ABC-123\nS/N: 000456", "ABC-123", "000456"],
    ["PART NUMBER ABC/12\nSERIAL NUMBER Z-789", "ABC/12", "Z-789"],
    ["PN\n123-45\nNúmero de série\n00012", "123-45", "00012"],
    ["P N: 55-89  S N: SN-7", "55-89", "SN-7"],
    ["P/N: 123- 456\nS/N: A99", "123-456", "A99"],
    ["PART NO.: ABC-001\nSERIAL NO. 000456", "ABC-001", "000456"],
  ])(
    "extracts labeled fields without dropping leading zeroes",
    (text, partNumber, serialNumber) => {
      expect(identifiersFromText(text)).toEqual({ partNumber, serialNumber });
    },
  );
  it("does not guess from unrelated numbers or consume the other label as a value", () => {
    expect(identifiersFromText("DATE 2026-10-25\nQUANTITY 1234")).toEqual({
      partNumber: "",
      serialNumber: "",
    });
    expect(identifiersFromText("P/N:\nS/N: ABC-9")).toEqual({
      partNumber: "",
      serialNumber: "ABC-9",
    });
  });
});
describe("scanned codes cannot navigate to foreign sites or arbitrary application paths", () => {
  const origin = "https://hangar.example.invalid";
  const path = "/records/part_instances/00000000-0000-4000-8000-000000000001";
  it("opens authenticated record routes only for the current origin", () => {
    expect(scanDestination(origin + path, origin)).toBe(path);
    expect(scanDestination(path, origin)).toBe(path);
  });
  it("treats external URLs, scripts and malformed record addresses as search text", () => {
    for (const value of [
      "https://foreign.invalid" + path,
      "javascript:alert(1)",
      "/api/operations",
      "/records/tools/------------------------------------",
    ])
      expect(scanDestination(value, origin)).toMatch(/^\/search\?q=/);
    expect(scanDestination("", origin)).toBeNull();
  });
});
