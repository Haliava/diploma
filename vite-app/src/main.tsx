import "./index.css"

import App from "./App.tsx"
import { StrictMode } from "react"
import { ThemeProvider } from "@/shared/components/theme-provider.tsx"
import { Toaster } from "sonner"
import { createRoot } from "react-dom/client"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
    <Toaster />
  </StrictMode>
)
