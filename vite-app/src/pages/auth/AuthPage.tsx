import { useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"

import { AuthForm, type AuthFormMode } from "@/features/auth/ui/AuthForm"
import { useAuth } from "@/shared/lib/auth"
import { appRoutes } from "@/shared/routes"
import type { AxiosError } from "axios"

type AuthValues = {
  login: string
  password: string
  repeatedPassword: string
}

type LocationState = {
  from?: {
    pathname?: string
  }
}

type AuthPageProps = {
  mode: AuthFormMode
}

export const AuthPage = ({ mode }: AuthPageProps) => {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { login, register } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as LocationState | null
  const redirectPath = state?.from?.pathname ?? appRoutes.scan

  const handleSubmit = async (values: AuthValues) => {
    if (mode === "register" && values.password !== values.repeatedPassword) {
      setError("Пароли не совпадают")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      if (mode === "login") {
        await login({ login: values.login, password: values.password })
      } else {
        await register(values)
      }

      navigate(redirectPath, { replace: true })
    } catch (caughtError) {
      const fallback =
        mode === "login"
          ? "Не удалось войти"
          : "Не удалось зарегистрироваться"
      setError((caughtError as AxiosError<{ message?: string[] }>)?.response?.data?.message?.[0] || fallback)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthForm
      error={error}
      isLoading={isLoading}
      mode={mode}
      onSubmit={handleSubmit}
      renderRegisterFooter={() => (
        <Link
          className="mx-auto text-sm text-muted-foreground underline underline-offset-4"
          to={appRoutes.login}
        >
          Уже есть аккаунт? Войти.
        </Link>
      )}
      renderLoginFooter={() => (
        <Link
          className="mx-auto text-sm text-muted-foreground underline underline-offset-4"
          to={appRoutes.register}
        >
          Ещё нет аккаунта? Зарегистрироваться.
        </Link>
      )}
    />
  )
}
