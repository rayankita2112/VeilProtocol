import fs from "node:fs";
import path from "node:path";

const requiredRootVars = [
  "STELLAR_NETWORK",
  "STELLAR_RPC_URL",
  "POOL_CONTRACT_ID",
  "VERIFIER_CONTRACT_ID",
  "TOKEN_CONTRACT_ID",
  "RELAYER_URL",
];
const requiredAppVars = [
  "NEXT_PUBLIC_STELLAR_NETWORK",
  "NEXT_PUBLIC_STELLAR_RPC_URL",
  "NEXT_PUBLIC_POOL_CONTRACT_ID",
  "NEXT_PUBLIC_RELAYER_URL",
];

function parseEnvFile(filePath) {
  return fs
    .readFileSync(filePath, "utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => line.split("=")[0]);
}

function validateTemplate(filePath, requiredVars) {
  const vars = new Set(parseEnvFile(filePath));
  const missing = requiredVars.filter((name) => !vars.has(name));
  if (missing.length > 0) {
    throw new Error(
      `${filePath} is missing required variables: ${missing.join(", ")}`,
    );
  }
}

validateTemplate(".env.example", requiredRootVars);
validateTemplate(path.join("app", ".env.example"), requiredAppVars);

const deployment = JSON.parse(
  fs.readFileSync("config/testnet-deployment.json", "utf8"),
);
const forbiddenKeys = [
  "deployerSecretKey",
  "relayerSecretKey",
  "submitterSecretKey",
];
const committedSecrets = forbiddenKeys.filter((key) => key in deployment);
if (committedSecrets.length > 0) {
  throw new Error(
    `config/testnet-deployment.json must not contain committed secret material: ${committedSecrets.join(", ")}`,
  );
}

process.stdout.write("Environment template validation passed.\n");
