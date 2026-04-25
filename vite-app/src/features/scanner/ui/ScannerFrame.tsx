import type { RefObject } from "react"

import type { ScanResult } from "@/shared/lib/wasm-scanner"

type FrameSize = {
  width: number
  height: number
}

type ScannerFrameProps = {
  frameRef: RefObject<HTMLDivElement | null>
  frameSize: FrameSize
  results: ScanResult[]
}

export const ScannerFrame = ({
  frameRef,
  frameSize,
  results,
}: ScannerFrameProps) => (
  <div
    ref={frameRef}
    className="pointer-events-none absolute left-1/2 top-1/2 aspect-square w-[70vw] max-w-[330px] -translate-x-1/2 -translate-y-1/2 border-2 border-primary shadow-[0_0_0_9999px_rgb(0_0_0/0.35)]"
  >
    <div className="absolute -left-0.5 -top-0.5 size-6 border-l-4 border-t-4 border-white" />
    <div className="absolute -right-0.5 -top-0.5 size-6 border-r-4 border-t-4 border-white" />
    <div className="absolute -bottom-0.5 -left-0.5 size-6 border-b-4 border-l-4 border-white" />
    <div className="absolute -bottom-0.5 -right-0.5 size-6 border-b-4 border-r-4 border-white" />

    {results.map((result) => (
      <div
        key={`${result.format}:${result.content}`}
        className="absolute border-2 border-emerald-300 bg-emerald-300/10"
        style={{
          left: `${(result.boundingBox.x / frameSize.width) * 100}%`,
          top: `${(result.boundingBox.y / frameSize.height) * 100}%`,
          width: `${(result.boundingBox.width / frameSize.width) * 100}%`,
          height: `${(result.boundingBox.height / frameSize.height) * 100}%`,
        }}
      />
    ))}
  </div>
)
