import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
const root = process.argv[2];
if (!root) throw Error("Informe a pasta do backup.");
const manifest = JSON.parse(
  await fs.readFile(path.join(root, "manifest.json"), "utf8"),
);
for (const object of manifest.objects) {
  if (!/^[a-f0-9]{64}$/.test(object.filename))
    throw Error("Manifesto inválido");
  const bytes = await fs.readFile(path.join(root, "objects", object.filename));
  if (
    createHash("sha256").update(bytes).digest("hex") !== object.sha256 ||
    bytes.length !== object.size
  )
    throw Error("Falha de integridade do objeto");
}
await fs.access(path.join(root, "database.dump"));
console.log(
  `Integridade dos ${manifest.objects.length} objetos verificada. Restauração do banco ainda deve ser testada.`,
);
