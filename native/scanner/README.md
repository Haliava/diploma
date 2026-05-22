# Scanner Core

C++ scanner core code that uses OpenCV for image processing and barcode/code detection.

This layer should expose native C++ types internally and stay independent from JavaScript/WebAssembly-specific memory concerns.

Current implementation uses OpenCV `QRCodeDetector` as the first real detector. The public enum already reserves formats for EAN, UPC, Code39, Code128, DataMatrix, PDF417, Aztec, and `OTHER`, so additional detectors can be added without changing the WebAssembly ABI.
