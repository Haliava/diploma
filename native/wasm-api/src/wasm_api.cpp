#include "wasm_api.h"

#include <cstdlib>
#include <cstring>
#include <exception>
#include <memory>
#include <string>
#include <vector>

#include "scanner/barcode_scanner.h"

namespace {

constexpr std::int32_t kDefaultResultBufferSize = 64 * 1024;
constexpr std::int32_t kResultCountSize = static_cast<std::int32_t>(
    sizeof(std::int32_t));

std::unique_ptr<scanner::BarcodeScanner> g_scanner;
scanner::ScannerConfig g_config;
std::vector<std::uint8_t> g_resultBuffer(kDefaultResultBufferSize);
std::string g_lastError;

void SetLastError(const std::string& message) {
  g_lastError = message;
}

bool WriteBytes(
    std::uint8_t*& cursor,
    std::int32_t& remaining,
    const void* source,
    std::int32_t size) {
  if (size < 0 || remaining < size) {
    return false;
  }

  std::memcpy(cursor, source, static_cast<std::size_t>(size));
  cursor += size;
  remaining -= size;
  return true;
}

template <typename T>
bool WriteValue(std::uint8_t*& cursor, std::int32_t& remaining, const T& value) {
  return WriteBytes(cursor, remaining, &value, static_cast<std::int32_t>(sizeof(T)));
}

bool SerializeResult(
    const scanner::ScanResult& result,
    std::uint8_t*& cursor,
    std::int32_t& remaining) {
  const auto contentLength =
      static_cast<std::int32_t>(result.content.size());
  const auto format = static_cast<std::int32_t>(result.format);

  return WriteValue(cursor, remaining, contentLength) &&
         WriteBytes(cursor, remaining, result.content.data(), contentLength) &&
         WriteValue(cursor, remaining, format) &&
         WriteValue(cursor, remaining, result.boundingBox.x) &&
         WriteValue(cursor, remaining, result.boundingBox.y) &&
         WriteValue(cursor, remaining, result.boundingBox.width) &&
         WriteValue(cursor, remaining, result.boundingBox.height) &&
         WriteValue(cursor, remaining, result.confidence);
}

void WriteResultCount(std::uint8_t* resultBuffer, std::int32_t count) {
  std::memcpy(resultBuffer, &count, sizeof(count));
}

}  // namespace

extern "C" {

int initScanner() {
  try {
    if (!g_scanner) {
      g_scanner = std::make_unique<scanner::BarcodeScanner>();
    }

    SetLastError("");
    return 1;
  } catch (const std::exception& error) {
    SetLastError(error.what());
    return 0;
  } catch (...) {
    SetLastError("Unknown scanner initialization error");
    return 0;
  }
}

void destroyScanner() {
  g_scanner.reset();
}

std::uint8_t* allocateBuffer(std::int32_t size) {
  if (size <= 0) {
    SetLastError("Buffer size must be positive");
    return nullptr;
  }

  auto* ptr = static_cast<std::uint8_t*>(
      std::malloc(static_cast<std::size_t>(size)));

  if (ptr == nullptr) {
    SetLastError("Unable to allocate buffer");
    return nullptr;
  }

  SetLastError("");
  return ptr;
}

void freeBuffer(std::uint8_t* ptr) {
  std::free(ptr);
}

std::uint8_t* getResultBufferPtr() {
  return g_resultBuffer.data();
}

std::int32_t getResultBufferSize() {
  return static_cast<std::int32_t>(g_resultBuffer.size());
}

void setActiveFormats(std::uint32_t mask) {
  g_config.activeFormatsMask = mask;
}

std::int32_t processFrame(
    const std::uint8_t* rgbaPtr,
    std::int32_t width,
    std::int32_t height,
    std::uint8_t* resultBuffer,
    std::int32_t resultBufferSize) {
  try {
    if (!g_scanner) {
      SetLastError("Scanner is not initialized");
      return -1;
    }

    if (resultBuffer == nullptr) {
      resultBuffer = g_resultBuffer.data();
      resultBufferSize = static_cast<std::int32_t>(g_resultBuffer.size());
    }

    if (resultBufferSize <= 0) {
      SetLastError("Result buffer size must be positive");
      return -2;
    }

    if (resultBufferSize < kResultCountSize) {
      SetLastError("Result buffer is too small for result header");
      return -3;
    }

    const auto results = g_scanner->ProcessRgbaFrame(
        rgbaPtr,
        width,
        height,
        g_config);

    auto* cursor = resultBuffer;
    auto remaining = resultBufferSize;
    const std::int32_t zeroCount = 0;
    WriteValue(cursor, remaining, zeroCount);

    std::int32_t writtenCount = 0;

    for (const auto& result : results) {
      auto* before = cursor;
      auto remainingBefore = remaining;

      if (!SerializeResult(result, cursor, remaining)) {
        cursor = before;
        remaining = remainingBefore;
        SetLastError("Result buffer is too small");
        return -3;
      }

      ++writtenCount;
    }

    WriteResultCount(resultBuffer, writtenCount);
    SetLastError("");
    return writtenCount;
  } catch (const std::exception& error) {
    SetLastError(error.what());
    return -4;
  } catch (...) {
    SetLastError("Unknown frame processing error");
    return -5;
  }
}

const char* getLastErrorPtr() {
  return g_lastError.c_str();
}

}
