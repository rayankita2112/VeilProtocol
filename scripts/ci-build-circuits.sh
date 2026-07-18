#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BUILD_DIR="$ROOT_DIR/circuits/build"
PUBLIC_DIR="$ROOT_DIR/app/public/circuits"

if ! command -v circom >/dev/null 2>&1; then
  echo "circom is required to build circuits"
  exit 1
fi

if [ ! -d "$ROOT_DIR/circuits/node_modules/circomlib" ]; then
  echo "circuits/node_modules/circomlib is missing. Run 'npm ci --prefix circuits' first."
  exit 1
fi

mkdir -p "$BUILD_DIR" "$PUBLIC_DIR"

circom "$ROOT_DIR/circuits/withdraw.circom" \
  --r1cs \
  --wasm \
  --sym \
  --output "$BUILD_DIR" \
  -l "$ROOT_DIR/circuits/node_modules"

circom "$ROOT_DIR/circuits/subset.circom" \
  --r1cs \
  --wasm \
  --sym \
  --output "$BUILD_DIR" \
  -l "$ROOT_DIR/circuits/node_modules"

cp "$BUILD_DIR/withdraw_js/withdraw.wasm" "$PUBLIC_DIR/withdraw.wasm"
cp "$BUILD_DIR/subset_js/subset.wasm" "$PUBLIC_DIR/subset.wasm"

# Verification keys come from the trusted-setup ceremony and are tracked in
# git; stage them into the build dir for consumers that read from there.
cp "$ROOT_DIR/circuits/verification_key.json" "$BUILD_DIR/verification_key.json"
cp "$PUBLIC_DIR/subset_verification_key.json" "$BUILD_DIR/subset_verification_key.json"
