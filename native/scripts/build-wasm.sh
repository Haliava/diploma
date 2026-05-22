#!/usr/bin/env bash
set -euo pipefail

OPEN_CV_DIR=""
BUILD_DIR=""
FRONTEND_WASM_DIR=""
CLEAN=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --opencv-dir)
      OPEN_CV_DIR="$2"
      shift 2
      ;;
    --build-dir)
      BUILD_DIR="$2"
      shift 2
      ;;
    --frontend-wasm-dir)
      FRONTEND_WASM_DIR="$2"
      shift 2
      ;;
    --clean)
      CLEAN=1
      shift
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 1
      ;;
  esac
done

if [[ -z "$OPEN_CV_DIR" ]]; then
  echo "Usage: $0 --opencv-dir /path/to/opencv-wasm/lib/cmake/opencv4 [--clean]" >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NATIVE_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BUILD_DIR="${BUILD_DIR:-$NATIVE_ROOT/build-wasm}"
FRONTEND_WASM_DIR="${FRONTEND_WASM_DIR:-$NATIVE_ROOT/../vite-app/public/wasm}"

command -v emcmake >/dev/null 2>&1 || {
  echo "emcmake was not found. Activate Emscripten first." >&2
  exit 1
}

command -v cmake >/dev/null 2>&1 || {
  echo "cmake was not found in PATH." >&2
  exit 1
}

if [[ ! -d "$OPEN_CV_DIR" ]]; then
  echo "OpenCV_DIR does not exist: $OPEN_CV_DIR" >&2
  exit 1
fi

if [[ "$CLEAN" == "1" && -d "$BUILD_DIR" ]]; then
  BUILD_REAL="$(cd "$BUILD_DIR" && pwd)"
  case "$BUILD_REAL" in
    "$NATIVE_ROOT"/*) rm -rf "$BUILD_REAL" ;;
    *) echo "Refusing to remove build path outside native directory: $BUILD_REAL" >&2; exit 1 ;;
  esac
fi

emcmake cmake \
  -S "$NATIVE_ROOT" \
  -B "$BUILD_DIR" \
  -G Ninja \
  -DCMAKE_BUILD_TYPE=Release \
  -DOpenCV_DIR="$OPEN_CV_DIR" \
  -DSCANNER_COPY_WASM_TO_FRONTEND=ON \
  -DSCANNER_FRONTEND_WASM_DIR="$FRONTEND_WASM_DIR"

cmake --build "$BUILD_DIR" --target scanner_wasm --config Release

test -f "$FRONTEND_WASM_DIR/scanner.js"
test -f "$FRONTEND_WASM_DIR/scanner.wasm"

echo "WebAssembly artifacts copied to $FRONTEND_WASM_DIR"
