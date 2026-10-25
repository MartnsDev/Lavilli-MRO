import type { NextConfig } from "next";
const config: NextConfig = {
  poweredByHeader: false,
  distDir: process.env.NEXT_BUILD_DIR || ".next",
  devIndicators: false,
  experimental: { useTypeScriptCli: false },
  serverExternalPackages: ["@node-rs/argon2"],
  async headers() {
    return [
      {
        source: "/ocr/v7/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'none'; script-src 'self' 'wasm-unsafe-eval'; connect-src 'self'; worker-src 'self'",
          },
          { key: "Cache-Control", value: "public, max-age=86400" },
        ],
      },
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "same-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};
export default config;
