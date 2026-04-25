import { SendIcon } from "lucide-react"

import { MobileServicePage } from "@/shared/components/MobileServicePage"
import { Button } from "@/shared/components/ui/button"

export const WebhookPage = () => (
  <MobileServicePage
    description="Настройка уведомлений для внешних систем."
    title="Вебхуки"
  >
    <section className="flex flex-col gap-3 rounded-md border bg-card p-4">
      <div className="flex items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <SendIcon className="size-5" />
        </div>
        <div>
          <p className="font-medium">SCAN_SUCCESS</p>
          <p className="text-sm text-muted-foreground">Активное событие</p>
        </div>
      </div>
      <Button className="h-11 rounded-md" variant="outline">
        Добавить вебхук
      </Button>
    </section>
  </MobileServicePage>
)
