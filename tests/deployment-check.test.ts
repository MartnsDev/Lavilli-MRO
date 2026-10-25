import { describe, expect, it } from "vitest";
import {
  deploymentPassed,
  deploymentTarget,
  deploymentProject,
  deploymentPin,
  deployThenVerify,
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

describe("checked CLI publishing", () => {
  it("refuses mismatched projects and organizations before publishing", () => {
    const production = {
      projectId: "prj_spaV203Tb9YLtHAfz9a8cL4t0VZK",
      orgId: "team_SViHORIJUJwyCD3UsEBFx8cA",
    };
    expect(() =>
      deploymentProject("https://lavilli-control.vercel.app", production),
    ).not.toThrow();
    expect(() =>
      deploymentProject("https://lavilli-control-test.vercel.app", production),
    ).toThrow();
    expect(() =>
      deploymentProject("https://lavilli-control.vercel.app", {
        ...production,
        orgId: "wrong",
      }),
    ).toThrow();
  });
  it("refuses missing, malformed or ambiguous private PIN sources", async () => {
    await expect(deploymentPin({})).rejects.toThrow();
    await expect(deploymentPin({ DEPLOY_TEST_PIN: "00000" })).rejects.toThrow();
    await expect(
      deploymentPin({
        DEPLOY_TEST_PIN: "1234",
        DEPLOY_TEST_PIN_FILE: "unused",
      }),
    ).rejects.toThrow();
  });
  it("runs the deploy test after publication and propagates its failure", async () => {
    const commands: string[] = [];
    const result = await deployThenVerify(async (command: string) => {
      commands.push(command);
      return commands.length === 1 ? 0 : 1;
    });
    expect(commands).toEqual(["npx", process.execPath]);
    expect(result).toBe(1);
  });
  it("does not run verification against a failed publication", async () => {
    const commands: string[] = [];
    expect(
      await deployThenVerify(async (command: string) => {
        commands.push(command);
        return 2;
      }),
    ).toBe(2);
    expect(commands).toEqual(["npx"]);
  });
  it("supports verifying an existing deploy without publishing again", async () => {
    const calls: unknown[] = [];
    expect(
      await deployThenVerify(
        async (command: string, args: string[]) => {
          calls.push([command, args]);
          return 0;
        },
        { verifyOnly: true, smokeOnly: true },
      ),
    ).toBe(0);
    expect(calls).toEqual([
      [process.execPath, ["scripts/verify-deployment.mjs", "--smoke-only"]],
    ]);
  });
});
