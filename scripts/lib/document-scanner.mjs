import { execFileSync } from "node:child_process";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
export function scannerOptions(env = process.env) {
  const bin = env.CLAM_SCAN_BIN || "clamscan";
  if (!["clamscan", "clamdscan"].includes(bin)) throw Error("Scanner inválido");
  const database =
    bin === "clamscan" && env.CLAM_DATABASE_DIR
      ? ["--database=" + env.CLAM_DATABASE_DIR]
      : [];
  return { bin, database };
}
export function scannerSignatureDate(env = process.env) {
  const { bin, database } = scannerOptions(env);
  const version = execFileSync(bin, [...database, "--version"], {
    encoding: "utf8",
    timeout: 10000,
  });
  const date = Date.parse(version.trim().split("/").slice(2).join("/"));
  if (
    !Number.isFinite(date) ||
    Date.now() - date > 3 * 86400000 ||
    date > Date.now() + 86400000
  )
    throw Error("Assinaturas do scanner precisam ser atualizadas");
  return date;
}
export async function scanLocalBytes(bytes, env = process.env) {
  if (!bytes.length || bytes.length > 4194304) throw Error("Arquivo inválido");
  scannerSignatureDate(env);
  const { bin, database } = scannerOptions(env);
  const folder = await mkdtemp(join(tmpdir(), "lavilli-scan-"));
  try {
    const file = join(folder, "document");
    await writeFile(file, bytes, { mode: 0o600 });
    try {
      execFileSync(
        bin,
        [
          ...database,
          "--no-summary",
          ...(bin === "clamscan"
            ? [
                "--fail-if-cvd-older-than=3",
                "--alert-exceeds-max=yes",
                "--max-filesize=8M",
                "--max-scansize=64M",
              ]
            : []),
          file,
        ],
        { stdio: "ignore", timeout: 60000 },
      );
      return true;
    } catch (error) {
      if (error.status === 1) return false;
      throw Error("Scanner indisponível: documento continua pendente");
    }
  } finally {
    await rm(folder, { recursive: true, force: true });
  }
}
