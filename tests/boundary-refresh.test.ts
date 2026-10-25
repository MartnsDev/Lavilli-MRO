import { beforeEach, afterEach, expect, it, vi } from "vitest";
const probe = vi.hoisted(() => vi.fn());
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({ from: () => ({ select: () => ({ limit: probe }) }) }),
}));
beforeEach(() => {
  vi.resetModules();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-01-01"));
  vi.stubEnv("APP_MODE", "normal");
  vi.stubEnv("APP_URL", "https://hangar.example.invalid");
  vi.stubEnv("SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-only");
  vi.stubEnv(
    "SESSION_SECRET",
    "test-only-session-secret-with-enough-characters",
  );
  probe.mockReset();
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});
it("refreshes a legacy capability result so an authorized migration does not pin a warm server to old permissions", async () => {
  probe
    .mockResolvedValueOnce({ error: { code: "42703" } })
    .mockResolvedValue({ error: null });
  const { securityBoundaryReady } = await import("../src/lib/server/db");
  expect(await securityBoundaryReady()).toBe(false);
  expect(await securityBoundaryReady()).toBe(false);
  expect(probe).toHaveBeenCalledTimes(1);
  vi.setSystemTime(new Date("2026-01-01T00:00:06Z"));
  expect(await securityBoundaryReady()).toBe(true);
  expect(probe).toHaveBeenCalledTimes(2);
});
it("fails closed on permission/network errors and allows a clean retry", async () => {
  probe
    .mockResolvedValueOnce({ error: { code: "42501" } })
    .mockResolvedValue({ error: null });
  const { securityBoundaryReady } = await import("../src/lib/server/db");
  await expect(securityBoundaryReady()).rejects.toThrow("SETUP_REQUIRED");
  expect(await securityBoundaryReady()).toBe(true);
});
