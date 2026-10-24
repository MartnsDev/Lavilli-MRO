import "server-only";
import { configured, infrastructureConfigured } from "./db";
import { device } from "./auth";
import { localPinSetupEnabled } from "./local-pin";
import type { AccessState } from "@/lib/domain/access";

export async function accessState(): Promise<AccessState> {
  const ready = infrastructureConfigured();
  let deviceAuthorized = false;
  if (configured()) {
    try {
      await device();
      deviceAuthorized = true;
    } catch {}
  }
  return {
    infrastructureReady: ready,
    passwordConfigured: Boolean(process.env.PIN_HASH),
    deviceAuthorized,
    emailEnabled: Boolean(
      process.env.EMAIL_MODE === "resend" &&
      process.env.AUTHORIZED_EMAIL &&
      process.env.RESEND_API_KEY &&
      process.env.EMAIL_FROM,
    ),
    localSetupEnabled: ready && localPinSetupEnabled(),
    recoveryAvailable: Boolean(process.env.DEVICE_BOOTSTRAP_HASH),
  };
}
