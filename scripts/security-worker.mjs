// Trusted local worker. No private file is sent to an external scanner service.
import { createClient } from "@supabase/supabase-js";
import WebSocket from "ws";
import { execFileSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { userInfo } from "node:os";
import { scannerSignatureDate } from "./lib/document-scanner.mjs";
const endpoint = new URL(process.env.SUPABASE_URL || "invalid");
if (
  !["ecyzjuhryfqqpqoskyth.supabase.co", "localhost", "127.0.0.1"].includes(
    endpoint.hostname,
  )
)
  throw Error("Unexpected scanner project");
if (
  endpoint.hostname.endsWith(".supabase.co") &&
  endpoint.protocol !== "https:"
)
  throw Error("HTTPS required");
const database = process.env.CLAM_DATABASE_DIR || "/tmp/lavilli-clamav-camera";
if (!/^\/[\w/.-]+$/.test(database))
  throw Error("Configure an absolute scanner database path without spaces");
process.env.CLAM_DATABASE_DIR = database;
await mkdir(".local-secrets", { recursive: true, mode: 0o700 });
const client = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false }, realtime: { transport: WebSocket } },
);
let running = true,
  refreshAt = 0;
process.on("SIGINT", () => {
  running = false;
});
process.on("SIGTERM", () => {
  running = false;
});
async function cycle() {
  if (Date.now() > refreshAt) {
    refreshAt = Date.now() + 12 * 3600000;
    let fresh = false;
    try {
      fresh = Date.now() - scannerSignatureDate() < 86400000;
    } catch {}
    if (!fresh) {
      await mkdir(database, { recursive: true, mode: 0o700 });
      const config = "/tmp/lavilli-freshclam-worker.conf";
      await writeFile(
        config,
        `DatabaseDirectory ${database}\nDatabaseMirror database.clamav.net\nDatabaseOwner ${userInfo().username}\nMaxAttempts 1\nConnectTimeout 15\nReceiveTimeout 60\n`,
        { mode: 0o600 },
      );
      execFileSync("freshclam", ["--config-file=" + config], {
        stdio: "ignore",
        timeout: 300000,
      });
    }
  }
  scannerSignatureDate();
  const { data, error } = await client
    .from("document_versions")
    .select("id")
    .eq("scan_status", "pending")
    .order("created_at")
    .limit(5);
  if (error) throw Error("Scanner metadata unavailable");
  let completed = 0,
    failed = 0;
  for (const version of data) {
    if (!running) break;
    try {
      execFileSync(
        process.execPath,
        ["scripts/scan-document.mjs", version.id],
        {
          env: process.env,
          stdio: "ignore",
          timeout: 90000,
        },
      );
      completed++;
    } catch {
      failed++;
    }
  }
  const status = {
    checkedAt: new Date().toISOString(),
    ready: failed === 0,
    pendingInBatch: data.length,
    completed,
    failed,
  };
  await writeFile(
    ".local-secrets/scanner-status.json",
    JSON.stringify(status),
    { mode: 0o600 },
  );
  console.log(JSON.stringify(status));
}
do {
  try {
    await cycle();
  } catch {
    const status = {
      checkedAt: new Date().toISOString(),
      ready: false,
      error: "Scanner unavailable; files stay pending",
    };
    await writeFile(
      ".local-secrets/scanner-status.json",
      JSON.stringify(status),
      { mode: 0o600 },
    );
    console.log(JSON.stringify(status));
  }
  if (process.argv.includes("--once") || !running) break;
  await new Promise((resolve) => {
    const finish = () => {
      clearTimeout(timer);
      process.removeListener("SIGTERM", finish);
      process.removeListener("SIGINT", finish);
      resolve();
    };
    const timer = setTimeout(finish, 30000);
    process.once("SIGTERM", finish);
    process.once("SIGINT", finish);
  });
} while (running);
