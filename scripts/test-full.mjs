// Runs only against the local Supabase stack; never loads production credentials.
import { spawn, execFileSync } from "node:child_process";
import { randomBytes, randomInt } from "node:crypto";
import { hash } from "@node-rs/argon2";
import { encodePinHash } from "../src/lib/domain/pin-hash.mjs";
const cli = ["--yes", "supabase@2.122.0"];
const status = JSON.parse(
  execFileSync("npx", [...cli, "status", "--output", "json"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }),
);
const url = new URL(status.API_URL);
if (!["127.0.0.1", "localhost"].includes(url.hostname))
  throw Error("Only a local Supabase is permitted");
const pin = String(randomInt(1000, 10000));
const env = {
  ...process.env,
  SUPABASE_URL: status.API_URL,
  SUPABASE_SERVICE_ROLE_KEY: status.SERVICE_ROLE_KEY,
  NEXT_PUBLIC_SUPABASE_URL: status.API_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: status.ANON_KEY,
  SESSION_SECRET: randomBytes(32).toString("hex"),
  CRON_SECRET: randomBytes(32).toString("hex"),
  PIN_HASH: encodePinHash(await hash(pin, { algorithm: 2 })),
  APP_URL: "http://localhost:3100",
  EMAIL_MODE: "disabled",
  RESEND_API_KEY: "",
  EMAIL_FROM: "",
  AUTHORIZED_EMAIL: "",
  DEVICE_BOOTSTRAP_HASH: "",
  NEXT_BUILD_DIR: ".next-verification",
  TEST_PIN: pin,
  TEST_JWT_SECRET: status.JWT_SECRET,
  TEST_SUPABASE_ANON_KEY: status.ANON_KEY,
  TEST_BASE_URL: "http://localhost:3100",
  FULL_VERIFICATION: "local-only",
  APP_MODE: "test",
  PLAYWRIGHT_CHANNEL: process.env.PLAYWRIGHT_CHANNEL || "chrome",
};
async function run(cmd, args) {
  await new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { env, stdio: "inherit" });
    p.on("exit", (code) =>
      code === 0 ? resolve() : reject(Error(cmd + " exited " + code)),
    );
    p.on("error", reject);
  });
}
if (process.env.VERIFICATION_REUSE_BUILD === "1") {
  const { statSync, readdirSync } = await import("node:fs");
  const builtAt = statSync(".next-verification/BUILD_ID").mtimeMs;
  function newest(dir) {
    return Math.max(
      ...readdirSync(dir, { withFileTypes: true }).map((f) =>
        f.isDirectory()
          ? newest(dir + "/" + f.name)
          : statSync(dir + "/" + f.name).mtimeMs,
      ),
    );
  }
  if (
    Math.max(
      newest("src"),
      statSync("next.config.ts").mtimeMs,
      statSync("package-lock.json").mtimeMs,
    ) > builtAt
  )
    throw Error("Sources changed: rebuild verification first");
} else await run("npm", ["run", "build"]);
const server = spawn(
  "node",
  [
    "node_modules/next/dist/bin/next",
    "start",
    "--hostname",
    "127.0.0.1",
    "--port",
    "3100",
  ],
  { env, stdio: ["ignore", "pipe", "pipe"] },
);
let logs = "";
for (const s of [server.stdout, server.stderr])
  s.on("data", (b) => {
    logs = (logs + b.toString()).slice(-12000);
  });
try {
  let ready = false;
  for (let i = 0; i < 120; i++) {
    if (server.exitCode !== null)
      throw Error("Verification server exited before startup: " + logs);
    try {
      if (!logs.includes("Ready in")) {
        await new Promise((r) => setTimeout(r, 500));
        continue;
      }
      const r = await fetch(env.APP_URL + "/api/auth/status");
      if (r.ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  if (!ready) throw Error("Verification server did not start: " + logs);
  await run("npx", [
    "playwright",
    "test",
    "--config",
    "playwright.full.config.ts",
    ...process.argv.slice(2),
  ]);
} finally {
  server.kill("SIGTERM");
}
