import fs from "node:fs";
import path from "node:path";

const environment =
  process.argv[2] || process.env.DEPLOY_ENVIRONMENT || "development";
const version =
  process.env.RELEASE_VERSION ||
  process.env.GITHUB_REF_NAME ||
  `snapshot-${new Date().toISOString().replace(/[:.]/g, "-")}`;
const outputDir = path.join("deploy", "artifacts", `${environment}-${version}`);

fs.rmSync(outputDir, { recursive: true, force: true });
fs.mkdirSync(outputDir, { recursive: true });

const filesToCopy = [
  "config/testnet-deployment.json",
  "contracts/target/wasm32v1-none/release/groth16_verifier.wasm",
  "contracts/target/wasm32v1-none/release/swap_router.wasm",
  "contracts/target/wasm32v1-none/release/veil_pool.wasm",
  "app/public/circuits/verification_key.json",
  "app/public/circuits/subset_verification_key.json",
  "app/public/circuits/withdraw.wasm",
  "app/public/circuits/subset.wasm",
];

for (const file of filesToCopy) {
  if (!fs.existsSync(file)) continue;
  const target = path.join(outputDir, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(file, target);
}

const manifest = {
  environment,
  version,
  generatedAt: new Date().toISOString(),
  bundlePath: outputDir,
};

fs.writeFileSync(
  path.join(outputDir, "deployment-manifest.json"),
  JSON.stringify(manifest, null, 2),
);
process.stdout.write(`${outputDir}\n`);
