import {
  CalendarIcon,
  HistoryIcon,
  SaveIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react"
import { useEffect, useMemo, useState, type FormEvent } from "react"
import { toast } from "sonner"

import {
  deleteScanRecord,
  getScanHistory,
  updateScanRecord,
  type ScanRecordResponse,
} from "@/features/scanner/api/scan-history"
import { Input } from "@/components/ui/input"
import { MobileServicePage } from "@/shared/components/MobileServicePage"
import { Button } from "@/shared/components/ui/button"
import { BarcodeFormat } from "@/shared/lib/wasm-scanner"
import { cn } from "@/shared/lib/utils"

const barcodeFormats = Object.values(BarcodeFormat)

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))

const toDateTimeLocalValue = (value: string) => {
  const date = new Date(value)
  const offsetMs = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16)
}

const fromDateTimeLocalValue = (value: string) =>
  value ? new Date(value).toISOString() : undefined

type RecordDraft = {
  content: string
  format: BarcodeFormat
  note: string
  scannedAt: string
}

const toDraft = (record: ScanRecordResponse): RecordDraft => ({
  content: record.content,
  format: record.format,
  note: record.note,
  scannedAt: toDateTimeLocalValue(record.scannedAt),
})

export const HistoryPage = () => {
  const [records, setRecords] = useState<ScanRecordResponse[]>([])
  const [selectedRecord, setSelectedRecord] =
    useState<ScanRecordResponse | null>(null)
  const [draft, setDraft] = useState<RecordDraft | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const selectedRecordId = selectedRecord?.id

  const selectedRecordFromList = useMemo(
    () => records.find((record) => record.id === selectedRecordId) ?? null,
    [records, selectedRecordId],
  )

  const loadHistory = async () => {
    setIsLoading(true)

    try {
      const response = await getScanHistory()
      setRecords(response.data.data)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Не удалось загрузить историю"
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadHistory()
  }, [])

  useEffect(() => {
    if (!selectedRecordFromList) {
      return
    }

    setSelectedRecord(selectedRecordFromList)
    setDraft(toDraft(selectedRecordFromList))
  }, [selectedRecordFromList])

  const openRecord = (record: ScanRecordResponse) => {
    setSelectedRecord(record)
    setDraft(toDraft(record))
  }

  const closeDrawer = () => {
    setSelectedRecord(null)
    setDraft(null)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!selectedRecord || !draft) {
      return
    }

    setIsSaving(true)

    try {
      const response = await updateScanRecord(selectedRecord.id, {
        content: draft.content,
        format: draft.format,
        note: draft.note,
        scannedAt: fromDateTimeLocalValue(draft.scannedAt),
      })
      setRecords((current) =>
        current.map((record) =>
          record.id === selectedRecord.id ? response.data : record,
        ),
      )
      toast.success("Запись обновлена")
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Не удалось обновить запись"
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedRecord) {
      return
    }

    setIsDeleting(true)

    try {
      await deleteScanRecord(selectedRecord.id)
      setRecords((current) =>
        current.filter((record) => record.id !== selectedRecord.id),
      )
      closeDrawer()
      toast.success("Запись удалена")
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Не удалось удалить запись"
      toast.error(message)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <MobileServicePage
        description="Последние сохраненные результаты сканирования."
        title="История"
      >
        <div className="flex flex-col gap-3">
          {isLoading && (
            <p className="rounded-md border bg-card p-4 text-sm text-muted-foreground">
              Загружаем историю...
            </p>
          )}

          {!isLoading && records.length === 0 && (
            <p className="rounded-md border bg-card p-4 text-sm text-muted-foreground">
              Сохраненных результатов пока нет.
            </p>
          )}

          {records.map((record) => (
            <button
              key={record.id}
              className="flex min-h-20 w-full items-center gap-3 rounded-md border bg-card p-4 text-left transition-colors active:bg-muted"
              type="button"
              onClick={() => openRecord(record)}
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <HistoryIcon className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-medium">{record.content}</p>
                <p className="text-sm text-muted-foreground">
                  {record.format} · {formatDate(record.scannedAt)}
                </p>
              </div>
            </button>
          ))}
        </div>
      </MobileServicePage>

      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/45 transition-opacity",
          selectedRecord ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={closeDrawer}
      />

      <aside
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 max-h-[86svh] rounded-t-md border bg-background shadow-2xl transition-transform duration-200",
          selectedRecord ? "translate-y-0" : "translate-y-full",
        )}
      >
        {selectedRecord && draft && (
          <form
            className="mx-auto flex w-full max-w-[430px] flex-col gap-4 overflow-auto p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
            onSubmit={handleSubmit}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-xl font-semibold">Детали сканирования</h2>
                <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                  <CalendarIcon className="size-4" />
                  {formatDate(selectedRecord.scannedAt)}
                </p>
              </div>
              <Button
                size="icon"
                type="button"
                variant="outline"
                onClick={closeDrawer}
              >
                <XIcon />
              </Button>
            </div>

            <label className="flex flex-col gap-2 text-sm font-medium">
              Код
              <Input
                className="h-11 rounded-md"
                value={draft.content}
                onChange={(event) =>
                  setDraft((current) =>
                    current ? { ...current, content: event.target.value } : current,
                  )
                }
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium">
              Формат
              <select
                className="h-11 rounded-md border bg-background px-3 text-sm"
                value={draft.format}
                onChange={(event) =>
                  setDraft((current) =>
                    current
                      ? {
                          ...current,
                          format: event.target.value as BarcodeFormat,
                        }
                      : current,
                  )
                }
              >
                {barcodeFormats.map((format) => (
                  <option key={format} value={format}>
                    {format}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium">
              Дата сканирования
              <Input
                className="h-11 rounded-md"
                type="datetime-local"
                value={draft.scannedAt}
                onChange={(event) =>
                  setDraft((current) =>
                    current
                      ? { ...current, scannedAt: event.target.value }
                      : current,
                  )
                }
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium">
              Заметка
              <textarea
                className="min-h-24 rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
                value={draft.note}
                onChange={(event) =>
                  setDraft((current) =>
                    current ? { ...current, note: event.target.value } : current,
                  )
                }
              />
            </label>

            <div className="grid grid-cols-[auto_1fr] gap-3">
              <Button
                className="h-11 rounded-md"
                disabled={isDeleting || isSaving}
                type="button"
                variant="outline"
                onClick={() => void handleDelete()}
              >
                <Trash2Icon />
                Удалить
              </Button>
              <Button
                className="h-11 rounded-md"
                disabled={isSaving || isDeleting}
                type="submit"
              >
                <SaveIcon />
                Сохранить
              </Button>
            </div>
          </form>
        )}
      </aside>
    </>
  )
}
