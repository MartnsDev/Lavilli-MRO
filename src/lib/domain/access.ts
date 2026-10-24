export type AccessState = {
  infrastructureReady: boolean;
  passwordConfigured: boolean;
  deviceAuthorized: boolean;
  emailEnabled: boolean;
  localSetupEnabled: boolean;
  recoveryAvailable: boolean;
};
export type AccessMode =
  "login" | "bootstrap" | "email" | "initialize" | "unavailable";
export function initialAccessMode(state: AccessState): AccessMode {
  if (!state.infrastructureReady) return "unavailable";
  if (!state.passwordConfigured)
    return state.localSetupEnabled ? "initialize" : "unavailable";
  return state.deviceAuthorized ? "login" : "bootstrap";
}
