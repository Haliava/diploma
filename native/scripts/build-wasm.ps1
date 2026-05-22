param(
  [Parameter(Mandatory = $true)]
  [string]$OpenCvDir,

  [string]$BuildDir = "build-wasm",

  [string]$FrontendWasmDir = "..\vite-app\public\wasm",

  [switch]$Clean
)

$ErrorActionPreference = "Stop"

$nativeRoot = Resolve-Path "$PSScriptRoot\.."
$buildPath = if ([System.IO.Path]::IsPathRooted($BuildDir)) {
  [System.IO.Path]::GetFullPath($BuildDir)
} else {
  [System.IO.Path]::GetFullPath((Join-Path $nativeRoot $BuildDir))
}
$frontendPath = if ([System.IO.Path]::IsPathRooted($FrontendWasmDir)) {
  [System.IO.Path]::GetFullPath($FrontendWasmDir)
} else {
  [System.IO.Path]::GetFullPath((Join-Path $nativeRoot $FrontendWasmDir))
}
$openCvPath = [System.IO.Path]::GetFullPath($OpenCvDir)

if (-not (Get-Command emcmake -ErrorAction SilentlyContinue)) {
  throw "emcmake was not found. Activate Emscripten first, for example: emsdk_env.ps1"
}

if (-not (Get-Command cmake -ErrorAction SilentlyContinue)) {
  throw "cmake was not found in PATH."
}

if (-not (Test-Path $openCvPath)) {
  throw "OpenCV_DIR does not exist: $openCvPath"
}

if ($Clean -and (Test-Path $buildPath)) {
  $resolvedBuildPath = Resolve-Path $buildPath
  if (-not $resolvedBuildPath.Path.StartsWith($nativeRoot.Path)) {
    throw "Refusing to remove build path outside native directory: $($resolvedBuildPath.Path)"
  }

  Remove-Item -LiteralPath $resolvedBuildPath.Path -Recurse -Force
}

emcmake cmake `
  -S $nativeRoot.Path `
  -B $buildPath `
  -G Ninja `
  -DCMAKE_BUILD_TYPE=Release `
  -DOpenCV_DIR="$openCvPath" `
  -DSCANNER_COPY_WASM_TO_FRONTEND=ON `
  -DSCANNER_FRONTEND_WASM_DIR="$frontendPath"

cmake --build $buildPath --target scanner_wasm --config Release

$scannerJs = Join-Path $frontendPath "scanner.js"
$scannerWasm = Join-Path $frontendPath "scanner.wasm"

if (-not (Test-Path $scannerJs) -or -not (Test-Path $scannerWasm)) {
  throw "Build completed, but scanner.js or scanner.wasm was not copied to $frontendPath"
}

Write-Output "WebAssembly artifacts copied to $frontendPath"
