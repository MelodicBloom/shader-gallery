#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const toolsDir = path.dirname(fileURLToPath(import.meta.url));
const sourceRoot = path.resolve(toolsDir, "..");
function makeFixture() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "material-validation-lab-"));
  const copy = path.join(workspace, "source");
  fs.cpSync(sourceRoot, copy, { recursive: true });
  return { workspace, copy };
}
function run(copy) {
  return spawnSync(process.execPath, [path.join(copy, "tools", "validate-material-lab.mjs")], { encoding: "utf8" });
}
function mutate(name, apply, expected) {
  const { workspace, copy } = makeFixture();
  try {
    apply(copy);
    const result = run(copy);
    if (result.status === 0 || !expected.test(result.stderr)) throw new Error(`${name} mutant did not fail at the declared boundary: ${result.stderr || result.stdout}`);
  } finally {
    fs.rmSync(workspace, { recursive: true, force: true });
  }
}

const clean = makeFixture();
try {
  const result = run(clean.copy);
  if (result.status !== 0) throw new Error(`clean extracted source package failed: ${result.stderr || result.stdout}`);
} finally {
  fs.rmSync(clean.workspace, { recursive: true, force: true });
}

mutate("fixture", (copy) => {
  const target = path.join(copy, "material-validation-lab", "materials", "soap-bubble-spectral.record.json");
  const record = JSON.parse(fs.readFileSync(target, "utf8"));
  record.fixtures = ["neutral"];
  fs.writeFileSync(target, JSON.stringify(record, null, 2));
}, /required controlled fixtures missing/);
mutate("scalar bound", (copy) => {
  const target = path.join(copy, "material-validation-lab", "materials", "soap-bubble-spectral.record.json");
  const record = JSON.parse(fs.readFileSync(target, "utf8"));
  record.controls.physics[0].default = 5000;
  fs.writeFileSync(target, JSON.stringify(record, null, 2));
}, /default outside declared bounds/);
mutate("range bound", (copy) => {
  const target = path.join(copy, "material-validation-lab", "materials", "abalone-baseline.record.json");
  const record = JSON.parse(fs.readFileSync(target, "utf8"));
  record.controls.physics[1].default = [-1, 400];
  fs.writeFileSync(target, JSON.stringify(record, null, 2));
}, /default outside declared bounds/);
mutate("registry provenance", (copy) => {
  const target = path.join(copy, "material-validation-lab", "SOURCE_REGISTRY.json");
  const registry = JSON.parse(fs.readFileSync(target, "utf8"));
  delete registry.sources[0].license;
  fs.writeFileSync(target, JSON.stringify(registry, null, 2));
}, /license missing/);
mutate("unreceipted pass", (copy) => {
  const target = path.join(copy, "material-validation-lab", "materials", "gold-foil-field.record.json");
  const record = JSON.parse(fs.readFileSync(target, "utf8"));
  record.status = "pass";
  fs.writeFileSync(target, JSON.stringify(record, null, 2));
}, /pass requires one resolved pin per requirement/);

console.log("✓ material lab validator accepts the extracted package and rejects fixture, bound, provenance, and unreceipted-pass mutants");
