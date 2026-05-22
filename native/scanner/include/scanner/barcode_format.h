#pragma once

#include <cstdint>

namespace scanner {

enum class BarcodeFormat : std::int32_t {
  Ean8 = 0,
  Ean13 = 1,
  UpcA = 2,
  UpcE = 3,
  Code39 = 4,
  Code128 = 5,
  QrCode = 6,
  DataMatrix = 7,
  Pdf417 = 8,
  Aztec = 9,
  Other = 10,
};

inline bool IsFormatEnabled(std::uint32_t mask, BarcodeFormat format) {
  if (mask == 0) {
    return true;
  }

  const auto bit = static_cast<std::uint32_t>(format);
  return (mask & (1u << bit)) != 0;
}

}  // namespace scanner
