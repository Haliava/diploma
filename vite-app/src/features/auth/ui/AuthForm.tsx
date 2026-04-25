import { EyeIcon, LockIcon, UserIcon } from "lucide-react"
import { useState, type FormEvent, type ReactNode } from "react"

import { Input } from "@/components/ui/input"
import { Button } from "@/shared/components/ui/button"

export type AuthFormMode = "login" | "register"

type AuthFormValues = {
  login: string
  password: string
  repeatedPassword: string
}

type AuthFormProps = {
  mode: AuthFormMode
  isLoading?: boolean
  error?: string | null
  onSubmit: (values: AuthFormValues) => void
  renderRegisterFooter?: () => ReactNode
  renderLoginFooter?: () => ReactNode
}

export const AuthForm = ({
  mode,
  isLoading = false,
  error,
  onSubmit,
  renderRegisterFooter,
  renderLoginFooter,
}: AuthFormProps) => {
  const [values, setValues] = useState<AuthFormValues>({
    login: "",
    password: "",
    repeatedPassword: "",
  })

  const isRegister = mode === "register"
  const title = isRegister ? "Регистрация" : "Вход"

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit(values)
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-5 py-8">
      <form
        className="flex w-[calc(100vw-40px)] max-w-[335px] flex-col items-stretch gap-4"
        onSubmit={handleSubmit}
      >
        <div className="mb-2 text-center">
          <h1 className="text-2xl font-semibold tracking-normal">{title}</h1>
        </div>

        <label className="relative block">
          <UserIcon className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-12 rounded-md pl-12"
            placeholder="Email"
            type="email"
            value={values.login}
            onChange={(event) =>
              setValues((current) => ({ ...current, login: event.target.value }))
            }
          />
        </label>

        <label className="relative block">
          <LockIcon className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-12 rounded-md pl-12"
            placeholder="Пароль"
            type="password"
            value={values.password}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                password: event.target.value,
              }))
            }
          />
        </label>

        {isRegister && (
          <label className="relative block">
            <EyeIcon className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-12 rounded-md pl-12"
              placeholder="Повторите пароль"
              type="password"
              value={values.repeatedPassword}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  repeatedPassword: event.target.value,
                }))
              }
            />
          </label>
        )}

        {error && (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <Button className="mt-1 h-12 rounded-md" disabled={isLoading}>
          {isRegister ? "Зарегистрироваться" : "Войти"}
        </Button>

        {isRegister && renderRegisterFooter?.()}
        {!isRegister && renderLoginFooter?.()}
      </form>
    </main>
  )
}
