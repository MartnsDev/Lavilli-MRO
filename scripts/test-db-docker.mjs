import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
const project = readFileSync("supabase/config.toml", "utf8").match(
  /^project_id\s*=\s*"([a-z0-9-]+)"/m,
)?.[1];
if (!project) throw Error("Local Supabase project id missing");
const container = "supabase_db_" + project;
// docker exec addresses only the local container, never a remote database URL.
execFileSync("docker", ["inspect", container], { stdio: "ignore" });
const root = "/tmp/lavilli-verification-" + randomUUID();
const run = (args) => execFileSync("docker", args, { stdio: "inherit" });
try {
  run([
    "exec",
    container,
    "mkdir",
    "-p",
    root + "/scripts",
    root + "/supabase",
  ]);
  for (const [source, target] of [
    ["scripts/test-db.sh", "scripts/test-db.sh"],
    ["supabase/migrations", "supabase/migrations"],
    ["supabase/tests", "supabase/tests"],
  ])
    run(["cp", source, container + ":" + root + "/" + target]);
  run([
    "exec",
    "--workdir",
    root,
    "--env",
    "RUN_DATABASE_TESTS=1",
    "--env",
    "PGHOST=127.0.0.1",
    "--env",
    "PGPORT=5432",
    "--env",
    "PGUSER=postgres",
    "--env",
    "PGPASSWORD=postgres",
    container,
    "bash",
    "scripts/test-db.sh",
  ]);
} finally {
  run(["exec", container, "rm", "-rf", root]);
}
