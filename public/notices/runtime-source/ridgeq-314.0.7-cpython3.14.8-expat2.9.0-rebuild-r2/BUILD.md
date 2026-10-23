# RidGEQ r2 corresponding source and rebuild recipe

Runtime identity: `ridgeq-314.0.7-cpython3.14.8-expat2.9.0-rebuild-r2`.
This is a new custom derivation, not the official Pyodide distribution and not
recovery of any earlier custom runtime. Keep the API version `314.0.7`, CPython
`3.14.8`, Expat `2.9.0`, ABI `2026_0`, platform `emscripten_5_0_3`, and `wasm32`.

This directory supplies the actual four modified Pyodide configuration files,
the exact CPython patch sequence and upstream-satisfied marker, the extra
trampoline patch, and pinned acquisition identities. It is a source recipe,
not a claim that an independent rebuild has produced bit-identical binaries.
The commands below are instructions for a new isolated build, not evidence of
execution. A fresh rebuild must pass its own source, output and runtime tests.

## 1. Acquire and verify inputs

Use `upstream-sources.json` for the exact official source URLs, commits, archive
sizes and SHA-256 values. Download each input to a separate `downloads` directory
and verify its recorded size and digest before extraction or execution. Source
archive hashes are content pins; where no vendor signature was verified, do
not describe them as an independent authenticity attestation.

Create a new work directory. In the examples, `SOURCE` is this source directory,
`WORK` is the new work directory, `P` is `$WORK/pyodide`, `CP` is
`$P/cpython/build/Python-3.14.8`, and `DEPS` is `$WORK/native-sources`. These are
variables chosen by the person rebuilding, not fixed machine paths. Do not
build inside a production checkout or an existing installed runtime.

Extract the pinned Pyodide archive into `P`, its pinned pyodide-build archive
into `P/pyodide-build`, and the pinned Python archive into `CP`. Use a safe
archive extractor that rejects paths escaping the destination, such as
Python 3.12+ `tarfile` with the `data` filter. The original archive root names
are in `upstream-sources.json`; remove only their one enclosing root directory.

## 2. Apply the supplied source modifications

Replace these four files in the fresh Pyodide source with the identically named
files from `SOURCE/pyodide/`:

- `Makefile.envs`
- `pyodide_env.sh`
- `emsdk/Makefile`
- `cpython/Makefile`

Replace the complete upstream `cpython/patches` directory with the ten supplied
files in `SOURCE/pyodide/cpython/patches`. The replacement matters: do not leave
the original `0009*.patch` alongside the supplied marker.

Before applying patches, normalize CRLF to LF only in these four Python files:
`PCbuild/_elementtree.vcxproj`, `PCbuild/_elementtree.vcxproj.filters`,
`PCbuild/pyexpat.vcxproj`, `PCbuild/pyexpat.vcxproj.filters`. This is required by
the unchanged official Expat backport. Do not broadly normalize the source.

Apply `0001` through `0008`, then `0010`, in lexical order with `git apply
--check`, `git apply`, and `git apply --reverse --check` after each successful
application. Use a clean Git environment, clearing `GIT_DIR`, `GIT_WORK_TREE`,
`GIT_INDEX_FILE`, and `GIT_COMMON_DIR`, and set `GIT_CEILING_DIRECTORIES` to the
parent of the target tree. No fuzz or silent patch skipping is permitted.

`0001` is the supplied one-keyword visibility change rebased onto CPython
3.14.8's new context. `0002`–`0008` are unchanged Pyodide patches. The file
`0009-Fix-Emscripten-trampoline-with-emcc-4.0.19.patch.upstream-satisfied` is an
exact retained upstream patch, NOT an additional patch to apply. Its C/header
changes already exist in Python 3.14.8. Verify its C/header reverse check with
`configure` and `configure.ac` excluded, then verify this exact string in both
configuration files:

```
-sEXPORTED_FUNCTIONS=_main,_Py_Version,__PyRuntime,_PyGILState_GetThisThreadState,__Py_DumpTraceback,__PyEM_EMSCRIPTEN_TRAMPOLINE_OFFSET
```

Full reverse applicability of `0009` is not claimed because neighboring
configuration context has changed. `0010` is the exact CPython upstream Expat
2.9.0 backport. After applying it, verify `Modules/expat/xcs.c` and `xcs.h`
exist, `xcsinc.c` does not, and the Expat version defines are `2`, `9`, `0`.

Finally apply `SOURCE/trampoline-threads.patch` to `CP` with the same checked
procedure. It adds only `-Wl,--threads=1` to the direct trampoline linker call
in `Makefile.pre.in`; preserve the remaining ABI-affecting flags. Do not apply
this patch to a generated Makefile instead.

