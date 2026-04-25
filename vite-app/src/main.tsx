import "./index.css"

import App from "./App.tsx"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { StrictMode } from "react"
import { BrowserRouter } from "react-router-dom"
import { AuthProvider } from "@/shared/lib/auth"
import { ThemeProvider } from "@/shared/components/theme-provider.tsx"
import { Toaster } from "sonner"
import { createRoot } from "react-dom/client"

const queryClient = new QueryClient()

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <ThemeProvider>
            <App />
          </ThemeProvider>
        </AuthProvider>
      </BrowserRouter>
      <Toaster />
    </QueryClientProvider>
  </StrictMode>
)
