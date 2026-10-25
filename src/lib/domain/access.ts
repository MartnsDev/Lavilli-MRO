export type LoginMechanic = { id: string; name: string };
export type AccessState = {
  infrastructureReady: boolean;
  passwordConfigured: boolean;
  mechanics: LoginMechanic[];
};