Copy the verified `Python-3.14.8.tgz` to `P/cpython/downloads`. Mark `CP/.patched`
only after the complete sequence and assertions have passed, so a later make
step does not reapply the patches. This stamp means source preparation, not
successful compilation. The supplied `cpython/Makefile` uses
`Platforms/emscripten/config.site-wasm32-emscripten` and removes only its
`ac_cv_func_shutdown=no` line at configuration time. Keep that behavior.

## 3. Provision host and SDK without floating dependencies

Use Linux x86_64, a native CPython 3.14.8 host with ssl, zlib, bz2, lzma and
hashlib, CMake 3.31.6, M4 1.4.19, Autoconf 2.72, Automake 1.17 and Libtool 2.5.4.
Keep host compiler/system-library provenance with the rebuild. The original
base-image digest is not supplied here, so this recipe must not be presented
as a fully reproducible operating-system image.

Create a Python 3.14.8 virtual environment. Obtain the exact wheels listed in
`python_build_wheels`, verify each hash, generate requirements entries of the
form `name==version --hash=sha256:digest`, and install with `--no-index`,
`--find-links` and `--require-hashes`. Install the supplied pinned pyodide-build
source with `--no-deps --no-build-isolation -e`, setting
`SETUPTOOLS_SCM_PRETEND_VERSION_FOR_PYODIDE_BUILD=0.0.0+ridgeq.r2.79fb82b2`.
Then run `python -m pip check`. Do not install the entire upstream requirements
file: its build-package constraint differs from the selected builder.

Use the emsdk commit, SDK 5.0.3 archive and Node 22.16.0 archive in the public
manifest. Extract the SDK archive's `install` root as the pinned emsdk's
`upstream` directory and place Node under its `node/22.16.0_64bit` directory.
Configure the SDK to use those exact tools and the native Python environment;
do not substitute a global compiler or a newer Node. Verify compiler identity
and the SDK's structure-info compatibility before accepting the SDK setup.

Apply the five upstream `emsdk/patches/*.patch` files from the pinned Pyodide
source in order to the extracted Emscripten source. Their exact hashes are in
`emscripten_patches`. The unpatched official SDK is not an equivalent toolchain.
Only after installation and these checks may `P/emsdk/.complete` suppress the
upstream SDK installation rule. Likewise, only after the checked Python
builder install may `.pyodide_build_installed` suppress its installation rule.

Install JavaScript dependencies using the pinned `src/js/package-lock.json`
whose SHA-256 is in the public manifest. Use `npm ci --ignore-scripts --no-audit
--no-fund`; do not regenerate the lock. Stage required archives first, then run
the compilation offline. Explicitly supply the installed local executables
so `npx` cannot download a missing build tool.

## 4. Native WASM dependencies

Extract the pinned libffi, hiwire, XZ, zstd and SQLite archives into separate
fresh directories under `DEPS`. Use Emscripten 5.0.3 from the patched SDK for
all five. Seed the Emscripten bzip2 1.0.6 and zlib 1.3.1 ports from the exact
pinned archives, not a new network fetch; retain the port-source URL markers
required by the SDK. These two archives also match the SDK port definitions'
SHA-512 anchors. SDK-generated `zconf.h` is generated output, not an upstream
source modification.

Use one worker throughout: `MAKEFLAGS=-j1`, `EMCC_CORES=1`,
`EMSDK_NUM_CORES=1`, `BINARYEN_CORES=1`, `CMAKE_BUILD_PARALLEL_LEVEL=1`,
`PYODIDE_JOBS=1`, `GOMAXPROCS=1`, `NODE_OPTIONS=--v8-pool-size=1`, and
`UV_THREADPOOL_SIZE=1`. Unset `_EMCC_CCACHE` and `EM_COMPILER_WRAPPER` rather
than setting either to an empty string or zero. Set `OPTFLAGS=-O2`,
`DBGFLAGS=-g0`, `LANG=C.UTF-8`, `LC_ALL=C.UTF-8`, and `TZ=UTC`. Use private,
empty HOME/temp/cache directories and explicit EM_CONFIG, EM_CACHE and EM_PORTS.

Run these source-owned commands in each named dependency directory, using the
pinned tools on PATH:

- libffi: `LDFLAGS=-Wl,--threads=1 bash testsuite/emscripten/build.sh --wasm-bigint`,
  then `make -j1 install`. Preserve the build script's configured install layout.
- hiwire: `CC=emcc EMSCRIPTEN_DEDUPLICATE=1 EXTERN_FAIL=1 make -j1`.
- XZ: `LDFLAGS=-Wl,--threads=1 emconfigure ./configure 'CFLAGS=-fPIC -Os'
  --disable-xz --disable-xzdec --disable-lzmadec --disable-lzmainfo
  --disable-lzma-links --disable-scripts --disable-doc --enable-shared=no
  --disable-dependency-tracking --prefix="$PWD/dist"`; then
  `emmake make -j1` and `emmake make -j1 install`.
