import fs from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { decodePinHash, encodePinHash } from "../src/lib/domain/pin-hash.mjs";
try {
  const file = ".env.local";
  const stat = await fs.lstat(file);
  if (!stat.isFile()) throw Error("Arquivo local inválido.");
  const content = await fs.readFile(file, "utf8");
  const current = content
    .match(/^PIN_HASH=(.*)$/m)?.[1]
    ?.trim()
    .replace(/^['"]|['"]$/g, "");
  if (!current) {
    console.log(
      "PIN ainda não definido. Use o primeiro acesso protegido na tela de login.",
    );
  } else {
    const portable = encodePinHash(decodePinHash(current));
    if (current === portable)
      console.log("Hash já está no formato portável. Nada foi alterado.");
    else {
      const temp = file + ".normalize-" + randomUUID() + ".tmp";
      try {
        await fs.writeFile(
          temp,
          content.replace(/^PIN_HASH=.*$/m, () => `PIN_HASH=${portable}`),
          { mode: 0o600, flag: "wx" },
        );
        await fs.rename(temp, file);
      } finally {
        await fs.unlink(temp).catch(() => {});
      }
      console.log(
        "Formato do hash corrigido sem mudar a senha. Nenhum segredo foi exibido.",
      );
    }
  }
} catch {
  console.error(
    "Não foi possível normalizar o hash. Confira a configuração local ou use configure:pin -- --rotate para uma rotação consciente.",
  );
  process.exitCode = 1;
}
