# Native

C++ and WebAssembly sources for the browser scanner module.

OpenCV is planned as the native image-processing library. The repository should contain only the project adapter/wrapper code here; OpenCV itself should be provided as an external dependency through the build environment.

## Layout

```text
native/
  scanner/      # OpenCV-based C++ scanner core
  wasm-api/     # Emscripten-facing extern "C" API
  CMakeLists.txt
```

## Native Configure

```bash
cmake -S native -B native/build -DOpenCV_DIR=/path/to/opencv/lib/cmake/opencv4
cmake --build native/build
```

## WebAssembly Configure

Run this from an activated Emscripten environment and point `OpenCV_DIR` to an OpenCV build compiled for WebAssembly:

```powershell
.\native\scripts\build-wasm.ps1 -OpenCvDir C:\path\to\opencv-wasm\lib\cmake\opencv4
```

or on Unix-like shells:

```bash
./native/scripts/build-wasm.sh --opencv-dir /path/to/opencv-wasm/lib/cmake/opencv4
```

The wasm build emits `scanner.js` and `scanner.wasm`, then copies them to:

```text
vite-app/public/wasm/
```

The CMake target is `scanner_wasm`. Useful flags are already configured:

- `-O3`
- `-s WASM=1`
- `-s MODULARIZE=1`
- `-s EXPORT_ES6=1`
- `-s ALLOW_MEMORY_GROWTH=1`
- explicit `EXPORTED_FUNCTIONS`
- explicit `EXPORTED_RUNTIME_METHODS`