- zstd: `emcmake cmake build/cmake -B build-wasm -G 'Unix Makefiles'
  -DCMAKE_BUILD_TYPE=MinSizeRel -DCMAKE_C_FLAGS=-fPIC
  -DCMAKE_EXE_LINKER_FLAGS=-Wl,--threads=1
  -DCMAKE_SHARED_LINKER_FLAGS=-Wl,--threads=1
  -DCMAKE_MODULE_LINKER_FLAGS=-Wl,--threads=1 -DZSTD_BUILD_SHARED=OFF
  -DZSTD_BUILD_STATIC=ON -DZSTD_BUILD_PROGRAMS=OFF -DZSTD_BUILD_TESTS=OFF
  -DZSTD_BUILD_CONTRIB=OFF -DZSTD_MULTITHREAD_SUPPORT=OFF
  -DZSTD_LEGACY_SUPPORT=OFF -DCMAKE_INSTALL_PREFIX="$PWD/dist"`; then
  `emmake make -j1 -C build-wasm` and
  `emmake make -j1 -C build-wasm install`.
- SQLite: `LDFLAGS=-Wl,--threads=1 emconfigure ./configure
  'CFLAGS=-fPIC -Os' --disable-readline --disable-threadsafe --disable-shared
  --enable-static --disable-static-shell --disable-dependency-tracking
  --prefix="$PWD/dist"`; then `emmake make -j1 libsqlite3.la` and
  `emmake make -j1 install-libLTLIBRARIES install-includeHEADERS`.

Stage only the resulting static WASM libraries and public headers into
`P/cpython/installs/python-3.14.8`: `lib/libffi.a`, `lib/libhiwire.a`,
`lib/liblzma.a`, `lib/libzstd.a`, `lib/libsqlite3.a`, and corresponding headers
under `include/libffi`, `include/hiwire`, `include/lzma`, `include/zstd`,
`include/sqlite3`. Copy libffi headers into `CP/Include`. Mirror the XZ, zstd,
and SQLite headers/libraries into `P/cpython/build/{lzma,zstd,sqlite3}/dist`
as expected by the unchanged core recipes. Reject native ELF libraries or
unexpected symlinks; do not replace target libraries with host libraries.

## 5. Configure and build the minimal core

Use the prepared host environment and patched SDK. In `P/cpython`, run:

```sh
DEST="$P/cpython/installs/python-3.14.8"
LDFLAGS='-Wl,--threads=1' \
LIBSQLITE3_CFLAGS="-I$DEST/include/sqlite3" \
LIBSQLITE3_LIBS="-L$DEST/lib -lsqlite3" \
make -j1 SHELL=/bin/bash '.SHELLFLAGS=-e -o pipefail -c' \
  BASH_ENV=/dev/null COMPILEALL_OPTS=-j1 EXTRA_LDFLAGS=-Wl,--threads=1 \
  ENABLE_PREBUILT_PACKAGES=0 'PYODIDE_PACKAGES=!micropip,!test,!pydoc_data' \
  -W "$CP/.patched" python-makefile
```

The explicit SQLite flags are required, not optional documentation. Verify
configuration selects sqlite3 headers, required sqlite3 functions and the
`_sqlite3` module before continuing. Preserve upstream `Modules/Setup.local`
and the generated configuration.

Still in `P/cpython`, use the same make options to build
`$DEST/lib/libpython3.14.a`. In `P`, use those same options to build
`all-but-packages dist/pyodide-lock.json`. The selected query is exactly
`!micropip,!test,!pydoc_data` with prebuilt packages disabled. An empty query is
not equivalent because upstream always-tagged packages would otherwise enter
the graph. Do not run the default broader `all` target or add wheels silently.

## 6. Validate and distribute coherently

A successful make exit is necessary but insufficient. Check the final lock has
exactly the stated runtime identity and an empty packages object. Load the
actual coherent loader, assembly glue, WASM, standard-library ZIP and lock to
verify Python 3.14.8 and Expat 2.9.0, including constructor/entropy/security
behavior rather than checking version strings alone. Application integration,
worker cancellation and retry behavior, regression tests and browser acceptance
are separate required checks.

Preserve `pyodide.mjs`, `pyodide.asm.mjs`, `pyodide.asm.wasm`,
`python_stdlib.zip` and `pyodide-lock.json` together. Preserve any maps referenced
by served JavaScript, and inventory every served asset by size and SHA-256.
Publish only under the custom runtime identity, never as the official npm
package or by overwriting an older runtime path. Keep the three named Python
and Expat license files, the source files here, and the versioned notices.
All 500 collected build notices belong in the build checkpoint; the 33
non-npm files are the conservative public subset. This subset does not assert
that every collected component is linked into the final runtime.
