const productionProject = "ecyzjuhryfqqpqoskyth";

export function backendAllowedForMode(env: Record<string, string | undefined>) {
  if (!["demo", "test"].includes(env.APP_MODE || "")) return true;
  try {
    const backend = new URL(env.SUPABASE_URL || "invalid");
    if (["localhost", "127.0.0.1", "[::1]"].includes(backend.hostname))
      return true;
    if (env.APP_MODE !== "demo") return false;
    const ref = env.DEMO_SUPABASE_PROJECT_REF || "";
    return (
      /^[a-z0-9]{20}$/.test(ref) &&
      ref !== productionProject &&
      backend.origin === `https://${ref}.supabase.co` &&
      backend.pathname === "/" &&
      !backend.username &&
      !backend.password &&
      !backend.search &&
      !backend.hash &&
      env.APP_URL === "https://lavilli-control-test.vercel.app" &&
      env.EMAIL_MODE === "disabled"
    );
  } catch {
    return false;
  }
}
