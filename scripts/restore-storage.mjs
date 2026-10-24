import { backupKey, decryptArchive } from "./lib/backup-crypto.mjs";
import WebSocket from "ws";
import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
if (
  process.env.ALLOW_ISOLATED_RESTORE !== "YES" ||
  !process.env.RESTORE_SUPABASE_URL ||
  !process.env.RESTORE_SERVICE_ROLE_KEY
)
  throw Error(
    "Exige destino Supabase isolado: RESTORE_SUPABASE_URL, RESTORE_SERVICE_ROLE_KEY e ALLOW_ISOLATED_RESTORE=YES.",
  );
if (process.env.RESTORE_SUPABASE_URL === process.env.SUPABASE_URL)
  throw Error("Destino não pode coincidir com origem configurada.");
const input = process.argv[2];
const endpoint = new URL(process.env.RESTORE_SUPABASE_URL);
if (
  !["localhost", "127.0.0.1"].includes(endpoint.hostname) &&
  (!process.env.RESTORE_PROJECT_REF ||
    endpoint.hostname !== process.env.RESTORE_PROJECT_REF + ".supabase.co" ||
    process.env.RESTORE_PROJECT_REF === "ecyzjuhryfqqpqoskyth")
)
  throw Error("Destino de restauração não autorizado; produção é bloqueada.");
if (!input) throw Error("Informe a pasta do backup.");
const root = await decryptArchive(
  path.join(input, "backup.enc"),
  await backupKey(),
);
try {
  const manifest = JSON.parse(
    await fs.readFile(path.join(root, "manifest.json"), "utf8"),
  );
  const client = createClient(
    process.env.RESTORE_SUPABASE_URL,
    process.env.RESTORE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false }, realtime: { transport: WebSocket } },
  );
  for (const object of manifest.objects) {
    if (!/^[a-f0-9]{64}$/.test(object.filename))
      throw Error("Manifesto inválido");
    if (
      !["operational-documents", "import-originals"].includes(object.bucket) ||
      typeof object.path !== "string" ||
      object.path.includes("..") ||
      object.path.includes("\\") ||
      object.path.startsWith("/")
    )
      throw Error("Manifesto inválido");
    const bytes = await fs.readFile(
      path.join(root, "objects", object.filename),
    );
    if (createHash("sha256").update(bytes).digest("hex") !== object.sha256)
      throw Error("Hash inválido");
    const { error } = await client.storage
      .from(object.bucket)
      .upload(object.path, bytes, { contentType: object.mime, upsert: false });
    if (error)
      throw Error(
        "Falha de restauração; nenhum objeto existente será sobrescrito.",
      );
  }
  console.log(
    `Objetos restaurados sem sobrescrita: ${manifest.objects.length}. Valide acesso e documentos no destino.`,
  );
} finally {
  await fs.rm(root, { recursive: true, force: true });
}
