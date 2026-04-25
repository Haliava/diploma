import type { ReactNode } from "react"

type MobileServicePageProps = {
  title: string
  description: string
  children: ReactNode
}

export const MobileServicePage = ({
  title,
  description,
  children,
}: MobileServicePageProps) => (
  <main className="h-full overflow-auto bg-background px-5 py-5">
    <div className="mx-auto flex w-full max-w-[430px] flex-col gap-5 pb-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-normal">{title}</h1>
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
      </header>
      {children}
    </div>
  </main>
)
