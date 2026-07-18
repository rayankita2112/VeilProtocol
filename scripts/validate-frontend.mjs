import fs from "node:fs";
import { runStep } from "./lib/exec.mjs";

if (!fs.existsSync(".env") || !fs.existsSync("app/.env.local")) {
  await runStep("Generate local env files", "node", [
    "scripts/write-testnet-config.mjs",
  ]);
}

await runStep("Validate frontend circuit assets", "node", [
  "scripts/validate-circuit-artifacts.mjs",
]);
await runStep("Build SDK", "npm", ["run", "build", "--workspace=sdk"]);
await runStep("Build Relayer", "npm", ["run", "build", "--workspace=relayer"]);
await runStep("Build App", "npm", ["run", "build", "--workspace=app"]);
