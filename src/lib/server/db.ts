import WebSocket from "ws";
import "server-only";
import {
  createClient,
  type RealtimeClientOptions,
} from "@supabase/supabase-js";
export function infrastructureConfigured() {
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
