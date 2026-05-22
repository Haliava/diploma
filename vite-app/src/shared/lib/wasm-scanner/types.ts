export enum BarcodeFormat {
  Ean8 = "EAN_8",
  Ean13 = "EAN_13",
  UpcA = "UPC_A",
  UpcE = "UPC_E",
  Code39 = "CODE_39",
  Code128 = "CODE_128",
  QrCode = "QR_CODE",
  DataMatrix = "DATA_MATRIX",
  Pdf417 = "PDF_417",
  Aztec = "AZTEC",
  Other = "OTHER",
}

export type BoundingBox = {
  x: number
  y: number
  width: number
  height: number
}

export type ScanResult = {
  content: string
  format: BarcodeFormat
  boundingBox: BoundingBox
  confidence: number
}

export type ScannerOptions = {
  activeFormats?: BarcodeFormat[]
  inputBufferPoolSize?: number
  maxFrameBytes?: number
  wasmBasePath?: string
  moduleUrl?: string
}

export type EmscriptenModuleOptions = {
  locateFile?: (path: string, prefix: string) => string
}

export type ScannerModuleFactory = (
  options?: EmscriptenModuleOptions,
) => Promise<EmscriptenScannerModule>

export type ScannerModuleImport = {
  default?: ScannerModuleFactory
}

export type EmscriptenScannerModule = {
  HEAPU8: Uint8Array
  UTF8ToString: (ptr: number) => string
  _initScanner: () => number
  _destroyScanner: () => void
  _allocateBuffer: (size: number) => number
  _freeBuffer: (ptr: number) => void
  _getResultBufferPtr: () => number
  _getResultBufferSize: () => number
  _setActiveFormats: (mask: number) => void
  _processFrame: (
    rgbaPtr: number,
    width: number,
    height: number,
    resultBuffer: number,
    resultBufferSize: number,
  ) => number
  _getLastErrorPtr: () => number
}
