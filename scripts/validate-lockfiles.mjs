import fs from "node:fs";

const requiredLockfiles = [
  "package-lock.json",
  "circuits/package-lock.json",
  "contracts/Cargo.lock",
];
const missing = requiredLockfiles.filter((file) => !fs.existsSync(file));
if (missing.length > 0) {
  throw new Error(`Missing required lockfiles: ${missing.join(", ")}`);
}

const gitignore = fs.readFileSync(".gitignore", "utf8");
const stillIgnored = [
  "package-lock.json",
  "circuits/package-lock.json",
  "Cargo.lock",
].filter((pattern) =>
  gitignore.split("\n").some((line) => line.trim() === pattern),
);

if (stillIgnored.length > 0) {
  throw new Error(
    `Lockfiles must not be ignored by Git: ${stillIgnored.join(", ")}`,
  );
}

process.stdout.write("Lockfile validation passed.\n");
