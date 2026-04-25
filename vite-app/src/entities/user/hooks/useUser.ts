import { getUser, loginUser, refreshUserJwtToken, registerUser } from "../api/user"
import { useMutation, useQuery } from "@tanstack/react-query"

export const useUserActions = () => {
  const { mutateAsync: login, isPending: isLoggingIn } = useMutation({
    mutationKey: ['user', 'login'],
    mutationFn: loginUser,
  })

  const { mutateAsync: register, isPending: isRegistering } = useMutation({
    mutationKey: ['user', 'register'],
    mutationFn: registerUser,
  })

  const { mutateAsync: refreshJwtToken, isPending: isRefreshingJwtToken } = useMutation({
    mutationKey: ['user', 'token', 'update'],
    mutationFn: () => refreshUserJwtToken(),
  })

  return {
    loginUser: login,
    isLoggingIn,
    registerUser: register,
    isRegistering,
    refreshJwtToken,
    isRefreshingJwtToken,
  }
}

export const useUser = () => {
  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: ['user'],
    queryFn: () => getUser(),
    select: data => data.data,
  })

  return {
    user,
    isLoadingUser,
  }
}
