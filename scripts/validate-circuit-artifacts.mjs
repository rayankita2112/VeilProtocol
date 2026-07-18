import fs from "node:fs";

const requiredArtifacts = [
  "circuits/build/withdraw.r1cs",
  "circuits/build/withdraw.sym",
  "circuits/build/withdraw_js/withdraw.wasm",
  "circuits/build/subset.r1cs",
  "circuits/build/subset.sym",
  "circuits/build/subset_js/subset.wasm",
  "circuits/build/verification_key.json",
  "circuits/build/subset_verification_key.json",
  "app/public/circuits/withdraw.wasm",
  "app/public/circuits/subset.wasm",
  "app/public/circuits/verification_key.json",
  "app/public/circuits/subset_verification_key.json",
];

const missing = requiredArtifacts.filter(
  (artifact) => !fs.existsSync(artifact),
);
if (missing.length > 0) {
  throw new Error(`Missing generated circuit artifacts: ${missing.join(", ")}`);
}

process.stdout.write("Circuit artifact validation passed.\n");
