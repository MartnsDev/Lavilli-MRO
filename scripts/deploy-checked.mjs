import { readFile } from "node:fs/promises";
import { spawn, execFileSync } from "node:child_process";
import {
  deploymentTarget,
  deploymentProject,
  deploymentPin,
  deployThenVerify,
} from "./lib/deployment-check.mjs";

let stage = "preflight";
try {
  const args = process.argv.slice(2);
  if (args.some((arg) => !["--verify-only", "--smoke-only"].includes(arg)))
    throw Error("Unknown option");
  const verifyOnly = args.includes("--verify-only");
  const smokeOnly = args.includes("--smoke-only");
  const origin = deploymentTarget(
    process.env.DEPLOY_TEST_URL || "https://lavilli-control.vercel.app",
  );
  deploymentProject(
    origin,
    JSON.parse(await readFile(".vercel/project.json", "utf8")),
  );
  await deploymentPin(process.env);
  const git = (args) =>
    execFileSync("git", args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  if (
    ![
      "https://github.com/MartnsDev/Lavilli-MRO.git",
      "git@github.com:MartnsDev/Lavilli-MRO.git",
    ].includes(git(["remote", "get-url", "origin"]))
  )
    throw Error("Wrong repository");
  if (!verifyOnly && git(["status", "--porcelain"]))
    throw Error("Commit reviewed changes before publishing");
  const run = (command, args) =>
    new Promise((resolve, reject) => {
      stage = command === "npx" ? "publish" : "verify";
      const child = spawn(command, args, {
        stdio: "inherit",
        env: {
          ...process.env,
          DEPLOY_TEST_URL: origin,
          VERCEL_TELEMETRY_DISABLED: "1",
        },
      });
      child.on("error", reject);
      child.on("exit", (code) => resolve(code ?? 1));
    });
  process.exitCode = await deployThenVerify(run, { verifyOnly, smokeOnly });
} catch {
  console.error(
    JSON.stringify({
      stage,
      passed: false,
      error:
        "Check the authorized repository, Vercel project binding, clean Git state and private PIN source.",
    }),
  );
  process.exitCode = 1;
}
