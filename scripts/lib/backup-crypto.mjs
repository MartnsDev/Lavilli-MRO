import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import {
  readFile,
  stat,
  appendFile,
  open,
  mkdtemp,
  rm,
} from "node:fs/promises";
import { pipeline } from "node:stream/promises";
import { spawn, execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
const magic = Buffer.from("LAVBAK01");
export async function backupKey() {
  const path = process.env.BACKUP_KEY_FILE;
  if (!path)
    throw Error("Configure BACKUP_KEY_FILE privado, fora da pasta de backup.");
  const info = await stat(path);
  if (info.mode & 0o077) throw Error("Chave de backup deve ter permissão 0600");
  const s = (await readFile(path, "utf8")).trim();
  if (!/^[a-f0-9]{64}$/.test(s)) throw Error("Chave de backup inválida");
  return Buffer.from(s, "hex");
}
export async function encryptArchive(folder, output, key) {
  const iv = randomBytes(12),
    header = Buffer.concat([magic, iv]);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(header);
  const out = createWriteStream(output, { flags: "wx", mode: 0o600 });
  out.write(header);
  const tar = spawn("tar", ["-czf", "-", "-C", folder, "."], {
    stdio: ["ignore", "pipe", "ignore"],
  });
  const done = new Promise((resolve, reject) => {
    tar.on("exit", (c) =>
      c === 0 ? resolve() : reject(Error("Falha ao empacotar backup")),
    );
    tar.on("error", reject);
  });
  await Promise.all([pipeline(tar.stdout, cipher, out), done]);
  await appendFile(output, cipher.getAuthTag());
}
export async function decryptArchive(file, key) {
  const size = (await stat(file)).size;
  if (size < 36) throw Error("Backup inválido");
  const handle = await open(file, "r");
  const header = Buffer.alloc(20),
    tag = Buffer.alloc(16);
  try {
    await handle.read(header, 0, 20, 0);
    await handle.read(tag, 0, 16, size - 16);
  } finally {
    await handle.close();
  }
  if (!header.subarray(0, 8).equals(magic))
    throw Error("Formato de backup inválido");
  const dir = await mkdtemp(join(tmpdir(), "lavilli-restore-"));
  const archive = join(dir, "archive.tar.gz");
  try {
    const decipher = createDecipheriv("aes-256-gcm", key, header.subarray(8));
    decipher.setAAD(header);
    decipher.setAuthTag(tag);
    await pipeline(
      createReadStream(file, { start: 20, end: size - 17 }),
      decipher,
      createWriteStream(archive, { flags: "wx", mode: 0o600 }),
    );
    const types = execFileSync("tar", ["-tvzf", archive], {
      encoding: "utf8",
      maxBuffer: 10000000,
    })
      .split("\n")
      .filter(Boolean);
    if (types.some((l) => !["-", "d"].includes(l[0])))
      throw Error("Tipo de arquivo inválido");
    const paths = execFileSync("tar", ["-tzf", archive], {
      encoding: "utf8",
      maxBuffer: 10000000,
    })
      .split("\n")
      .filter(Boolean);
    if (
      paths.some(
        (p) =>
          !/^\.\/(?:$|database\.dump$|manifest\.json$|objects\/$|objects\/[a-f0-9]{64}$)/.test(
            p,
          ),
      )
    )
      throw Error("Caminho inválido no backup");
    execFileSync(
      "tar",
      ["-xzf", archive, "--no-same-owner", "--no-same-permissions", "-C", dir],
      { stdio: "ignore" },
    );
    return dir;
  } catch {
    await rm(dir, { recursive: true, force: true });
    throw Error("Backup inválido ou autenticação criptográfica falhou");
  }
}
