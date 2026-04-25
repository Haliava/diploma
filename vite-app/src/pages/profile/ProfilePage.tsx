import { LogOutIcon, UserIcon } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

import { MobileServicePage } from "@/shared/components/MobileServicePage"
import { Button } from "@/shared/components/ui/button"
import { useAuth } from "@/shared/lib/auth"
import { appRoutes } from "@/shared/routes"

type StoredUser = {
  email?: string
  role?: string
}

const parseStoredUser = () => {
  const storedUser = localStorage.getItem("currentUser")

  if (!storedUser) {
    return null
  }

  try {
    return JSON.parse(storedUser) as StoredUser
  } catch {
    return null
  }
}

export const ProfilePage = () => {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const user = parseStoredUser()

  const handleLogout = () => {
    logout()
    toast.success("Вы вышли из аккаунта")
    navigate(appRoutes.login, { replace: true })
  }

  return (
    <MobileServicePage
      description="Данные пользователя и управление сессией."
      title="Профиль"
    >
      <section className="flex flex-col gap-4 rounded-md border bg-card p-4">
        <div className="flex items-center gap-3">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <UserIcon className="size-6" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-medium">
              {user?.email ?? "Пользователь"}
            </p>
            <p className="text-sm text-muted-foreground">
              Роль: {user?.role ?? "user"}
            </p>
          </div>
        </div>
        <Button className="h-11 rounded-md" variant="outline" onClick={handleLogout}>
          <LogOutIcon />
          Выйти
        </Button>
      </section>
    </MobileServicePage>
  )
}
