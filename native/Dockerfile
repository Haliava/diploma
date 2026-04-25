# syntax=docker/dockerfile:1

FROM ubuntu:24.04 AS build
ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    build-essential \
    ca-certificates \
    cmake \
    libopencv-dev \
    ninja-build \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /src
COPY CMakeLists.txt CMakePresets.json ./
COPY scanner ./scanner
COPY wasm-api ./wasm-api

RUN cmake -S . -B build -G Ninja -DCMAKE_BUILD_TYPE=Release \
  && cmake --build build --config Release

FROM ubuntu:24.04 AS artifact
WORKDIR /artifacts
COPY --from=build /src/build ./build
CMD ["bash", "-lc", "find /artifacts/build -maxdepth 3 -type f | sort"]
