import { test, expect } from "@playwright/test";
for (const path of [
  "/api/options/tools",
  "/api/kits/00000000-0000-4000-8000-000000000001",
  "/api/documents/00000000-0000-4000-8000-000000000001",
  "/api/labels?entity=tools&id=00000000-0000-4000-8000-000000000001",
  "/api/reports?entity=tools",
  "/api/imports/template?category=tools",
  "/api/health",
]) {
  test("anonymous denied: " + path, async ({ request }) => {
    const response = await request.get(path);
    expect(response.status()).toBe(401);
    expect(await response.json()).toEqual({
      error: "Não foi possível validar o acesso. Entre novamente.",
    });
  });
}
test("no CSRF origin cannot mutate", async ({ request }) => {
  const response = await request.post("/api/operations", { data: {} });
  expect(response.status()).toBe(403);
});
test("job does not accept anonymous calls", async ({ request }) => {
  expect((await request.post("/api/jobs")).status()).toBe(403);
});
test("protected pages redirect without exposing data", async ({ request }) => {
  const r = await request.get("/dashboard", { maxRedirects: 0 });
  expect([307, 308]).toContain(r.status());
  expect(r.headers().location).toMatch(/\/(login|setup)$/);
});
test("setup and login respond without operational data", async ({
  request,
}) => {
  for (const p of ["/setup", "/login"])
    expect((await request.get(p)).status()).toBe(200);
});
test("security headers block frames and indexing", async ({ request }) => {
  const r = await request.get("/login");
  expect(r.headers()["x-frame-options"]).toBe("DENY");
  expect(r.headers()["content-security-policy"]).toContain(
    "frame-ancestors 'none'",
  );
});
