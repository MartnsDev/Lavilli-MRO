import { NextRequest, NextResponse } from "next/server";
export function proxy(request: NextRequest) {
  if (
    process.env.VERCEL_ENV === "preview" &&
    process.env.PREVIEW_PROTECTED !== "true"
  )
    return new NextResponse("Serviço indisponível", { status: 503 });
  const nonce = Buffer.from(
    crypto.getRandomValues(new Uint8Array(16)),
  ).toString("base64");
  const dev = process.env.NODE_ENV === "development";
  const expected = process.env.APP_URL ? new URL(process.env.APP_URL) : null;
  const loopback =
    expected && ["localhost", "127.0.0.1", "[::1]"].includes(expected.hostname);
  if (!dev && expected?.protocol !== "https:" && !loopback)
    return new NextResponse("Serviço indisponível", { status: 503 });
  const csp = `default-src 'self'; script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ""}; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; media-src 'self' blob:; connect-src 'self'; worker-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'`;
  const h = new Headers(request.headers);
  h.set("x-nonce", nonce);
  h.set("x-request-id", crypto.randomUUID());
  h.set("Content-Security-Policy", csp);
  const response = NextResponse.next({ request: { headers: h } });
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("X-Request-ID", h.get("x-request-id")!);
  if (expected?.protocol === "https:")
    response.headers.set("Strict-Transport-Security", "max-age=31536000");
  return response;
}
export const config = {
  matcher: ["/((?!_next/static|_next/image|brand/|ocr/v7/|favicon.ico).*)"],
};
