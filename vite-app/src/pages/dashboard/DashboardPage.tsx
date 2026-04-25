import { ActivityIcon, BarChart3Icon, SendIcon } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

import { MobileServicePage } from "@/shared/components/MobileServicePage"
import { axiosInstance } from "@/shared/api/app"
import { cn } from "@/shared/lib/utils"

type CountRow<T extends string> = {
  count: number
} & Record<T, string>

type ScanDayStats = {
  date: string
  totalCount: number
  breakdown: CountRow<"format">[]
}

type WebhookDayStats = {
  date: string
  totalCount: number
  breakdown: CountRow<"status">[]
}

type ScanStatsResponse = {
  totalCount: number
  byFormat: CountRow<"format">[]
  byDay: ScanDayStats[]
}

type WebhookStatsResponse = {
  totalCount: number
  byStatus: CountRow<"status">[]
  byEventType: CountRow<"eventType">[]
  byDay: WebhookDayStats[]
}

type DashboardData = {
  scans: ScanStatsResponse
  webhooks: WebhookStatsResponse
}

type SeriesPoint = {
  label: string
  value: number
}

const formatShortDate = (date: string) =>
  new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(date))

const getMax = (values: number[]) => Math.max(1, ...values)

const toSeries = (
  rows: Array<{ date: string; totalCount: number }>,
): SeriesPoint[] =>
  rows.map((row) => ({
    label: formatShortDate(row.date),
    value: row.totalCount,
  }))

const fetchDashboardData = async (): Promise<DashboardData> => {
  const [scans, webhooks] = await Promise.all([
    axiosInstance.get<ScanStatsResponse>("/dashboard/scan-stats"),
    axiosInstance.get<WebhookStatsResponse>("/dashboard/webhook-stats"),
  ])

  return {
    scans: scans.data,
    webhooks: webhooks.data,
  }
}

const MetricCard = ({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof BarChart3Icon
  label: string
  value: number
}) => (
  <article className="flex min-h-20 items-center justify-between rounded-md border bg-card p-4">
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Icon className="size-5" />
      </div>
      <p className="truncate font-medium">{label}</p>
    </div>
    <p className="text-2xl font-semibold tabular-nums">{value}</p>
  </article>
)

const BarList = <T extends string,>({
  title,
  rows,
  labelKey,
}: {
  title: string
  rows: CountRow<T>[]
  labelKey: T
}) => {
  const max = getMax(rows.map((row) => row.count))

  return (
    <section className="rounded-md border bg-card p-4">
      <h2 className="text-base font-semibold">{title}</h2>
      <div className="mt-4 flex flex-col gap-3">
        {rows.map((row) => {
          const label = row[labelKey]
          const width = `${Math.max(8, (row.count / max) * 100)}%`

          return (
            <div key={label} className="grid gap-1.5">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 truncate text-muted-foreground">
                  {label}
                </span>
                <span className="font-medium tabular-nums">{row.count}</span>
              </div>
              <div className="h-3 overflow-hidden rounded-sm bg-muted">
                <div
                  className="h-full rounded-sm bg-primary"
                  style={{ width }}
                />
              </div>
            </div>
          )
        })}

        {rows.length === 0 && (
          <p className="text-sm text-muted-foreground">Нет данных</p>
        )}
      </div>
    </section>
  )
}

const LineChart = ({
  title,
  points,
  tone = "primary",
}: {
  title: string
  points: SeriesPoint[]
  tone?: "primary" | "secondary"
}) => {
  const max = getMax(points.map((point) => point.value))
  const chartWidth = 320
  const chartHeight = 150
  const padding = 18
  const plotWidth = chartWidth - padding * 2
  const plotHeight = chartHeight - padding * 2
  const linePoints = points.map((point, index) => {
    const x =
      padding + (points.length <= 1 ? 0 : (index / (points.length - 1)) * plotWidth)
    const y = padding + plotHeight - (point.value / max) * plotHeight
    return { ...point, x, y }
  })
  const path = linePoints
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ")
  const areaPath = linePoints.length
    ? `${path} L ${linePoints[linePoints.length - 1].x} ${chartHeight - padding} L ${padding} ${chartHeight - padding} Z`
    : ""

  return (
    <section className="rounded-md border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">{title}</h2>
        <span className="text-sm text-muted-foreground">
          max {max}
        </span>
      </div>

      <div className="mt-4 h-[190px]">
        {points.length === 0 ? (
          <p className="text-sm text-muted-foreground">Нет данных</p>
        ) : (
          <>
            <svg
              className="h-[150px] w-full overflow-visible"
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              role="img"
            >
              <path
                d={areaPath}
                className={cn(
                  tone === "primary" ? "fill-primary/15" : "fill-sky-500/15",
                )}
              />
              <path
                d={path}
                className={cn(
                  "fill-none stroke-[3]",
                  tone === "primary" ? "stroke-primary" : "stroke-sky-500",
                )}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {linePoints.map((point) => (
                <circle
                  key={`${point.label}-${point.x}`}
                  cx={point.x}
                  cy={point.y}
                  r="3.5"
                  className={cn(
                    tone === "primary" ? "fill-primary" : "fill-sky-500",
                  )}
                />
              ))}
            </svg>
            <div className="grid grid-cols-4 gap-2 text-xs text-muted-foreground">
              {points
                .filter((_, index) => index % Math.ceil(points.length / 4) === 0)
                .slice(0, 4)
                .map((point) => (
                  <span key={point.label} className="truncate">
                    {point.label}
                  </span>
                ))}
            </div>
          </>
        )}
      </div>
    </section>
  )
}

export const DashboardPage = () => {
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const nextData = await fetchDashboardData()

        if (!cancelled) {
          setData(nextData)
        }
      } catch {
        if (!cancelled) {
          setError("Не удалось загрузить аналитику. Нужен аккаунт администратора.")
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [])

  const scanSeries = useMemo(
    () => toSeries(data?.scans.byDay ?? []),
    [data?.scans.byDay],
  )
  const webhookSeries = useMemo(
    () => toSeries(data?.webhooks.byDay ?? []),
    [data?.webhooks.byDay],
  )

  return (
    <MobileServicePage
      description="Статистика по сканированиям, форматам кодов и доставке событий во внешние системы."
      title="Аналитика"
    >
      {isLoading && (
        <p className="rounded-md border bg-card p-4 text-sm text-muted-foreground">
          Загружаем аналитику...
        </p>
      )}

      {!isLoading && error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </p>
      )}

      {!isLoading && data && (
        <div className="grid grid-cols-1 gap-3">
          <MetricCard
            icon={BarChart3Icon}
            label="Всего сканирований"
            value={data.scans.totalCount}
          />
          <MetricCard
            icon={SendIcon}
            label="Доставок webhook"
            value={data.webhooks.totalCount}
          />
          <MetricCard
            icon={ActivityIcon}
            label="Типов событий"
            value={data.webhooks.byEventType.length}
          />

          <LineChart title="Сканирования по дням" points={scanSeries} />
          <BarList
            labelKey="format"
            rows={data.scans.byFormat}
            title="Форматы кодов"
          />
          <LineChart
            title="Webhook-доставки по дням"
            points={webhookSeries}
            tone="secondary"
          />
          <BarList
            labelKey="status"
            rows={data.webhooks.byStatus}
            title="Статусы доставок"
          />
          <BarList
            labelKey="eventType"
            rows={data.webhooks.byEventType}
            title="События webhook"
          />
        </div>
      )}
    </MobileServicePage>
  )
}
