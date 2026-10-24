import fs from "node:fs";
import { randomBytes, createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import WebSocket from "ws";
const purpose = process.argv.includes("--admin") ? "admin" : "enroll";
const ref = new URL(process.env.SUPABASE_URL || "https://invalid").hostname;
if (
  !["ecyzjuhryfqqpqoskyth.supabase.co", "localhost", "127.0.0.1"].includes(ref)
)
  throw Error("Projeto não autorizado");
const code = randomBytes(32).toString("base64url");
const client = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false }, realtime: { transport: WebSocket } },
);
const { data, error } = await client.rpc("issue_device_grant", {
  p_hash: createHash("sha256").update(code).digest("hex"),
  p_purpose: purpose,
});
if (error) throw Error("Não foi possível emitir a autorização");
fs.mkdirSync(".local-secrets", { recursive: true, mode: 0o700 });
const file = `.local-secrets/${purpose}-${data}.txt`;
fs.writeFileSync(file, code + "\n", { mode: 0o600, flag: "wx" });
console.log(
  `Autorização de uso único salva em ${file}. Expira em 15 minutos. Entregue somente por canal administrativo seguro; não compartilhe por chat ou logs.`,
);
