import { describe, expect, it } from "vitest";
import { backendAllowedForMode } from "../src/lib/domain/environment";
const demo = {
  APP_MODE: "demo",
  SUPABASE_URL: "https://abcdefghijklmnopqrst.supabase.co",
  DEMO_SUPABASE_PROJECT_REF: "abcdefghijklmnopqrst",
  APP_URL: "https://lavilli-control-test.vercel.app",
  EMAIL_MODE: "disabled",
};
describe("isolated online demonstration boundary", () => {
  it("keeps the existing normal mode unchanged", () => {
    expect(
      backendAllowedForMode({
        APP_MODE: "normal",
        SUPABASE_URL: "https://ecyzjuhryfqqpqoskyth.supabase.co",
      }),
    ).toBe(true);
  });
  it("allows local demo and test stacks", () => {
    for (const mode of ["demo", "test"])
      expect(
        backendAllowedForMode({
          APP_MODE: mode,
          SUPABASE_URL: "http://127.0.0.1:54321",
        }),
      ).toBe(true);
  });
  it("allows only an explicit separate cloud backend for the fixed demo domain", () => {
    expect(backendAllowedForMode(demo)).toBe(true);
  });
  it("never permits the existing production database as a demo or test backend", () => {
    for (const mode of ["demo", "test"])
      expect(
        backendAllowedForMode({
          ...demo,
          APP_MODE: mode,
          SUPABASE_URL: "https://ecyzjuhryfqqpqoskyth.supabase.co",
          DEMO_SUPABASE_PROJECT_REF: "ecyzjuhryfqqpqoskyth",
        }),
      ).toBe(false);
  });
  it("keeps automated test mode limited to loopback", () => {
    expect(backendAllowedForMode({ ...demo, APP_MODE: "test" })).toBe(false);
  });
  it("rejects backend mismatches, email delivery and a production application URL", () => {
    for (const change of [
      { DEMO_SUPABASE_PROJECT_REF: "" },
      { DEMO_SUPABASE_PROJECT_REF: "differentprojectrefff" },
      { EMAIL_MODE: "resend" },
      { APP_URL: "https://lavilli-control.vercel.app" },
    ])
      expect(backendAllowedForMode({ ...demo, ...change })).toBe(false);
  });
  it("rejects malformed or deceptive remote URLs", () => {
    for (const url of [
      "invalid",
      demo.SUPABASE_URL + ".evil.invalid",
      demo.SUPABASE_URL + "/path",
      demo.SUPABASE_URL + "?secret=invalid",
      demo.SUPABASE_URL.replace("https://", "https://user:pass@"),
    ])
      expect(backendAllowedForMode({ ...demo, SUPABASE_URL: url })).toBe(false);
  });
});
