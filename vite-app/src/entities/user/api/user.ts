import type { AuthResponse, LoginRequest, RegisterRequest, User } from "./types"

import { axiosInstance } from "@/shared/api/app"

const persistAuth = (response: AuthResponse) => {
  localStorage.setItem('accessToken', response.accessToken)
  localStorage.setItem('refreshToken', response.refreshToken)
  localStorage.setItem('currentUser', JSON.stringify(response.user))
}

export const loginUser = async ({ login, password }: LoginRequest) => {
  const response = await axiosInstance.post<AuthResponse>("/auth/login", {
    email: login,
    password,
  })
  persistAuth(response.data)
  return response.data
}

export const registerUser = async ({ login, password }: RegisterRequest) => {
  const response = await axiosInstance.post<AuthResponse>("/auth/register", {
    email: login,
    name: login,
    password,
  })
  persistAuth(response.data)
  return response.data
}

export const logoutUser = () => {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('currentUser')
}

export const refreshUserJwtToken = async () => {
  const refreshToken = localStorage.getItem('refreshToken')

  if (!refreshToken) {
    return null
  }

  const response = await axiosInstance.post<AuthResponse>("/auth/refresh", {
    refreshToken,
  })
  persistAuth(response.data)
  return response.data.accessToken
}

export const getUser = () => axiosInstance.get<User>("/users/me")
