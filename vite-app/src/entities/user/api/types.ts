export type User = {
  id: string
  email: string
  name: string
  role: Roles
}

export enum Roles {
  User = 'user',
  Admin = 'admin',
}

export type AuthResponse = {
  accessToken: string
  refreshToken: string
  user: User
}

export type LoginRequest = {
  login: string
  password: string
}

export type RegisterRequest = LoginRequest & {
  repeatedPassword: string
}
