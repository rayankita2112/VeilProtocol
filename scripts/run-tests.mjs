import fs from "node:fs";
import path from "node:path";
import { runStep } from "./lib/exec.mjs";

const mode = process.argv[2] || "all";

function findFiles(dir, predicate) {
  if (!fs.existsSync(dir)) return [];

  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const resolved = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findFiles(resolved, predicate));
      continue;
    }

    if (predicate(resolved)) {
      results.push(resolved);
    }
  }

  return results;
}

if (mode === "unit" || mode === "all") {
  await runStep("Soroban unit tests", "cargo", [
    "test",
    "--manifest-path",
    "contracts/Cargo.toml",
    "--workspace",
    "--locked",
    "--features",
    "testutils",
  ]);
}

if (mode === "integration" || mode === "all") {
  const integrationTests = ["app", "sdk", "relayer", "scripts"].flatMap((dir) =>
    findFiles(
      dir,
      (file) =>
        file.endsWith(".integration.test.ts") ||
        file.endsWith(".integration.spec.ts") ||
        file.endsWith(".test.mjs") ||
        file.endsWith(".spec.mjs"),
    ),
  );

  if (integrationTests.length > 0) {
    await runStep("Frontend and integration tests", "node", [
      "--test",
      ...integrationTests,
    ]);
  } else {
    process.stdout.write(
      "\n==> Integration tests\nSkipped: no integration tests were found.\n",
    );
  }
}

if (mode === "e2e" || mode === "all") {
  const shouldRun =
    process.env.CI_E2E === "true" || process.env.RUN_E2E === "true";
  if (!shouldRun) {
    process.stdout.write(
      "\n==> End-to-end tests\nSkipped: set CI_E2E=true or RUN_E2E=true to enable the networked e2e flow.\n",
    );
    process.exit(0);
  }

  const required = [
    "POOL_CONTRACT_ID",
    "VERIFIER_CONTRACT_ID",
    "TOKEN_CONTRACT_ID",
    "RELAYER_SECRET_KEY",
  ];
  const missing = required.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required e2e environment variables: ${missing.join(", ")}`,
    );
  }

  await runStep("End-to-end verification", "npx", [
    "tsx",
    "scripts/demo-e2e.ts",
  ]);
}
