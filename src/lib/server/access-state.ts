import "server-only";
import { configured, infrastructureConfigured, db } from "./db";
import type { AccessState, LoginMechanic } from "@/lib/domain/access";
export async function accessState(): Promise<AccessState> {
  let mechanics: LoginMechanic[] = [];
  if (configured()) {
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
    infrastructureReady: infrastructureConfigured(),
    passwordConfigured: Boolean(process.env.PIN_HASH),
    mechanics,
  };
}
