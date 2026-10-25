import { readFile, stat } from "node:fs/promises";

const origins = new Set([
  "https://lavilli-control.vercel.app",
  "https://lavilli-control-test.vercel.app",
]);

export function deploymentTarget(value) {
  const url = new URL(value);
  if (
    !origins.has(url.origin) ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  )
    throw Error(
      "Use somente um domínio Lavilli autorizado, sem caminho ou parâmetros.",
    );
  return url.origin;
}

export function deploymentPassed(checks, requireDocuments = true) {
  return (
    checks.length > 0 &&
    (!requireDocuments ||
      checks.some(
        (check) => check.name === "document-upload-capability" && check.passed,
      )) &&
    checks.every(
      (check) =>
        check.passed ||
        (!requireDocuments && check.name === "document-upload-capability"),
    )
  );
}

export function deploymentProject(origin, project) {
  const expected =
    origin === "https://lavilli-control.vercel.app"
      ? "prj_spaV203Tb9YLtHAfz9a8cL4t0VZK"
      : origin === "https://lavilli-control-test.vercel.app"
        ? "prj_wL44YPVBCUzQjwIHsj5nQzttlgib"
        : undefined;
  if (
    !expected ||
    project.projectId !== expected ||
    project.orgId !== "team_SViHORIJUJwyCD3UsEBFx8cA"
  )
    throw Error("Unexpected deployment project");
}

export async function deploymentPin(env) {
  let pin = env.DEPLOY_TEST_PIN;
  if (env.DEPLOY_TEST_PIN_FILE) {
    if (pin) throw Error("Use only one PIN source");
    if ((await stat(env.DEPLOY_TEST_PIN_FILE)).mode & 0o077)
      throw Error("PIN file must be private");
    pin = (await readFile(env.DEPLOY_TEST_PIN_FILE, "utf8")).trim();
  }
  if (!/^\d{4}$/.test(pin || "")) throw Error("Configure the private PIN");
  return pin;
}

export async function deployThenVerify(
  run,
  { verifyOnly = false, smokeOnly = false } = {},
) {
  if (!verifyOnly) {
    const status = await run("npx", [
      "--yes",
      "vercel@65.2.0",
      "deploy",
      "--prod",
      "--yes",
      "--scope",
      "matheus-s-projects-3ebcc424",
    ]);
    if (status !== 0) return status;
  }
  return run(process.execPath, [
    "scripts/verify-deployment.mjs",
    ...(smokeOnly ? ["--smoke-only"] : []),
  ]);
}
