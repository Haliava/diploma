import { createContext } from "react"

import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
} from "@/entities/user/api/types"

export type AuthContextValue = {
  isAuthenticated: boolean
  login: (payload: LoginRequest) => Promise<AuthResponse>
  logout: () => void
  register: (payload: RegisterRequest) => Promise<AuthResponse>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
