import { decodePinHash } from "../src/lib/domain/pin-hash.mjs";
const required = [
  "APP_URL",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "PIN_HASH",
  "SESSION_SECRET",
];
for (const name of required)
  if (!process.env[name]) throw Error(`Variável ausente: ${name}`);
if (process.env.SESSION_SECRET.length < 32)
  throw Error("SESSION_SECRET precisa ter ao menos 32 caracteres aleatórios.");
decodePinHash(process.env.PIN_HASH);
if (
  process.env.NODE_ENV === "production" &&
  !process.env.APP_URL.startsWith("https://")
)
  throw Error("Produção exige APP_URL HTTPS.");
if (
  process.env.DEVICE_BOOTSTRAP_HASH &&
  !/^[a-f0-9]{64}$/.test(process.env.DEVICE_BOOTSTRAP_HASH)
)
  throw Error("DEVICE_BOOTSTRAP_HASH inválido.");
if (process.env.EMAIL_MODE === "resend")
  for (const name of ["RESEND_API_KEY", "EMAIL_FROM", "AUTHORIZED_EMAIL"])
    if (!process.env[name]) throw Error(`Variável ausente: ${name}`);
console.log(
  "Formato das variáveis validado. Conectividade, migrations e entrega de e-mail ainda precisam ser verificadas.",
);
