# WebAssembly API

Emscripten-facing adapter layer for the scanner core.

This layer will contain `extern "C"` exported functions, manual buffer management, and serialization of scan results into WebAssembly linear memory.

Exported ABI:

- `initScanner()`
- `destroyScanner()`
- `allocateBuffer(size)`
- `freeBuffer(ptr)`
- `getResultBufferPtr()`
- `getResultBufferSize()`
- `setActiveFormats(mask)`
- `processFrame(rgbaPtr, width, height, resultBuffer, resultBufferSize)`
- `getLastErrorPtr()`

`processFrame` returns the number of serialized records or a negative error code. On success the result buffer starts with a header:

```text
int32 resultCount
```

Then `resultCount` records follow. Each record is serialized as:

```text
int32 contentLength
byte[contentLength] UTF-8 content
int32 format
int32 x
int32 y
int32 width
int32 height
float32 confidence
```

All integer and float fields are written in WebAssembly little-endian memory layout. The `format` field uses the numeric values from `scanner::BarcodeFormat`:

```text
0 EAN_8
1 EAN_13
2 UPC_A
3 UPC_E
4 CODE_39
5 CODE_128
6 QR_CODE
7 DATA_MATRIX
8 PDF_417
9 AZTEC
10 OTHER
```

If `processFrame` returns a negative value, callers should ignore the buffer and read `getLastErrorPtr()`.
