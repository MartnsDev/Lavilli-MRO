import WebSocket from "ws";
import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { createClient } from "@supabase/supabase-js";
const target = process.argv[2];
if (
  !target ||
  !process.env.DATABASE_URL ||
  !process.env.SUPABASE_URL ||
  !process.env.SUPABASE_SERVICE_ROLE_KEY
)
  throw Error(
    "Use: node --env-file=.env.local scripts/backup.mjs /destino/novo. Configure DATABASE_URL e Supabase.",
  );
await fs.mkdir(target, { mode: 0o700, recursive: false });
await new Promise((resolve, reject) => {
  const child = spawn(
    "pg_dump",
    [
      "--format=custom",
      "--no-owner",
      "--schema=public",
      "--file",
      path.join(target, "database.dump"),
    ],
    {
      env: { ...process.env, PGDATABASE: process.env.DATABASE_URL },
      stdio: ["ignore", "ignore", "inherit"],
    },
  );
  child.on("error", reject);
  child.on("exit", (code) =>
    code === 0 ? resolve() : reject(Error("pg_dump failed")),
  );
});
await fs.chmod(path.join(target, "database.dump"), 0o600);
const client = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false }, realtime: { transport: WebSocket } },
);
const bucket = "operational-documents",
  objects = [];
await fs.mkdir(path.join(target, "objects"), { mode: 0o700 });
async function walk(prefix = "") {
  let offset = 0;
  for (;;) {
    const { data, error } = await client.storage.from(bucket).list(prefix, {
      limit: 100,
      offset,
      sortBy: { column: "name", order: "asc" },
    });
    if (error) throw Error("Storage listing failed");
    for (const entry of data) {
      const objectPath = prefix ? prefix + "/" + entry.name : entry.name;
      if (!entry.id) {
        await walk(objectPath);
        continue;
      }
      const { data: file, error: downloadError } = await client.storage
        .from(bucket)
        .download(objectPath);
      if (downloadError) throw Error("Storage download failed");
      const bytes = Buffer.from(await file.arrayBuffer());
      const sha256 = createHash("sha256").update(bytes).digest("hex");
      const filename = createHash("sha256").update(objectPath).digest("hex");
      await fs.writeFile(path.join(target, "objects", filename), bytes, {
        mode: 0o600,
      });
      objects.push({
        bucket,
        path: objectPath,
        filename,
        sha256,
        size: bytes.length,
        mime: file.type,
      });
    }
    if (data.length < 100) break;
    offset += 100;
  }
}
await walk();
await fs.writeFile(
  path.join(target, "manifest.json"),
  JSON.stringify({ generated_at: new Date().toISOString(), objects }, null, 2),
  { mode: 0o600 },
);
console.log(
  JSON.stringify({
    status: "backup_created",
    objects: objects.length,
    restore_test: "required",
  }),
);
