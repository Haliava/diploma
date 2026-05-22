#pragma once

#include <cstdint>

namespace scanner {

struct ScannerConfig {
  std::uint32_t activeFormatsMask = 0;
};

}  // namespace scanner
