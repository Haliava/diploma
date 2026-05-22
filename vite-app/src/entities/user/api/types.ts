export type TokenResponse = { token: string };

export type User = {
  phone: string;
  role: Roles;
}

export enum Roles {
  Default = 'Default',
  Admin = 'Admin',
}