#include "scanner/barcode_scanner.h"

#include <algorithm>
#include <stdexcept>
#include <string>
#include <vector>

#include <opencv2/core.hpp>
#include <opencv2/imgproc.hpp>
#include <opencv2/objdetect.hpp>

#include "scanner/barcode_format.h"

namespace scanner {
namespace {

BoundingBox ToBoundingBox(const std::vector<cv::Point2f>& points) {
  if (points.empty()) {
    return {};
  }

  float minX = points.front().x;
  float minY = points.front().y;
  float maxX = points.front().x;
  float maxY = points.front().y;

  for (const auto& point : points) {
    minX = std::min(minX, point.x);
    minY = std::min(minY, point.y);
    maxX = std::max(maxX, point.x);
    maxY = std::max(maxY, point.y);
  }

  return {
      static_cast<std::int32_t>(std::max(0.0f, minX)),
      static_cast<std::int32_t>(std::max(0.0f, minY)),
      static_cast<std::int32_t>(std::max(0.0f, maxX - minX)),
      static_cast<std::int32_t>(std::max(0.0f, maxY - minY)),
  };
}

std::vector<cv::Point2f> ExtractQrPoints(const cv::Mat& points, int index) {
  if (points.empty() || !points.isContinuous()) {
    return {};
  }

  const auto* pointData = points.ptr<cv::Point2f>();
  const std::size_t pointOffset = static_cast<std::size_t>(index) * 4;
  const std::size_t totalPoints = points.total();

  if (pointOffset + 4 > totalPoints) {
    return {};
  }

  return {
      pointData[pointOffset],
      pointData[pointOffset + 1],
      pointData[pointOffset + 2],
      pointData[pointOffset + 3],
  };
}

}  // namespace

BarcodeScanner::BarcodeScanner() = default;

std::vector<ScanResult> BarcodeScanner::ProcessRgbaFrame(
    const std::uint8_t* rgbaData,
    std::int32_t width,
    std::int32_t height,
    const ScannerConfig& config) {
  if (rgbaData == nullptr) {
    throw std::invalid_argument("RGBA frame pointer is null");
  }

  if (width <= 0 || height <= 0) {
    throw std::invalid_argument("Frame dimensions must be positive");
  }

  std::vector<ScanResult> results;

  if (!IsFormatEnabled(config.activeFormatsMask, BarcodeFormat::QrCode)) {
    return results;
  }

  const cv::Mat rgba(height, width, CV_8UC4, const_cast<std::uint8_t*>(rgbaData));
  cv::Mat gray;
  cv::cvtColor(rgba, gray, cv::COLOR_RGBA2GRAY);

  cv::QRCodeDetector qrDetector;
  std::vector<cv::String> decodedValues;
  cv::Mat points;

  const bool hasMultiple = qrDetector.detectAndDecodeMulti(
      gray,
      decodedValues,
      points);

  if (hasMultiple) {
    for (std::size_t i = 0; i < decodedValues.size(); ++i) {
      const std::string content = decodedValues[i];

      if (content.empty()) {
        continue;
      }

      results.push_back({
          content,
          BarcodeFormat::QrCode,
          ToBoundingBox(ExtractQrPoints(points, static_cast<int>(i))),
          1.0f,
      });
    }
  }

  if (!results.empty()) {
    return results;
  }

  std::vector<cv::Point2f> singlePoints;
  const std::string singleValue = qrDetector.detectAndDecode(gray, singlePoints);

  if (!singleValue.empty()) {
    results.push_back({
        singleValue,
        BarcodeFormat::QrCode,
        ToBoundingBox(singlePoints),
        1.0f,
    });
  }

  return results;
}

}  // namespace scanner
