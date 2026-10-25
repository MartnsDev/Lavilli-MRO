import WebSocket from "ws";
import "server-only";
import {
  createClient,
  type RealtimeClientOptions,
} from "@supabase/supabase-js";
export function infrastructureConfigured() {
  if (["demo", "test"].includes(process.env.APP_MODE || "")) {
    try {
      if (
        !["localhost", "127.0.0.1"].includes(
          new URL(process.env.SUPABASE_URL || "invalid").hostname,
        )
      )
        return false;
    } catch {
      return false;
    }
  }
  return Boolean(
    process.env.SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY &&
    process.env.SESSION_SECRET &&
    process.env.SESSION_SECRET.length >= 32 &&
    process.env.APP_URL,
  );
}
export function configured() {
  return infrastructureConfigured() && Boolean(process.env.PIN_HASH);
}
export function db() {
  if (!infrastructureConfigured()) throw new Error("SETUP_REQUIRED");
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
      // ws implements the runtime interface; its event typings differ from DOM typings.
      realtime: {
        transport: WebSocket as unknown as NonNullable<
          RealtimeClientOptions["transport"]
        >,
      },
    },
  );
}
export async function rpc<T>(
  name: string,
  args: Record<string, unknown>,
): Promise<T> {
  const { data, error } = await db().rpc(name, args);
  if (error) throw new Error(error.message);
  return data as T;
}

let boundaryProbe: Promise<boolean> | undefined;
// Capability check reads zero rows; legacy compatibility never runs on a partial/network failure.
export function securityBoundaryReady() {
  if (!boundaryProbe)
    boundaryProbe = (async () => {
      const { error } = await db()
        .from("access_sessions")
        .select("credential_version")
        .limit(0);
      if (!error) return true;
      if (
        error.code === "42703" ||
        (error.code === "PGRST204" &&
          error.message.includes("credential_version"))
      )
        return false;
      throw Error("SETUP_REQUIRED");
    })().catch((error) => {
      boundaryProbe = undefined;
      throw error;
    });
  return boundaryProbe;
}
