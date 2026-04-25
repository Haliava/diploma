import { Navigate } from "react-router-dom"

import { appRoutes } from "@/shared/routes"

export const LoginPage = () => <Navigate replace to={appRoutes.login} />
