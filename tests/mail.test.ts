import { afterEach, describe, expect, it, vi } from "vitest";
import { sendMail } from "../src/lib/server/mail";
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
describe("transactional email transport", () => {
  it("does not contact the provider while disabled", async () => {
    vi.stubEnv("EMAIL_MODE", "disabled");
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    await expect(
      sendMail("test@example.invalid", "Teste", "Texto", "test-key"),
    ).rejects.toThrow("EMAIL_DISABLED");
    expect(fetch).not.toHaveBeenCalled();
  });
  it("sends recipient, content and idempotency key to the configured provider", async () => {
    vi.stubEnv("EMAIL_MODE", "resend");
    vi.stubEnv("RESEND_API_KEY", "test-only-key");
    vi.stubEnv("EMAIL_FROM", "hangar@example.invalid");
    const fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: "provider-test-id" }), {
        status: 200,
      }),
    );
    vi.stubGlobal("fetch", fetch);
    expect(
      await sendMail(
        "test@example.invalid",
        "Alerta",
        "Verificar estoque",
        "dedup-test",
      ),
    ).toBe("provider-test-id");
    const [url, request] = fetch.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    expect(request.headers["Idempotency-Key"]).toBe("dedup-test");
    expect(JSON.parse(request.body)).toMatchObject({
      to: ["test@example.invalid"],
      from: "hangar@example.invalid",
      subject: "Alerta",
      text: "Verificar estoque",
    });
  });
  it.each([429, 500, 503])(
    "propagates provider failure %i for retry",
    async (status) => {
      vi.stubEnv("EMAIL_MODE", "resend");
      vi.stubEnv("RESEND_API_KEY", "test-only-key");
      vi.stubEnv("EMAIL_FROM", "hangar@example.invalid");
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(new Response("{}", { status })),
      );
      await expect(
        sendMail("test@example.invalid", "Teste", "Texto", "test-key"),
      ).rejects.toThrow("EMAIL_FAILED");
    },
  );
});
