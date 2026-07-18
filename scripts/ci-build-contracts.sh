#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
VK_PATH="$ROOT_DIR/circuits/build/verification_key.json"

if [ ! -f "$VK_PATH" ]; then
  echo "verification key missing at $VK_PATH"
  exit 1
fi

VERIFIER_VK_JSON="$VK_PATH" cargo build \
  --manifest-path "$ROOT_DIR/contracts/Cargo.toml" \
  --workspace \
  --target wasm32v1-none \
  --release \
  --locked

cargo test \
  --manifest-path "$ROOT_DIR/contracts/Cargo.toml" \
  --workspace \
  --locked \
  --features testutils
