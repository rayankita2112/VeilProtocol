import fs from "node:fs";
import path from "node:path";

const scanRoot = process.argv[2] || ".";
const ignoredDirectories = new Set([
  "node_modules",
  ".next",
  "dist",
  "target",
  "build",
  ".git",
]);
const ignoredExtensions = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".wasm",
  ".zkey",
  ".r1cs",
  ".ptau",
]);
const patterns = [
  { name: "PEM private key", regex: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  { name: "Stellar secret key", regex: /\bS[A-Z2-7]{55}\b/ },
  { name: "AWS access key", regex: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: "GitHub token", regex: /\bgh[pousr]_[A-Za-z0-9]{36,}\b/ },
];

const findings = [];

function walk(currentPath) {
  for (const entry of fs.readdirSync(currentPath, { withFileTypes: true })) {
    const resolved = path.join(currentPath, entry.name);
    if (entry.isDirectory()) {
      if (ignoredDirectories.has(entry.name)) continue;
      walk(resolved);
      continue;
    }

    if (ignoredExtensions.has(path.extname(entry.name))) continue;
    if (entry.name === ".env") continue;

    const content = fs.readFileSync(resolved, "utf8");
    for (const pattern of patterns) {
      if (pattern.regex.test(content)) {
        findings.push(`${resolved}: matched ${pattern.name}`);
      }
    }
  }
}

walk(scanRoot);

if (findings.length > 0) {
  throw new Error(`Secret scan failed:\n${findings.join("\n")}`);
}

process.stdout.write("Secret scan passed.\n");
