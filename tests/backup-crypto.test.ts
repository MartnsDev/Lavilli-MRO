import { it, expect } from "vitest";
import { mkdtemp, mkdir, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
import {
  encryptArchive,
  decryptArchive,
} from "../scripts/lib/backup-crypto.mjs";
it("authenticates encrypted backups before extraction and refuses tampering", async () => {
  const root = await mkdtemp(join(tmpdir(), "lavilli-backup-test-"));
  const source = join(root, "source");
  await mkdir(source);
  await mkdir(join(source, "objects"));
  await writeFile(join(source, "manifest.json"), "{}");
  await writeFile(join(source, "database.dump"), "test-database-only");
  const key = randomBytes(32);
  const output = join(root, "backup.enc");
  try {
    await encryptArchive(source, output, key);
    const data = await readFile(output);
    expect(data.includes(Buffer.from("test-database-only"))).toBe(false);
    const restored = await decryptArchive(output, key);
    expect(await readFile(join(restored, "database.dump"), "utf8")).toBe(
      "test-database-only",
    );
    await rm(restored, { recursive: true, force: true });
    data[data.length - 1] ^= 1;
    await writeFile(output, data);
    await expect(decryptArchive(output, key)).rejects.toThrow();
    await expect(decryptArchive(output, randomBytes(32))).rejects.toThrow();
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
