import { Navigate, Outlet } from "react-router-dom"

import { useAuth } from "@/shared/lib/auth"
import { appRoutes } from "@/shared/routes"

export const PublicOnlyRoute = () => {
  const { isAuthenticated } = useAuth()

  if (isAuthenticated) {
    return <Navigate replace to={appRoutes.scan} />
  }

  return <Outlet />
}
