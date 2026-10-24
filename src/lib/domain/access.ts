export type LoginMechanic = { id: string; name: string };
export type AccessState = {
  deviceAuthorized: boolean;
  infrastructureReady: boolean;
  passwordConfigured: boolean;
  mechanics: LoginMechanic[];
};
