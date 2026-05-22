import type { EmscriptenScannerModule } from "./types"

type WasmBuffer = {
  ptr: number
  size: number
  inUse: boolean
}

export class WasmBufferPool {
  private readonly buffers: WasmBuffer[] = []

  constructor(
    private readonly module: EmscriptenScannerModule,
    private readonly defaultBufferSize: number,
    initialSize = 2,
  ) {
    for (let i = 0; i < initialSize; i += 1) {
      this.buffers.push(this.allocate(defaultBufferSize))
    }
  }

  acquire(requiredSize = this.defaultBufferSize) {
    const existing = this.buffers.find(
      (buffer) => !buffer.inUse && buffer.size >= requiredSize,
    )

    if (existing) {
      existing.inUse = true
      return existing.ptr
    }

    const created = this.allocate(Math.max(requiredSize, this.defaultBufferSize))
    this.buffers.push(created)
    return created.ptr
  }

  release(ptr: number) {
    const buffer = this.buffers.find((item) => item.ptr === ptr)

    if (buffer) {
      buffer.inUse = false
    }
  }

  dispose() {
    for (const buffer of this.buffers) {
      this.module._freeBuffer(buffer.ptr)
    }

    this.buffers.length = 0
  }

  private allocate(size: number): WasmBuffer {
    const ptr = this.module._allocateBuffer(size)

    if (!ptr) {
      throw new Error(`Unable to allocate ${size} bytes in WebAssembly memory`)
    }

    return {
      ptr,
      size,
      inUse: false,
    }
  }
}

export const writeBytes = (
  module: EmscriptenScannerModule,
  ptr: number,
  bytes: Uint8Array | Uint8ClampedArray,
) => {
  module.HEAPU8.set(bytes, ptr)
}
