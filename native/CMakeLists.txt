cmake_minimum_required(VERSION 3.20)

project(diploma_scanner_native LANGUAGES CXX)

option(SCANNER_COPY_WASM_TO_FRONTEND "Copy WebAssembly build artifacts to the Vite public directory" OFF)
set(SCANNER_FRONTEND_WASM_DIR
  "${CMAKE_CURRENT_SOURCE_DIR}/../vite-app/public/wasm"
  CACHE PATH
  "Directory where scanner.js and scanner.wasm are copied after a wasm build"
)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

find_package(OpenCV REQUIRED COMPONENTS core imgproc objdetect)

add_library(scanner_core STATIC
  scanner/src/barcode_scanner.cpp
)

target_include_directories(scanner_core
  PUBLIC
    ${CMAKE_CURRENT_SOURCE_DIR}/scanner/include
)

target_link_libraries(scanner_core
  PUBLIC
    ${OpenCV_LIBS}
)

target_compile_features(scanner_core PUBLIC cxx_std_17)

if (EMSCRIPTEN)
  add_executable(scanner_wasm
    wasm-api/src/wasm_api.cpp
  )

  target_include_directories(scanner_wasm
    PRIVATE
      ${CMAKE_CURRENT_SOURCE_DIR}/wasm-api/include
  )

  target_link_libraries(scanner_wasm PRIVATE scanner_core)

  set_target_properties(scanner_wasm PROPERTIES
    OUTPUT_NAME scanner
    SUFFIX ".js"
  )

  set(EMSCRIPTEN_EXPORTED_FUNCTIONS
    "['_initScanner','_destroyScanner','_allocateBuffer','_freeBuffer','_getResultBufferPtr','_getResultBufferSize','_setActiveFormats','_processFrame','_getLastErrorPtr']"
  )
  set(EMSCRIPTEN_EXPORTED_RUNTIME_METHODS
    "['ccall','cwrap','HEAPU8','HEAP32','UTF8ToString']"
  )

  target_link_options(scanner_wasm PRIVATE
    "SHELL:-O3"
    "SHELL:-s WASM=1"
    "SHELL:-s MODULARIZE=1"
    "SHELL:-s EXPORT_ES6=1"
    "SHELL:-s SINGLE_FILE=0"
    "SHELL:-s ALLOW_MEMORY_GROWTH=1"
    "SHELL:-s INITIAL_MEMORY=64MB"
    "SHELL:-s MAXIMUM_MEMORY=2GB"
    "SHELL:-s ENVIRONMENT=web,worker"
    "SHELL:-s FILESYSTEM=0"
    "SHELL:-s EXPORTED_FUNCTIONS=${EMSCRIPTEN_EXPORTED_FUNCTIONS}"
    "SHELL:-s EXPORTED_RUNTIME_METHODS=${EMSCRIPTEN_EXPORTED_RUNTIME_METHODS}"
  )

  if (SCANNER_COPY_WASM_TO_FRONTEND)
    add_custom_command(TARGET scanner_wasm POST_BUILD
      COMMAND ${CMAKE_COMMAND} -E make_directory "${SCANNER_FRONTEND_WASM_DIR}"
      COMMAND ${CMAKE_COMMAND} -E copy_if_different
        "$<TARGET_FILE_DIR:scanner_wasm>/scanner.js"
        "${SCANNER_FRONTEND_WASM_DIR}/scanner.js"
      COMMAND ${CMAKE_COMMAND} -E copy_if_different
        "$<TARGET_FILE_DIR:scanner_wasm>/scanner.wasm"
        "${SCANNER_FRONTEND_WASM_DIR}/scanner.wasm"
      COMMENT "Copying scanner WebAssembly artifacts to ${SCANNER_FRONTEND_WASM_DIR}"
    )
  endif()
else()
  add_library(scanner_wasm_api STATIC
    wasm-api/src/wasm_api.cpp
  )

  target_include_directories(scanner_wasm_api
    PUBLIC
      ${CMAKE_CURRENT_SOURCE_DIR}/wasm-api/include
  )

  target_link_libraries(scanner_wasm_api PRIVATE scanner_core)
endif()
