import type { TokenResponse, User } from "./types";

import { axiosInstance } from "@/shared/api/app";

export const loginUserByPhone = (phone: string) => axiosInstance.post<TokenResponse>('/login', phone);

export const registerUserByPhone = (phone: string) => axiosInstance.post<TokenResponse>('/register', phone);

export const setUserJwtToken = async ({ token }: TokenResponse) => {
  localStorage.setItem('accessToken', token);
}

export const refreshUserJwtToken = async () => {
  return localStorage.getItem('accessToken');
}

export const getUser = () => axiosInstance.get<User>('/user');
