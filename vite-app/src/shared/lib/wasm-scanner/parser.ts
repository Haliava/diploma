import { toBarcodeFormat } from "./config"
import type { EmscriptenScannerModule, ScanResult } from "./types"

const int32ByteLength = 4
const float32ByteLength = 4

const textDecoder = new TextDecoder("utf-8")

export const parseScanResults = (
  module: EmscriptenScannerModule,
  resultBufferPtr: number,
  resultBufferSize: number,
) => {
  const view = new DataView(
    module.HEAPU8.buffer,
    resultBufferPtr,
    resultBufferSize,
  )
  let offset = 0
  const resultCount = view.getInt32(offset, true)
  offset += int32ByteLength

  const results: ScanResult[] = []

  for (let i = 0; i < resultCount; i += 1) {
    const contentLength = view.getInt32(offset, true)
    offset += int32ByteLength

    if (contentLength < 0 || offset + contentLength > resultBufferSize) {
      throw new Error("Invalid scanner result content length")
    }

    const content = textDecoder.decode(
      module.HEAPU8.subarray(
        resultBufferPtr + offset,
        resultBufferPtr + offset + contentLength,
      ),
    )
    offset += contentLength

    const formatCode = view.getInt32(offset, true)
    offset += int32ByteLength

    const x = view.getInt32(offset, true)
    offset += int32ByteLength

    const y = view.getInt32(offset, true)
    offset += int32ByteLength

    const width = view.getInt32(offset, true)
    offset += int32ByteLength

    const height = view.getInt32(offset, true)
    offset += int32ByteLength

    const confidence = view.getFloat32(offset, true)
    offset += float32ByteLength

    results.push({
      content,
      format: toBarcodeFormat(formatCode),
      boundingBox: {
        x,
        y,
        width,
        height,
      },
      confidence,
    })
  }

  return results
}
