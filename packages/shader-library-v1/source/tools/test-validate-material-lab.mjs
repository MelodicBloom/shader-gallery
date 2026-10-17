#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const toolsDir = path.dirname(fileURLToPath(import.meta.url));
const sourceRoot = path.resolve(toolsDir, "..");
const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "material-validation-lab-"));
const repo = path.join(workspace, "repo");
const copy = path.join(repo, "packages", "shader-library-v1", "source");
fs.cpSync(sourceRoot, copy, { recursive: true });
fs.cpSync(path.resolve(sourceRoot, "..", "..", "..", "material-validation-lab"), path.join(repo, "material-validation-lab"), { recursive: true });
const run = () => spawnSync(process.execPath, [path.join(copy, "tools", "validate-material-lab.mjs")], { encoding: "utf8" });
try {
  const clean = run();
  if (clean.status !== 0) throw new Error(`clean record set failed: ${clean.stderr || clean.stdout}`);
  const target = path.join(copy, "material-validation-lab", "materials", "soap-bubble-spectral.record.json");
  const record = JSON.parse(fs.readFileSync(target, "utf8"));
  record.fixtures = ["neutral"];
  fs.writeFileSync(target, JSON.stringify(record, null, 2));
  const mutant = run();
  if (mutant.status === 0 || !/required controlled fixtures missing/.test(mutant.stderr)) throw new Error(`mutant did not fail at the declared boundary: ${mutant.stderr || mutant.stdout}`);
  console.log("✓ material lab validator accepts clean records and rejects missing-fixture mutant");
} finally {
  fs.rmSync(workspace, { recursive: true, force: true });
}
