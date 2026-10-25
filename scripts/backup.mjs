import { backupKey, encryptArchive } from "./lib/backup-crypto.mjs";
import { tmpdir } from "node:os";
import WebSocket from "ws";
import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { createClient } from "@supabase/supabase-js";
const destination = process.argv[2];
const key = await backupKey();
if (
  !destination ||
  !process.env.DATABASE_URL ||
  !process.env.SUPABASE_URL ||
  !process.env.SUPABASE_SERVICE_ROLE_KEY
)
  throw Error(
    "Use: node --env-file=.env.local scripts/backup.mjs /destino/novo. Configure DATABASE_URL e Supabase.",
  );
const connection = new URL(process.env.DATABASE_URL);
if (!["postgres:", "postgresql:"].includes(connection.protocol))
  throw Error("DATABASE_URL inválida");
const target = await fs.mkdtemp(path.join(tmpdir(), "lavilli-backup-"));
try {
  await fs.mkdir(destination, { mode: 0o700, recursive: false });
  await new Promise((resolve, reject) => {
    const child = spawn(
      process.env.PG_DUMP_BIN || "pg_dump",
      [
        "--format=custom",
        "--no-owner",
        "--schema=public",
        "--schema=private_security",
        "--file",
        path.join(target, "database.dump"),
      ],
      {
        env: {
          ...process.env,
          PGHOST: connection.hostname,
          PGPORT: connection.port || "5432",
          PGUSER: decodeURIComponent(connection.username),
          PGPASSWORD: decodeURIComponent(connection.password),
          PGDATABASE: decodeURIComponent(connection.pathname.slice(1)),
          PGSSLMODE:
            connection.searchParams.get("sslmode") ||
            process.env.PGSSLMODE ||
            (["localhost", "127.0.0.1"].includes(connection.hostname)
              ? "disable"
              : "require"),
        },
        stdio: ["ignore", "ignore", "ignore"],
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
  const objects = [];
  const { data: buckets, error: bucketError } =
    await client.storage.listBuckets();
  if (bucketError) throw Error("Storage catalog unavailable");
  let bucket;
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
        const filename = createHash("sha256")
          .update(bucket + "/" + objectPath)
          .digest("hex");
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
  for (const name of ["operational-documents", "import-originals"]) {
    if (!(buckets || []).some((existing) => existing.id === name)) continue;
    bucket = name;
    await walk();
  }
  await fs.writeFile(
    path.join(target, "manifest.json"),
    JSON.stringify(
      {
        generated_at: new Date().toISOString(),
        buckets: (buckets || [])
          .filter((b) =>
            ["operational-documents", "import-originals"].includes(b.id),
          )
          .map((b) => ({
            id: b.id,
            public: b.public,
            file_size_limit: b.file_size_limit,
            allowed_mime_types: b.allowed_mime_types,
          })),
        objects,
      },
      null,
      2,
    ),
    { mode: 0o600 },
  );
  await encryptArchive(target, path.join(destination, "backup.enc"), key);
  console.log(
    JSON.stringify({
      status: "encrypted_backup_created",
      objects: objects.length,
      restore_test: "required",
    }),
  );
} finally {
  await fs.rm(target, { recursive: true, force: true });
}
