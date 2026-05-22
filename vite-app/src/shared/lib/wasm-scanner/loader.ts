import { readLastError, WasmScannerError } from "./errors"
import type {
  EmscriptenScannerModule,
  ScannerModuleFactory,
  ScannerModuleImport,
} from "./types"

const defaultWasmBasePath = "/wasm/"
const defaultModuleFileName = "scanner.js"

let cachedModulePromise: Promise<EmscriptenScannerModule> | null = null

type LoadScannerModuleOptions = {
  wasmBasePath?: string
  moduleUrl?: string
  forceReload?: boolean
}

export const loadScannerModule = ({
  wasmBasePath = defaultWasmBasePath,
  moduleUrl,
  forceReload = false,
}: LoadScannerModuleOptions = {}) => {
  if (cachedModulePromise && !forceReload) {
    return cachedModulePromise
  }

  cachedModulePromise = createModule(wasmBasePath, moduleUrl)
  return cachedModulePromise
}

const createModule = async (wasmBasePath: string, moduleUrl?: string) => {
  const normalizedBasePath = normalizeBasePath(wasmBasePath)
  const resolvedModuleUrl = moduleUrl ?? `${normalizedBasePath}${defaultModuleFileName}`
  const moduleImport = (await import(
    /* @vite-ignore */ resolvedModuleUrl
  )) as ScannerModuleImport
  const factory = resolveFactory(moduleImport)
  const module = await factory({
    locateFile: (path) =>
      path.endsWith(".wasm") ? `${normalizedBasePath}${path}` : path,
  })
  const initialized = module._initScanner()

  if (initialized !== 1) {
    throw new WasmScannerError(readLastError(module))
  }

  return module
}

const normalizeBasePath = (path: string) => {
  if (!path) {
    return defaultWasmBasePath
  }

  return path.endsWith("/") ? path : `${path}/`
}

const resolveFactory = (moduleImport: ScannerModuleImport) => {
  const factory = moduleImport.default

  if (!factory) {
    throw new WasmScannerError("scanner.js does not export an Emscripten factory")
  }

  return factory as ScannerModuleFactory
}
