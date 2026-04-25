import {
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react"

import {
  loginUser,
  logoutUser,
  registerUser,
} from "@/entities/user/api/user"
import type { LoginRequest, RegisterRequest } from "@/entities/user/api/types"
import { AuthContext } from "./auth-context"

type AuthProviderProps = {
  children: ReactNode
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() =>
    Boolean(localStorage.getItem("accessToken")),
  )

  const login = useCallback(async (payload: LoginRequest) => {
    const response = await loginUser(payload)
    setIsAuthenticated(true)
    return response
  }, [])

  const register = useCallback(async (payload: RegisterRequest) => {
    const response = await registerUser(payload)
    setIsAuthenticated(true)
    return response
  }, [])

  const logout = useCallback(() => {
    logoutUser()
    setIsAuthenticated(false)
  }, [])

  const value = useMemo(
    () => ({
      isAuthenticated,
      login,
      logout,
      register,
    }),
    [isAuthenticated, login, logout, register],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
