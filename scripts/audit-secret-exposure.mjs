import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
const repo = process.argv[2] || process.cwd();
const values = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "SESSION_SECRET",
  "PIN_HASH",
  "CRON_SECRET",
  "RESEND_API_KEY",
]
  .map((k) => process.env[k])
  .filter((v) => v && v.length >= 12);
const findings = [];
const build = path.resolve(process.env.NEXT_BUILD_DIR || ".next", ".");
function walk(root) {
  if (!fs.existsSync(root)) return;
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const p = path.join(root, entry.name);
    if (entry.isDirectory()) walk(p);
    else {
      const bytes = fs.readFileSync(p);
      if (values.some((v) => bytes.includes(Buffer.from(v))))
        findings.push({
          surface: "public_build",
          file: path.relative(build, p),
        });
    }
  }
}
walk(path.join(build, "static"));
walk(path.resolve(".next/dev/static"));
walk(path.resolve(".next/static"));
walk(path.resolve("public"));
let history = "unavailable";
try {
  const objects = execFileSync("git", ["rev-list", "--objects", "--all"], {
    cwd: repo,
    encoding: "utf8",
    maxBuffer: 20000000,
  })
    .split("\n")
    .filter(Boolean);
  for (const entry of objects) {
    const id = entry.split(" ")[0];
    const type = execFileSync("git", ["cat-file", "-t", id], {
      cwd: repo,
      encoding: "utf8",
    }).trim();
    if (type !== "blob") continue;
    const data = execFileSync("git", ["cat-file", "blob", id], {
      cwd: repo,
      maxBuffer: 30000000,
    });
    if (values.some((v) => data.includes(Buffer.from(v))))
      findings.push({ surface: "git_history", object: id });
  }
  history = "checked";
} catch {
  history = "unavailable";
}
console.log(
  JSON.stringify({
    actual_secret_values_checked: values.length,
    history,
    findings,
  }),
);
if (findings.length || history === "unavailable") process.exitCode = 1;
