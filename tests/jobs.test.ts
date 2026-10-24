import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const fake = vi.hoisted(() => ({
  rpc: vi.fn(),
  send: vi.fn(),
  update: vi.fn(),
  audit: vi.fn(),
  active: true,
}));
vi.mock("../src/lib/server/mail", () => ({ sendMail: fake.send }));
vi.mock("../src/lib/server/db", () => ({
  infrastructureConfigured: () => false,
  rpc: fake.rpc,
  db: () => ({
    from: (table: string) => {
      if (table === "email_deliveries")
        return {
          update: (patch: unknown) => ({
            eq: async () => {
              fake.update(patch);
              return { error: null };
            },
          }),
        };
      if (table === "audit_events")
        return {
          insert: async (v: unknown) => {
            fake.audit(v);
            return { error: null };
          },
        };
      return {
        select: () => ({
          eq: () => ({
            single: async () => ({
              data:
                table === "alerts"
                  ? {
                      name: "Estoque baixo",
                      entity: "part_catalog",
                      entity_id: "test",
                      status: "open",
                    }
                  : { email: "test@example.invalid", active: fake.active },
              error: null,
            }),
          }),
        }),
      };
    },
  }),
}));
import { POST } from "../src/app/api/jobs/route";
const secret = "test-cron-secret-".repeat(3);
const call = (auth = "Bearer " + secret) =>
  POST(
    new Request("http://localhost:3100/api/jobs", {
      method: "POST",
      headers: { authorization: auth },
    }),
  );
beforeEach(() => {
  vi.stubEnv("CRON_SECRET", secret);
  vi.stubEnv("APP_URL", "https://example.invalid");
  vi.stubEnv("EMAIL_MODE", "resend");
  fake.active = true;
  fake.send.mockReset().mockResolvedValue("provider-test-id");
  fake.rpc.mockReset().mockImplementation(async (name: string) =>
    name === "generate_alerts"
      ? 1
      : [
          {
            id: "queue-test",
            alert_id: "alert-test",
            recipient_id: "recipient-test",
            attempts: 2,
            dedup_key: "dedup-test",
          },
        ],
  );
  fake.update.mockClear();
  fake.audit.mockClear();
});
afterEach(() => vi.unstubAllEnvs());
describe("scheduled alert worker", () => {
  it("rejects missing or wrong scheduler credentials before any work", async () => {
    for (const auth of ["", "Bearer wrong"])
      expect((await call(auth)).status).toBe(403);
    expect(fake.rpc).not.toHaveBeenCalled();
  });
  it("generates alerts without claiming email when email is disabled", async () => {
    vi.stubEnv("EMAIL_MODE", "disabled");
    const r = await call();
    expect(await r.json()).toMatchObject({ alerts: 1, email: "disabled" });
    expect(fake.rpc).toHaveBeenCalledTimes(2);
    expect(fake.send).not.toHaveBeenCalled();
  });
  it("records delivery success and an audit event using the deduplication key", async () => {
    const r = await call();
    expect(await r.json()).toMatchObject({ sent: 1 });
    expect(fake.send.mock.calls[0][3]).toBe("dedup-test");
    expect(fake.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "sent",
        provider_id: "provider-test-id",
        lease_until: null,
      }),
    );
    expect(fake.rpc).toHaveBeenCalledWith(
      "security_event",
      expect.objectContaining({
        p_entity: "email_deliveries",
        p_outcome: "success",
      }),
    );
  });
  it("records a failed attempt with backoff so the queue can retry", async () => {
    fake.send.mockRejectedValue(Error("provider unavailable"));
    const before = Date.now();
    const r = await call();
    expect(await r.json()).toMatchObject({ sent: 0 });
    const patch = fake.update.mock.calls[0][0];
    expect(patch.status).toBe("failed");
    expect(Date.parse(patch.next_attempt_at)).toBeGreaterThanOrEqual(
      before + 240000,
    );
    expect(patch.lease_until).toBeNull();
  });
  it("does not send to inactive recipients", async () => {
    fake.active = false;
    await call();
    expect(fake.send).not.toHaveBeenCalled();
    expect(fake.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: "failed" }),
    );
  });
});

it("denies multibyte forged scheduler credentials without a server error", async () => {
  expect((await call("Bearer " + "é".repeat(secret.length))).status).toBe(403);
});
