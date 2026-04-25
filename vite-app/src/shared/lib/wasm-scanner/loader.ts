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
  await assertModuleIsAvailable(resolvedModuleUrl)

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

const assertModuleIsAvailable = async (moduleUrl: string) => {
  const resolvedUrl = new URL(moduleUrl, window.location.href)

  if (resolvedUrl.protocol !== "http:" && resolvedUrl.protocol !== "https:") {
    throw new WasmScannerError(
      `Некорректный URL WASM-модуля: ${resolvedUrl.href}`,
    )
  }

  try {
    const response = await fetch(resolvedUrl.href, {
      cache: "no-store",
      method: "HEAD",
    })

    if (response.ok) {
      return
    }

    if (response.status === 404) {
      throw new WasmScannerError(
        "WASM-модуль сканера не найден. Соберите native/scripts/build-wasm.ps1 или build-wasm.sh, чтобы появились public/wasm/scanner.js и scanner.wasm.",
      )
    }

    throw new WasmScannerError(
      `Не удалось загрузить WASM-модуль сканера: HTTP ${response.status}`,
    )
  } catch (error) {
    if (error instanceof WasmScannerError) {
      throw error
    }

    throw new WasmScannerError(
      "Не удалось проверить WASM-модуль сканера. Проверьте, что public/wasm/scanner.js доступен из Vite dev server.",
    )
  }
}

const resolveFactory = (moduleImport: ScannerModuleImport) => {
  const factory = moduleImport.default

  if (!factory) {
    throw new WasmScannerError("scanner.js does not export an Emscripten factory")
  }

  return factory as ScannerModuleFactory
}
