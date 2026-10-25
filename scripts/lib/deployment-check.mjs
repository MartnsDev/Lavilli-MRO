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
