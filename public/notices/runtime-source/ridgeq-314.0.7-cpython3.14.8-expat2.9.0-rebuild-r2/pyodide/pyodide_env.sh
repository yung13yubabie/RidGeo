#!/usr/bin/env bash

# get the absolute path of the root folder
# shellcheck disable=SC2164
ROOT=$(cd -- "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 ; pwd -P)

# emsdk_env.sh is fairly noisy, and suppress error message if the file doesn't
# exist yet (i.e. before building emsdk)
# shellcheck source=/dev/null
source "$ROOT/emsdk/emsdk/emsdk_env.sh" 2> /dev/null || true
export PATH="$ROOT/node_modules/.bin/:$PATH:$ROOT/packages/.artifacts/bin/"
EMCC_PATH=$(which emcc.py 2>/dev/null || echo ".")
EM_DIR=$(dirname "$EMCC_PATH")
export EM_DIR

# Following two variables are set by emsdk activated otherwise
# RidGEQ rebuild-r2: empty/0 values are not the same as absent.
unset _EMCC_CCACHE EM_COMPILER_WRAPPER
# mtime of this file is checked by ccache, we set it to avoid cache misses.
export EM_CONFIG="$ROOT/emsdk/emsdk/.emscripten"
