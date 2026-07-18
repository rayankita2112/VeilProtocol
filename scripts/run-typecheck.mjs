import { runStep } from "./lib/exec.mjs";

await runStep("Typecheck SDK", "npx", [
  "tsc",
  "--project",
  "sdk/tsconfig.json",
  "--noEmit",
]);
await runStep("Typecheck Relayer", "npx", [
  "tsc",
  "--project",
  "relayer/tsconfig.json",
  "--noEmit",
]);
await runStep("Typecheck App", "npx", [
  "tsc",
  "--project",
  "app/tsconfig.json",
  "--noEmit",
]);
