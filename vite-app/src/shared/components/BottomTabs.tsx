import { NavLink } from "react-router-dom"

import { cn } from "@/shared/lib/utils"
import { mainTabs } from "@/shared/routes"

export const BottomTabs = () => (
  <nav
    aria-label="Основная навигация"
    className="grid h-16 grid-cols-5 border-t border-border bg-background fixed bottom-0 left-0 w-full"
  >
    {mainTabs.map((tab) => {
      const Icon = tab.icon

      return (
        <NavLink
          key={tab.route}
          className={({ isActive }) =>
            cn(
              "flex min-w-0 flex-col items-center justify-center gap-1 px-1 text-[11px] font-medium text-muted-foreground",
              "transition-colors active:bg-muted",
              isActive && "bg-primary text-primary-foreground",
            )
          }
          to={tab.path}
        >
          <Icon className="size-5 shrink-0" />
          <span className="max-w-full truncate">{tab.label}</span>
        </NavLink>
      )
    })}
  </nav>
)
