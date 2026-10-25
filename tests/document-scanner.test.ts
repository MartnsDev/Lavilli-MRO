import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { existsSync } from "node:fs";
const exec = vi.hoisted(() => vi.fn());
vi.mock("node:child_process", () => ({ execFileSync: exec }));
import {
  scanLocalBytes,
  scannerOptions,
  scannerSignatureDate,
} from "../scripts/lib/document-scanner.mjs";
const env = { NODE_ENV: "test" } as const;
const fresh = () => `ClamAV 1.5.4/28164/${new Date().toUTCString()}`;
beforeEach(() => {
  exec.mockReset();
  exec.mockReturnValue(fresh());
});
afterEach(() => vi.restoreAllMocks());
it("rejects arbitrary scanner executables", () => {
  expect(() =>
    scannerOptions({ ...env, CLAM_SCAN_BIN: "/tmp/other" }),
  ).toThrow();
});
it("fails closed with stale or unparseable definitions", () => {
  exec.mockReturnValue("ClamAV 1/1/2000-01-01");
  expect(() => scannerSignatureDate(env)).toThrow();
  exec.mockReturnValue("invalid");
  expect(() => scannerSignatureDate(env)).toThrow();
});
it("accepts clean files with strict limits and removes the private temporary file", async () => {
  exec.mockReturnValueOnce(fresh()).mockReturnValueOnce("");
  expect(await scanLocalBytes(Buffer.from("synthetic test"), env)).toBe(true);
  const args = exec.mock.calls[1][1];
  expect(args).toContain("--alert-exceeds-max=yes");
  expect(args).toContain("--fail-if-cvd-older-than=3");
  expect(existsSync(args.at(-1))).toBe(false);
});
it("blocks infections, but never records a clean verdict on operational errors", async () => {
  exec.mockReturnValueOnce(fresh()).mockImplementationOnce(() => {
    throw { status: 1 };
  });
  expect(await scanLocalBytes(Buffer.from("synthetic test"), env)).toBe(false);
  exec.mockReturnValueOnce(fresh()).mockImplementationOnce(() => {
    throw { status: 2 };
  });
  await expect(
    scanLocalBytes(Buffer.from("synthetic test"), env),
  ).rejects.toThrow("pendente");
  const args = exec.mock.calls.at(-1)![1];
  expect(existsSync(args.at(-1))).toBe(false);
});
it("rejects empty and oversized data before invoking the scanner", async () => {
  await expect(scanLocalBytes(Buffer.alloc(0), env)).rejects.toThrow();
  await expect(scanLocalBytes(Buffer.alloc(4194305), env)).rejects.toThrow();
  expect(exec).not.toHaveBeenCalled();
});
