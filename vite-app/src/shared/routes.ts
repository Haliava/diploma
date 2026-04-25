import {
  BarChart3Icon,
  HistoryIcon,
  QrCodeIcon,
  SendIcon,
  UserIcon,
} from "lucide-react"
import type { ComponentType } from "react"

export const appRoutes = {
  root: "/",
  login: "/login",
  register: "/register",
  scan: "/scan",
  history: "/history",
  webhooks: "/webhooks",
  dashboard: "/dashboard",
  profile: "/profile",
} as const

export type MainRoute = keyof Pick<
  typeof appRoutes,
  "scan" | "history" | "webhooks" | "dashboard" | "profile"
>

export type TabItem = {
  route: MainRoute
  path: string
  label: string
  icon: ComponentType<{ className?: string }>
}

export const mainTabs: TabItem[] = [
  { route: "scan", path: appRoutes.scan, label: "Сканер", icon: QrCodeIcon },
  {
    route: "history",
    path: appRoutes.history,
    label: "История",
    icon: HistoryIcon,
  },
  {
    route: "webhooks",
    path: appRoutes.webhooks,
    label: "Вебхуки",
    icon: SendIcon,
  },
  {
    route: "dashboard",
    path: appRoutes.dashboard,
    label: "Аналитика",
    icon: BarChart3Icon,
  },
  { route: "profile", path: appRoutes.profile, label: "Профиль", icon: UserIcon },
]
