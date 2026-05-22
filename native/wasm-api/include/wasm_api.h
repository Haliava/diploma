#pragma once

#include <cstdint>

#ifdef __EMSCRIPTEN__
#include <emscripten/emscripten.h>
#else
#define EMSCRIPTEN_KEEPALIVE
#endif

extern "C" {

EMSCRIPTEN_KEEPALIVE int initScanner();
EMSCRIPTEN_KEEPALIVE void destroyScanner();

EMSCRIPTEN_KEEPALIVE std::uint8_t* allocateBuffer(std::int32_t size);
EMSCRIPTEN_KEEPALIVE void freeBuffer(std::uint8_t* ptr);

EMSCRIPTEN_KEEPALIVE std::uint8_t* getResultBufferPtr();
EMSCRIPTEN_KEEPALIVE std::int32_t getResultBufferSize();

EMSCRIPTEN_KEEPALIVE void setActiveFormats(std::uint32_t mask);

EMSCRIPTEN_KEEPALIVE std::int32_t processFrame(
    const std::uint8_t* rgbaPtr,
    std::int32_t width,
    std::int32_t height,
    std::uint8_t* resultBuffer,
    std::int32_t resultBufferSize);

EMSCRIPTEN_KEEPALIVE const char* getLastErrorPtr();

}
