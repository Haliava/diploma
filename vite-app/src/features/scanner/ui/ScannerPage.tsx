import {
  CameraIcon,
  CheckIcon,
  FlashlightIcon,
  PlayIcon,
  RefreshCwIcon,
  SaveIcon,
  SquareIcon,
  XIcon,
} from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"

import { createScanRecord } from "@/features/scanner/api/scan-history"
import { Button } from "@/shared/components/ui/button"
import { useCamera } from "@/shared/lib/camera/useCamera"
import {
  BarcodeFormat,
  createScanner,
  type ScanResult,
  type ScannerInstance,
} from "@/shared/lib/wasm-scanner"

type FrameSize = {
  width: number
  height: number
}

const captureIntervalMs = 500
const enabledFormats = [BarcodeFormat.QrCode]

const resultKey = (result: ScanResult) => `${result.format}:${result.content}`

const areResultsEqual = (left: ScanResult[], right: ScanResult[]) =>
  left.map(resultKey).join("|") === right.map(resultKey).join("|")

export const ScannerPage = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const scannerRef = useRef<ScannerInstance | null>(null)
  const processingRef = useRef(false)
  const [scannerReady, setScannerReady] = useState(false)
  const [scannerError, setScannerError] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(true)
  const [results, setResults] = useState<ScanResult[]>([])
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set())
  const [frameSize, setFrameSize] = useState<FrameSize>({ width: 1, height: 1 })
  const [isSaving, setIsSaving] = useState(false)
  const {
    devices,
    error: cameraError,
    isStarting,
    setTorch,
    start,
    stop,
    stream,
    switchCamera,
    torchEnabled,
    torchSupported,
  } = useCamera()

  const selectedResults = useMemo(
    () => results.filter((result) => selectedKeys.has(resultKey(result))),
    [results, selectedKeys],
  )

  useEffect(() => {
    void start()
  }, [start])

  useEffect(() => {
    const video = videoRef.current

    if (!video || !stream) {
      return
    }

    video.srcObject = stream
    void video.play()
  }, [stream])

  useEffect(() => {
    let cancelled = false

    const loadScanner = async () => {
      try {
        const scanner = await createScanner({
          activeFormats: enabledFormats,
        })

        if (cancelled) {
          scanner.destroy()
          return
        }

        scannerRef.current = scanner
        setScannerReady(true)
        setScannerError(null)
      } catch (caughtError) {
        const message =
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to initialize scanner"
        setScannerError(message)
      }
    }

    void loadScanner()

    return () => {
      cancelled = true
      scannerRef.current?.destroy()
      scannerRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!stream || !scannerReady || !isScanning) {
      return
    }

    const capture = () => {
      if (processingRef.current) {
        return
      }

      const video = videoRef.current
      const canvas = canvasRef.current
      const scanner = scannerRef.current

      if (!video || !canvas || !scanner || video.videoWidth === 0) {
        return
      }

      processingRef.current = true

      try {
        const width = video.videoWidth
        const height = video.videoHeight
        const context = canvas.getContext("2d", { willReadFrequently: true })

        if (!context) {
          return
        }

        canvas.width = width
        canvas.height = height
        context.drawImage(video, 0, 0, width, height)
        const imageData = context.getImageData(0, 0, width, height)
        const nextResults = scanner.processFrame(imageData)

        setFrameSize({ width, height })
        setResults((previousResults) => {
          if (areResultsEqual(previousResults, nextResults)) {
            return previousResults
          }

          setSelectedKeys(new Set(nextResults.map(resultKey)))
          return nextResults
        })
      } catch (caughtError) {
        const message =
          caughtError instanceof Error ? caughtError.message : "Scan failed"
        setScannerError(message)
      } finally {
        processingRef.current = false
      }
    }

    const intervalId = window.setInterval(capture, captureIntervalMs)
    capture()

    return () => window.clearInterval(intervalId)
  }, [isScanning, scannerReady, stream])

  const toggleSelected = (key: string) => {
    setSelectedKeys((current) => {
      const next = new Set(current)

      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }

      return next
    })
  }

  const saveSelectedResults = async () => {
    if (!selectedResults.length) {
      return
    }

    setIsSaving(true)

    try {
      const scannedAt = new Date().toISOString()
      await Promise.all(
        selectedResults.map((result) =>
          createScanRecord({
            content: result.content,
            format: result.format,
            scannedAt,
          }),
        ),
      )
      toast.success("Результаты сохранены")
      setResults([])
      setSelectedKeys(new Set())
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : "Не удалось сохранить"
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  const clearResults = () => {
    setResults([])
    setSelectedKeys(new Set())
  }

  const toggleTorch = () => {
    void setTorch(!torchEnabled)
  }

  return (
    <main className="grid min-h-svh grid-rows-[auto_1fr_auto] bg-zinc-950 text-white">
      <header className="flex min-h-16 items-center justify-between gap-3 border-b border-white/10 px-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <CameraIcon className="size-5" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-base font-medium">Сканер кодов</h1>
            <p className="truncate text-xs text-white/60">
              {scannerReady ? "WASM готов" : "WASM загружается"}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            size="icon"
            variant="secondary"
            title={isScanning ? "Пауза" : "Сканировать"}
            onClick={() => setIsScanning((value) => !value)}
          >
            {isScanning ? <SquareIcon /> : <PlayIcon />}
          </Button>
          <Button
            size="icon"
            variant="secondary"
            title="Сменить камеру"
            disabled={devices.length < 2 || isStarting}
            onClick={() => void switchCamera()}
          >
            <RefreshCwIcon />
          </Button>
          <Button
            size="icon"
            variant="secondary"
            title="Фонарик"
            disabled={!torchSupported}
            onClick={toggleTorch}
          >
            <FlashlightIcon />
          </Button>
        </div>
      </header>

      <section className="relative min-h-0 overflow-hidden">
        <video
          ref={videoRef}
          className="size-full object-contain"
          muted
          playsInline
        />
        <canvas ref={canvasRef} className="hidden" />

        <div className="pointer-events-none absolute inset-0">
          {results.map((result) => {
            const key = resultKey(result)
            const selected = selectedKeys.has(key)

            return (
              <div
                key={key}
                className={
                  selected
                    ? "absolute border-2 border-primary shadow-[0_0_0_9999px_rgb(0_0_0/0.05)]"
                    : "absolute border-2 border-white/70"
                }
                style={{
                  left: `${(result.boundingBox.x / frameSize.width) * 100}%`,
                  top: `${(result.boundingBox.y / frameSize.height) * 100}%`,
                  width: `${(result.boundingBox.width / frameSize.width) * 100}%`,
                  height: `${(result.boundingBox.height / frameSize.height) * 100}%`,
                }}
              >
                <span className="absolute -top-7 left-0 rounded-sm bg-black/80 px-2 py-1 text-xs">
                  {result.format}
                </span>
              </div>
            )
          })}
        </div>

        {(cameraError || scannerError) && (
          <div className="absolute inset-x-4 top-4 rounded-md border border-destructive/40 bg-destructive/15 p-3 text-sm text-white">
            {cameraError ?? scannerError}
          </div>
        )}
      </section>

      <footer className="border-t border-white/10 bg-zinc-950 p-4">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Найдено: {results.length}</p>
              <p className="text-xs text-white/60">Выбрано: {selectedResults.length}</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                title="Очистить"
                disabled={!results.length}
                onClick={clearResults}
              >
                <XIcon />
              </Button>
              <Button
                size="lg"
                disabled={!selectedResults.length || isSaving}
                onClick={() => void saveSelectedResults()}
              >
                <SaveIcon />
                Сохранить
              </Button>
            </div>
          </div>

          {results.length > 0 && (
            <div className="grid max-h-36 gap-2 overflow-auto sm:grid-cols-2 lg:grid-cols-3">
              {results.map((result) => {
                const key = resultKey(result)
                const selected = selectedKeys.has(key)

                return (
                  <label
                    key={key}
                    className="grid grid-cols-[auto_1fr_auto] items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm"
                  >
                    <input
                      className="size-4"
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleSelected(key)}
                    />
                    <span className="min-w-0 truncate">{result.content}</span>
                    {selected && <CheckIcon className="size-4 text-primary" />}
                  </label>
                )
              })}
            </div>
          )}

          {!stream && (
            <Button disabled={isStarting} onClick={() => void start()}>
              <CameraIcon />
              Включить камеру
            </Button>
          )}
          {stream && (
            <Button variant="outline" onClick={stop}>
              <SquareIcon />
              Остановить камеру
            </Button>
          )}
        </div>
      </footer>
    </main>
  )
}
