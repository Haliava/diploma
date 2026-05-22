import { toActiveFormatsMask } from "./config"
import { readLastError, WasmScannerError } from "./errors"
import { loadScannerModule } from "./loader"
import { WasmBufferPool, writeBytes } from "./memory"
import { parseScanResults } from "./parser"
import type {
  BarcodeFormat,
  EmscriptenScannerModule,
  ScannerOptions,
  ScanResult,
} from "./types"

const defaultMaxFrameBytes = 1920 * 1080 * 4
const defaultInputBufferPoolSize = 2

export class ScannerInstance {
  private readonly inputBuffers: WasmBufferPool
  private disposed = false

  private constructor(
    private readonly module: EmscriptenScannerModule,
    options: ScannerOptions = {},
  ) {
    this.inputBuffers = new WasmBufferPool(
      module,
      options.maxFrameBytes ?? defaultMaxFrameBytes,
      options.inputBufferPoolSize ?? defaultInputBufferPoolSize,
    )

    this.setActiveFormats(options.activeFormats)
  }

  static async create(options: ScannerOptions = {}) {
    const module = await loadScannerModule({
      wasmBasePath: options.wasmBasePath,
      moduleUrl: options.moduleUrl,
    })

    return new ScannerInstance(module, options)
  }

  processFrame(imageData: ImageData): ScanResult[] {
    this.assertNotDisposed()

    const frameBytes = imageData.data.byteLength
    const inputPtr = this.inputBuffers.acquire(frameBytes)

    try {
      writeBytes(this.module, inputPtr, imageData.data)

      const resultBufferPtr = this.module._getResultBufferPtr()
      const resultBufferSize = this.module._getResultBufferSize()
      const resultCode = this.module._processFrame(
        inputPtr,
        imageData.width,
        imageData.height,
        resultBufferPtr,
        resultBufferSize,
      )

      if (resultCode < 0) {
        throw new WasmScannerError(readLastError(this.module), resultCode)
      }

      return parseScanResults(this.module, resultBufferPtr, resultBufferSize)
    } finally {
      this.inputBuffers.release(inputPtr)
    }
  }

  setActiveFormats(formats?: BarcodeFormat[]) {
    this.assertNotDisposed()
    this.module._setActiveFormats(toActiveFormatsMask(formats))
  }

  destroy() {
    if (this.disposed) {
      return
    }

    this.inputBuffers.dispose()
    this.module._destroyScanner()
    this.disposed = true
  }

  private assertNotDisposed() {
    if (this.disposed) {
      throw new WasmScannerError("Scanner instance has already been destroyed")
    }
  }
}

export const createScanner = (options?: ScannerOptions) =>
  ScannerInstance.create(options)
