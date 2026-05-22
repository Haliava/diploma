import type { EmscriptenScannerModule } from "./types"

export class WasmScannerError extends Error {
  constructor(
    message: string,
    readonly code?: number,
  ) {
    super(message)
    this.name = "WasmScannerError"
  }
}

export const readLastError = (module: EmscriptenScannerModule) => {
  const ptr = module._getLastErrorPtr()
  return ptr ? module.UTF8ToString(ptr) : "Unknown scanner error"
}
