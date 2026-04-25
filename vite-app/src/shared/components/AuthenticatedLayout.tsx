import { Outlet } from "react-router-dom"

import { BottomTabs } from "@/shared/components/BottomTabs"

export const AuthenticatedLayout = () => (
  <div className="grid min-h-svh grid-rows-[1fr_auto] overflow-hidden bg-background text-foreground">
    <div className="min-h-0 overflow-hidden">
      <Outlet />
    </div>
    <BottomTabs />
  </div>
)
