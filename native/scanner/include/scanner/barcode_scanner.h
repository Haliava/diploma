#pragma once

#include <cstdint>
#include <vector>

#include "scanner/scan_result.h"
#include "scanner/scanner_config.h"

namespace scanner {

class BarcodeScanner {
 public:
  BarcodeScanner();

  std::vector<ScanResult> ProcessRgbaFrame(
      const std::uint8_t* rgbaData,
      std::int32_t width,
      std::int32_t height,
      const ScannerConfig& config);
};

}  // namespace scanner
