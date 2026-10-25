import { beforeEach, describe, expect, it, vi } from "vitest";

const fake = vi.hoisted(() => ({
  session: vi.fn(),
  sameOrigin: vi.fn(),
  limit: vi.fn(),
  ready: vi.fn(),
  db: vi.fn(),
  rpc: vi.fn(),
}));
vi.mock("../src/lib/server/auth", () => ({
  session: fake.session,
  sameOrigin: fake.sameOrigin,
  limit: fake.limit,
}));
vi.mock("../src/lib/server/db", () => ({
  securityBoundaryReady: fake.ready,
  db: fake.db,
  rpc: fake.rpc,
}));
vi.mock("../src/lib/server/audit", () => ({ audit: vi.fn() }));

beforeEach(() => {
  vi.clearAllMocks();
  fake.session
    .mockReset()
    .mockResolvedValue({ id: "session", device_id: "device" });
  fake.ready.mockReset().mockResolvedValue(false);
});

describe("documents on an existing database without the security migration", () => {
  it("refuses upload clearly before parsing or storing a file", async () => {
    const { POST } = await import("../src/app/api/documents/upload/route");
    const result = await POST(
      new Request("https://example.invalid/api/documents/upload", {
        method: "POST",
      }),
    );
    expect(result.status).toBe(503);
    expect((await result.json()).error).toContain(
      "ainda não estão disponíveis",
    );
    expect(result.headers.get("cache-control")).toContain("no-store");
    expect(fake.db).not.toHaveBeenCalled();
    expect(fake.rpc).not.toHaveBeenCalled();
  });

  it("does not misreport an unavailable download as a missing document", async () => {
    const { GET } = await import("../src/app/api/documents/[id]/route");
    const result = await GET(
      new Request("https://example.invalid/api/documents/test"),
      {
        params: Promise.resolve({ id: "00000000-0000-4000-8000-000000000001" }),
      },
    );
    expect(result.status).toBe(503);
    expect(fake.db).not.toHaveBeenCalled();
    expect(fake.rpc).not.toHaveBeenCalled();
  });

  it("keeps authentication mandatory before revealing document availability", async () => {
    fake.session.mockRejectedValue(Error("UNAUTHORIZED"));
    const { POST } = await import("../src/app/api/documents/upload/route");
    const result = await POST(
      new Request("https://example.invalid/api/documents/upload", {
        method: "POST",
      }),
    );
    expect(result.status).toBe(401);
    expect(fake.ready).not.toHaveBeenCalled();
    expect(fake.db).not.toHaveBeenCalled();
  });
});
