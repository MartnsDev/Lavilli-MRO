// Dedicated local stack: separate ports, data and project id from automated tests.
import { mkdir, readFile, writeFile, cp } from "node:fs/promises";
import { execFileSync } from "node:child_process";
const root = ".demo-local";
await mkdir(root + "/supabase", { recursive: true, mode: 0o700 });
let config = await readFile("supabase/config.toml", "utf8");
config = config.replace(
  /^project_id\s*=.*$/m,
  'project_id = "lavilli-control-demo"',
);
for (const [from, to] of [
  [54320, 54330],
  [54321, 54331],
  [54322, 54332],
  [54323, 54333],
])
  config = config.replaceAll(String(from), String(to));
config = config.replace("http://localhost:3000", "http://localhost:3200");
config +=
  "\n[inbucket]\nenabled = false\nport = 54334\nsmtp_port = 54335\npop3_port = 54336\n";
await writeFile(root + "/supabase/config.toml", config);
await cp("supabase/migrations", root + "/supabase/migrations", {
  recursive: true,
});
await mkdir(root + "/supabase/.temp", { recursive: true });
for (const name of [
  "postgres-version",
  "gotrue-version",
  "rest-version",
  "storage-version",
  "storage-migration",
]) {
  try {
    await cp("supabase/.temp/" + name, root + "/supabase/.temp/" + name);
  } catch {
    /* CLI defaults on a fresh workstation. */
  }
}
try {
  execFileSync(
    "npx",
    [
      "--yes",
      "supabase@2.122.0",
      "start",
      "--workdir",
      root,
      "--exclude",
      "studio,imgproxy,realtime,edge-runtime,logflare,vector,supavisor,inbucket",
    ],
    { stdio: ["ignore", "pipe", "pipe"], timeout: 240000 },
  );
} catch (error) {
  await mkdir(".local-secrets", { recursive: true, mode: 0o700 });
  await writeFile(
    ".local-secrets/demo-stack.log",
    String(error.stdout || "") + String(error.stderr || ""),
    { mode: 0o600 },
  );
  throw Error(
    "Não foi possível iniciar o Supabase DEMO local. Confira Docker e portas 54330–54333; nenhum reset foi executado.",
  );
}
console.log(
  "Supabase DEMO local pronto, separado de produção e dos testes automatizados.",
);
