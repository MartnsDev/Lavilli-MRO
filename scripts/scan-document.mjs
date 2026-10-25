import { createClient } from "@supabase/supabase-js";
import WebSocket from "ws";
import { createHash } from "node:crypto";
import { scanLocalBytes } from "./lib/document-scanner.mjs";
const id = process.argv[2];
if (!/^[a-f0-9-]{36}$/.test(id || "")) throw Error("Informe UUID da versão");
const client = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false }, realtime: { transport: WebSocket } },
);
const { data: v, error } = await client
  .from("document_versions")
  .select("object_path,sha256,size_bytes,scan_status")
  .eq("id", id)
  .single();
if (error || !v) throw Error("Versão indisponível");
if (v.scan_status !== "pending") throw Error("Versão não está pendente");
if (
  !/^[a-f0-9-]{36}\/[a-f0-9]{64}\/[A-Za-z0-9_-]{43}$/.test(v.object_path) ||
  v.size_bytes < 1 ||
  v.size_bytes > 4194304
)
  throw Error("Metadados de arquivo inválidos");
const { data: file, error: e } = await client.storage
  .from("operational-documents")
  .download(v.object_path);
if (e || !file) throw Error("Objeto indisponível");
const bytes = Buffer.from(await file.arrayBuffer());
const sha = createHash("sha256").update(bytes).digest("hex");
if (sha !== v.sha256 || bytes.length !== v.size_bytes)
  throw Error("Integridade inválida");
const clean = await scanLocalBytes(bytes);
const { error: scanError } = await client.rpc("record_document_scan", {
  p_version: id,
  p_sha: sha,
  p_clean: clean,
});
if (scanError) throw Error("Não foi possível registrar verificação");
console.log(
  clean
    ? "Documento verificado pelo scanner."
    : "Documento bloqueado pelo scanner.",
);
