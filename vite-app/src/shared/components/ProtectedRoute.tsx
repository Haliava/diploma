import { Navigate, Outlet, useLocation } from "react-router-dom"

import { useAuth } from "@/shared/lib/auth"
import { appRoutes } from "@/shared/routes"

export const ProtectedRoute = () => {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate replace state={{ from: location }} to={appRoutes.login} />
  }

  return <Outlet />
}
