import { describe, expect, it } from "vitest";
import {
  deploymentPassed,
  deploymentTarget,
} from "../scripts/lib/deployment-check.mjs";

describe("deployment test safety and release gate", () => {
  it("accepts only the two canonical Lavilli HTTPS origins", () => {
    expect(deploymentTarget("https://lavilli-control.vercel.app/")).toBe(
      "https://lavilli-control.vercel.app",
    );
    expect(deploymentTarget("https://lavilli-control-test.vercel.app")).toBe(
      "https://lavilli-control-test.vercel.app",
    );
  });
  it("refuses credential forwarding to arbitrary hosts or URL components", () => {
    for (const url of [
      "http://lavilli-control.vercel.app",
      "https://example.invalid",
      "https://lavilli-control.vercel.app.evil.invalid",
      "https://user:secret@lavilli-control.vercel.app",
      "https://lavilli-control.vercel.app/path",
      "https://lavilli-control.vercel.app/?pin=private",
      "https://lavilli-control.vercel.app/#private",
      "https://lavilli-control.vercel.app:8443",
    ])
      expect(() => deploymentTarget(url)).toThrow();
  });
  it("blocks a release when document upload remains unavailable", () => {
    const checks = [
      { name: "login", passed: true },
      { name: "document-upload-capability", passed: false },
    ];
    expect(deploymentPassed(checks)).toBe(false);
    expect(deploymentPassed(checks, false)).toBe(true);
  });
  it("never ignores authentication failures or accepts an empty run", () => {
    expect(deploymentPassed([], false)).toBe(false);
    expect(deploymentPassed([{ name: "login", passed: false }], false)).toBe(
      false,
    );
    expect(
      deploymentPassed([
        { name: "login", passed: true },
        { name: "document-upload-capability", passed: true },
      ]),
    ).toBe(true);
  });
});
