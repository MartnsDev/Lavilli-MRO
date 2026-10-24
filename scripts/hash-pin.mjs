import { encodePinHash } from "../src/lib/domain/pin-hash.mjs";
import { hash } from "@node-rs/argon2";
// Read from hidden stdin: read -rs PIN; printf %s "$PIN" | npm run pin:hash --silent; unset PIN
let value = "";
for await (const chunk of process.stdin) value += chunk;
value = value.trim();
if (!/^\d{4}$/.test(value)) throw Error("Informe quatro dígitos por stdin.");
console.log(
  encodePinHash(
    await hash(value, {
      algorithm: 2,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 1,
    }),
  ),
);
