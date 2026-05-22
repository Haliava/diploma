#pragma once

#include <cstdint>
#include <string>

#include "scanner/barcode_format.h"

namespace scanner {

struct BoundingBox {
  std::int32_t x = 0;
  std::int32_t y = 0;
  std::int32_t width = 0;
  std::int32_t height = 0;
};

struct ScanResult {
  std::string content;
  BarcodeFormat format = BarcodeFormat::Other;
  BoundingBox boundingBox;
  float confidence = 1.0f;
};

}  // namespace scanner
