import fs from "node:fs";
import path from "node:path";
const skip = new Set([
  "node_modules",
  ".local-secrets",
  ".temp",
  ".branches",
  ".next",
  ".next-verification",
  ".git",
  ".agents",
  ".aws",
  ".codex",
  "test-results",
  "playwright-report",
]);
const patterns = [
  /sb_secret_[A-Za-z0-9_-]{20,}/,
  /re_[A-Za-z0-9]{24,}/,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
];
let failed = false;
function walk(dir) {
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    if (
      skip.has(item.name) ||
      (item.name.startsWith(".env") && item.name !== ".env.example")
    )
      continue;
    const p = path.join(dir, item.name);
    if (item.isDirectory()) walk(p);
    else if (/\.(ts|tsx|js|mjs|json|sql|md|sh)$/.test(p)) {
      const value = fs.readFileSync(p, "utf8");
      if (patterns.some((r) => r.test(value))) {
        console.error("Possible secret:", p);
        failed = true;
      }
    }
  }
}
walk(".");
if (failed) process.exit(1);
console.log(
  "No recognized credential patterns in source. Manually review secrets before publication.",
);
