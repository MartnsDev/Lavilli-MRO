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
const root = process.argv[2];
if (!root) throw Error("Informe a pasta do backup.");
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
  const bytes = await fs.readFile(path.join(root, "objects", object.filename));
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
