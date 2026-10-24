import { createClient } from "@supabase/supabase-js";
import WebSocket from "ws";
import { createHash } from "node:crypto";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
const id = process.argv[2];
if (!/^[a-f0-9-]{36}$/.test(id || "")) throw Error("Informe UUID da versão");
const client = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false }, realtime: { transport: WebSocket } },
);
const { data: v, error } = await client
  .from("document_versions")
  .select("object_path,sha256")
  .eq("id", id)
  .single();
if (error) throw Error("Versão indisponível");
const { data: file, error: e } = await client.storage
  .from("operational-documents")
  .download(v.object_path);
if (e || !file) throw Error("Objeto indisponível");
const bytes = Buffer.from(await file.arrayBuffer());
const sha = createHash("sha256").update(bytes).digest("hex");
if (sha !== v.sha256) throw Error("Integridade inválida");
const folder = await mkdtemp(join(tmpdir(), "lavilli-scan-"));
let clean = false;
try {
  const path = join(folder, "document");
  await writeFile(path, bytes, { mode: 0o600 });
  try {
    const scanner = process.env.CLAM_SCAN_BIN || "clamscan";
    if (!["clamscan", "clamdscan"].includes(scanner))
      throw Error("Scanner inválido");
    const version = execFileSync(scanner, ["--version"], {
      encoding: "utf8",
      timeout: 10000,
    });
    const signatureDate = Date.parse(
      version.trim().split("/").slice(2).join("/"),
    );
    if (
      !Number.isFinite(signatureDate) ||
      Date.now() - signatureDate > 3 * 86400000
    )
      throw Error("Assinaturas do scanner precisam ser atualizadas");
    execFileSync(
      scanner,
      [
        "--no-summary",
        ...(scanner === "clamscan" ? ["--fail-if-cvd-older-than=3"] : []),
        path,
      ],
      {
        stdio: "ignore",
        timeout: 30000,
      },
    );
    clean = true;
  } catch (e) {
    if (e.status !== 1)
      throw Error("Scanner indisponível: documento continua pendente");
  }
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
} finally {
  await rm(folder, { recursive: true, force: true });
}
