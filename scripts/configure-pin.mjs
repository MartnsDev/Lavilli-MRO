import fs from "node:fs";
import { hash } from "@node-rs/argon2";

// Run only in the operator's own terminal. Never supply the PIN as an argument.
if (!process.stdin.isTTY || !process.stdout.isTTY) {
  console.error(
    "Execute npm run configure:pin diretamente no seu terminal. A senha não é aceita por argumentos ou pelo chat.",
  );
  process.exit(1);
}
function readMasked(prompt) {
  return new Promise((resolve, reject) => {
    let value = "";
    process.stdout.write(prompt);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    function finish(error) {
      process.stdin.off("data", onData);
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdout.write("\n");
      if (error) reject(error);
      else resolve(value);
    }
    function onData(chunk) {
      for (const character of chunk.toString("utf8")) {
        if (character === "\u0003" || character === "\u0004") {
          finish(new Error("Configuração cancelada."));
          return;
        }
        if (character === "\r" || character === "\n") {
          finish();
          return;
        }
        if (character === "\u007f" || character === "\b") {
          if (value.length) {
            value = value.slice(0, -1);
            process.stdout.write("\b \b");
          }
        } else if (/^[0-9]$/.test(character) && value.length < 4) {
          value += character;
          process.stdout.write("•");
        }
      }
    }
    process.stdin.on("data", onData);
  });
}
try {
  if (!fs.existsSync(".env.local"))
    throw new Error(
      "Arquivo .env.local não encontrado. Configure o ambiente primeiro.",
    );
  let content = fs.readFileSync(".env.local", "utf8");
  if (/^PIN_HASH=.+$/m.test(content) && !process.argv.includes("--rotate"))
    throw new Error(
      "Senha já configurada. Para rotação consciente, use npm run configure:pin -- --rotate.",
    );
  let pin = await readMasked("Senha geral (4 dígitos): ");
  let repeated = await readMasked("Confirme a senha: ");
  if (!/^[0-9]{4}$/.test(pin) || pin !== repeated)
    throw new Error(
      "As entradas devem conter quatro dígitos iguais entre si. Nada foi alterado.",
    );
  const encoded = await hash(pin, {
    algorithm: 2,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 1,
  });
  pin = "";
  repeated = "";
  content = /^PIN_HASH=.*$/m.test(content)
    ? content.replace(/^PIN_HASH=.*$/m, () => `PIN_HASH=${encoded}`)
    : content + `\nPIN_HASH=${encoded}\n`;
  fs.writeFileSync(".env.local", content, { mode: 0o600 });
  fs.chmodSync(".env.local", 0o600);
  console.log(
    "Senha configurada por hash Argon2id. Nenhuma senha foi exibida ou gravada em texto puro.",
  );
} catch (error) {
  console.error(
    error instanceof Error ? error.message : "Falha na configuração.",
  );
  process.exitCode = 1;
}
