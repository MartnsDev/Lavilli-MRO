import "server-only";
import { device } from "./auth";
import { configured, infrastructureConfigured, db } from "./db";
import type { AccessState, LoginMechanic } from "@/lib/domain/access";
export async function accessState(): Promise<AccessState> {
  let mechanics: LoginMechanic[] = [];
  let deviceAuthorized = false;
  try {
    await device();
    deviceAuthorized = true;
  } catch {}
  if (configured() && deviceAuthorized) {
    const { data, error } = await db()
      .from("mechanics")
      .select("id,name")
      .eq("active", true)
      .order("name")
      .limit(200);
    if (error) throw new Error("SETUP_REQUIRED");
    mechanics = data ?? [];
  }
  return {
    deviceAuthorized,
    infrastructureReady: infrastructureConfigured(),
    passwordConfigured: Boolean(process.env.PIN_HASH),
    mechanics,
  };
}
