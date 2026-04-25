import {
  CameraIcon,
  FlashlightIcon,
  PauseIcon,
  PlayIcon,
  RefreshCwIcon,
} from "lucide-react"

import { Button } from "@/shared/components/ui/button"

type ScannerSettingsPanelProps = {
  devicesCount: number
  isScanning: boolean
  isStarting: boolean
  scannerReady: boolean
  torchEnabled: boolean
  torchSupported: boolean
  onSwitchCamera: () => void
  onToggleScanning: () => void
  onToggleTorch: () => void
}

export const ScannerSettingsPanel = ({
  devicesCount,
  isScanning,
  isStarting,
  scannerReady,
  torchEnabled,
  torchSupported,
  onSwitchCamera,
  onToggleScanning,
  onToggleTorch,
}: ScannerSettingsPanelProps) => (
  <div className="absolute inset-x-0 top-0 z-20 border-b border-white/10 bg-zinc-950/90 px-4 py-3 text-white backdrop-blur">
    <div className="mx-auto flex max-w-[430px] items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center bg-primary text-primary-foreground">
          <CameraIcon className="size-5" />
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-base font-semibold">Сканирование</h1>
          <p className="truncate text-xs text-white/60">
            {scannerReady ? "Модуль готов" : "Загрузка модуля"}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Button
          size="icon"
          variant="secondary"
          title={isScanning ? "Пауза" : "Продолжить"}
          onClick={onToggleScanning}
        >
          {isScanning ? <PauseIcon /> : <PlayIcon />}
        </Button>
        <Button
          size="icon"
          variant="secondary"
          title="Сменить камеру"
          disabled={devicesCount < 2 || isStarting}
          onClick={onSwitchCamera}
        >
          <RefreshCwIcon />
        </Button>
        <Button
          size="icon"
          variant={torchEnabled ? "default" : "secondary"}
          title="Фонарик"
          disabled={!torchSupported}
          onClick={onToggleTorch}
        >
          <FlashlightIcon />
        </Button>
      </div>
    </div>
  </div>
)
