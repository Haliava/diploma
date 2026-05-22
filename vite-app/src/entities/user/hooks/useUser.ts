import { getUser, loginUserByPhone, refreshUserJwtToken, registerUserByPhone, setUserJwtToken } from "../api/user"
import { useMutation, useQuery } from "@tanstack/react-query"

export const useUserActions = () => {
  const { mutateAsync: loginUser, isPending: isLoggingIn } = useMutation({
    mutationKey: ['user', 'login'],
    mutationFn: async ({ phone }: { phone: string }) => 
      loginUserByPhone(phone)
        .catch(err => {
          if (err.code === 404)
            return registerUserByPhone(phone);
          throw err
        }),
    onSuccess: data => data.data,
  })

  const { mutateAsync: setJwtToken, isPending: isSettingJwtToken } = useMutation({
    mutationKey: ['user', 'token', 'set'],
    mutationFn: setUserJwtToken,
  })

  const { mutateAsync: refreshJwtToken, isPending: isRefreshingJwtToken } = useMutation({
    mutationKey: ['user', 'token', 'update'],
    mutationFn: () => refreshUserJwtToken(),
  })

  return {
    loginUser,
    isLoggingIn,
    setJwtToken,
    isSettingJwtToken,
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
