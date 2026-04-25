import { CameraIcon, CheckIcon, SaveIcon, SquareIcon, XIcon } from "lucide-react"
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
import { ScannerFrame } from "./ScannerFrame"
import { ScannerSettingsPanel } from "./ScannerSettingsPanel"

type FrameSize = {
  width: number
  height: number
}

const captureIntervalMs = 500
const enabledFormats = [BarcodeFormat.QrCode]

const resultKey = (result: ScanResult) => `${result.format}:${result.content}`

const areResultsEqual = (left: ScanResult[], right: ScanResult[]) =>
  left.map(resultKey).join("|") === right.map(resultKey).join("|")

const getVideoContentRect = (video: HTMLVideoElement) => {
  const rect = video.getBoundingClientRect()
  const videoAspect = video.videoWidth / video.videoHeight
  const elementAspect = rect.width / rect.height

  if (elementAspect > videoAspect) {
    const height = rect.width / videoAspect
    return {
      left: rect.left,
      top: rect.top - (height - rect.height) / 2,
      width: rect.width,
      height,
    }
  }

  const width = rect.height * videoAspect
  return {
    left: rect.left - (width - rect.width) / 2,
    top: rect.top,
    width,
    height: rect.height,
  }
}

const getScanCrop = (video: HTMLVideoElement, frame: HTMLDivElement) => {
  const frameRect = frame.getBoundingClientRect()
  const contentRect = getVideoContentRect(video)
  const left = Math.max(frameRect.left, contentRect.left)
  const top = Math.max(frameRect.top, contentRect.top)
  const right = Math.min(frameRect.right, contentRect.left + contentRect.width)
  const bottom = Math.min(frameRect.bottom, contentRect.top + contentRect.height)

  if (right <= left || bottom <= top) {
    return null
  }

  const scaleX = video.videoWidth / contentRect.width
  const scaleY = video.videoHeight / contentRect.height
  const sourceX = Math.max(0, Math.round((left - contentRect.left) * scaleX))
  const sourceY = Math.max(0, Math.round((top - contentRect.top) * scaleY))
  const sourceWidth = Math.min(
    video.videoWidth - sourceX,
    Math.round((right - left) * scaleX),
  )
  const sourceHeight = Math.min(
    video.videoHeight - sourceY,
    Math.round((bottom - top) * scaleY),
  )

  return {
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
  }
}

export const ScannerPage = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const scanFrameRef = useRef<HTMLDivElement | null>(null)
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
            : "Не удалось инициализировать сканер"
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
      const frame = scanFrameRef.current
      const scanner = scannerRef.current

      if (!video || !canvas || !frame || !scanner || video.videoWidth === 0) {
        return
      }

      processingRef.current = true

      try {
        const context = canvas.getContext("2d", { willReadFrequently: true })
        const crop = getScanCrop(video, frame)

        if (!context || !crop) {
          return
        }

        canvas.width = crop.sourceWidth
        canvas.height = crop.sourceHeight
        context.drawImage(
          video,
          crop.sourceX,
          crop.sourceY,
          crop.sourceWidth,
          crop.sourceHeight,
          0,
          0,
          crop.sourceWidth,
          crop.sourceHeight,
        )
        const imageData = context.getImageData(
          0,
          0,
          crop.sourceWidth,
          crop.sourceHeight,
        )
        const nextResults = scanner.processFrame(imageData)

        setFrameSize({
          width: crop.sourceWidth,
          height: crop.sourceHeight,
        })
        setResults((previousResults) => {
          if (areResultsEqual(previousResults, nextResults)) {
            return previousResults
          }

          setSelectedKeys(new Set(nextResults.map(resultKey)))
          return nextResults
        })
      } catch (caughtError) {
        const message =
          caughtError instanceof Error ? caughtError.message : "Ошибка сканирования"
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
    <main className="relative h-full min-h-0 overflow-hidden bg-zinc-950 text-white">
      <ScannerSettingsPanel
        devicesCount={devices.length}
        isScanning={isScanning}
        isStarting={isStarting}
        scannerReady={scannerReady}
        torchEnabled={torchEnabled}
        torchSupported={torchSupported}
        onSwitchCamera={() => void switchCamera()}
        onToggleScanning={() => setIsScanning((value) => !value)}
        onToggleTorch={toggleTorch}
      />

      <section className="absolute inset-0 overflow-hidden">
        <video
          ref={videoRef}
          className="size-full object-cover"
          muted
          playsInline
        />
        <canvas ref={canvasRef} className="hidden" />

        <ScannerFrame
          frameRef={scanFrameRef}
          frameSize={frameSize}
          results={results}
        />

        {(cameraError || scannerError) && (
          <div className="absolute inset-x-4 top-20 z-30 rounded-md border border-destructive/40 bg-destructive/80 p-3 text-sm text-white">
            {cameraError ?? scannerError}
          </div>
        )}
      </section>

      <footer className="absolute inset-x-0 bottom-0 z-20 border-t border-white/10 bg-zinc-950/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur">
        <div className="mx-auto flex w-full max-w-[430px] flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Найдено: 1</p>
              <p className="text-xs text-white/60">Выбрано: 1</p>
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

            <div className="grid max-h-32 gap-2 overflow-auto">
              {([{ boundingBox: { x: 200, y: 200, width: 100, height: 100 }, confidence: 1, content: 'https://geltek.ru/', format: BarcodeFormat.QrCode }] as ScanResult[]).map((result) => {
                const key = resultKey(result)
                const selected = true

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
