import fs from "node:fs";
import { run } from "./lib/exec.mjs";

const disallowed = (process.env.DISALLOWED_LICENSES || "")
  .split(",")
  .map((license) => license.trim())
  .filter(Boolean);
const outputs = [
  { cwd: ".", file: "license-report.json" },
  { cwd: "circuits", file: "../circuits-license-report.json" },
];

for (const output of outputs) {
  await run(
    "sh",
    ["-c", `npx license-checker-rseidelsohn --json > ${output.file}`],
    {
      cwd: output.cwd,
    },
  );
}

const reports = ["license-report.json", "circuits-license-report.json"].flatMap(
  (file) => Object.entries(JSON.parse(fs.readFileSync(file, "utf8"))),
);

const violations = reports
  .map(([pkg, meta]) => [
    pkg,
    Array.isArray(meta.licenses)
      ? meta.licenses.join(", ")
      : String(meta.licenses),
  ])
  .filter(([, licenses]) =>
    disallowed.some((license) => licenses.includes(license)),
  )
  .map(([pkg, licenses]) => `${pkg}: ${licenses}`);

if (disallowed.length > 0 && violations.length > 0) {
  throw new Error(
    `Disallowed dependency licenses detected:\n${violations.join("\n")}`,
  );
}

if (violations.length > 0) {
  process.stdout.write(
    `License validation completed with policy findings.\nPotentially restricted licenses detected:\n${violations.join(
      "\n",
    )}\n`,
  );
} else {
  process.stdout.write("License validation passed.\n");
}
