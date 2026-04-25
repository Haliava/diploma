import { Navigate, Route, Routes } from "react-router-dom"

import { ScannerPage } from "@/features/scanner/ui/ScannerPage"
import { AuthPage } from "@/pages/auth"
import { DashboardPage } from "@/pages/dashboard/DashboardPage"
import { HistoryPage } from "@/pages/history/HistoryPage"
import { ProfilePage } from "@/pages/profile/ProfilePage"
import { WebhookPage } from "@/pages/webhook/WebhookPage"
import { AuthenticatedLayout } from "@/shared/components/AuthenticatedLayout"
import { ProtectedRoute } from "@/shared/components/ProtectedRoute"
import { PublicOnlyRoute } from "@/shared/components/PublicOnlyRoute"
import { appRoutes } from "@/shared/routes"

export function App() {
  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route element={<AuthPage mode="login" />} path={appRoutes.login} />
        <Route
          element={<AuthPage mode="register" />}
          path={appRoutes.register}
        />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AuthenticatedLayout />}>
          <Route element={<ScannerPage />} path={appRoutes.scan} />
          <Route element={<HistoryPage />} path={appRoutes.history} />
          <Route element={<WebhookPage />} path={appRoutes.webhooks} />
          <Route element={<DashboardPage />} path={appRoutes.dashboard} />
          <Route element={<ProfilePage />} path={appRoutes.profile} />
        </Route>
      </Route>

      <Route element={<Navigate replace to={appRoutes.scan} />} path={appRoutes.root} />
      <Route element={<Navigate replace to={appRoutes.root} />} path="*" />
    </Routes>
  )
}

export default App
