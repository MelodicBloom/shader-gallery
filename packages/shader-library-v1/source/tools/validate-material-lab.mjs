#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const lab = path.join(root, "material-validation-lab");
const fail = (message) => { throw new Error(message); };
const json = (file) => JSON.parse(fs.readFileSync(file, "utf8"));

function assert(condition, message) { if (!condition) fail(message); }
function checkControl(control, id) {
  assert(typeof control.key === "string" && control.key.length > 0, `${id}: control key missing`);
  assert(typeof control.unit === "string" && control.unit.length > 0, `${id}: ${control.key} unit missing`);
  assert(Number.isFinite(control.min) && Number.isFinite(control.max) && control.min <= control.max, `${id}: ${control.key} bounds invalid`);
  assert(control.default !== undefined, `${id}: ${control.key} default missing`);
}
function validateRecord(record, expectedSourceIds) {
  assert(/^MVT-[A-Z]+-\d{3}$/.test(record.id), `record id invalid: ${record.id}`);
  assert(record.status === "planned" || record.status === "pass" || record.status === "fail" || record.status === "blocked" || record.status === "inconclusive", `${record.id}: status invalid`);
  assert(Array.isArray(record.sourceRefs) && record.sourceRefs.length > 0, `${record.id}: source refs missing`);
  for (const source of record.sourceRefs) assert(expectedSourceIds.has(source), `${record.id}: unknown source ${source}`);
  assert(Array.isArray(record.requiredPins) && record.requiredPins.length > 0, `${record.id}: revision pin requirements missing`);
  assert(Array.isArray(record.fixtures) && ["neutral", "grazing", "light-sweep"].every((fixture) => record.fixtures.includes(fixture)), `${record.id}: required controlled fixtures missing`);
  assert(record.fallback?.required === true && typeof record.fallback.label === "string", `${record.id}: labeled fallback missing`);
  assert(Array.isArray(record.modelBoundary?.claims) && Array.isArray(record.modelBoundary?.nonClaims), `${record.id}: model boundary missing`);
  assert(record.controls && Array.isArray(record.controls.physics) && Array.isArray(record.controls.art), `${record.id}: separate physics/art controls required`);
  for (const control of [...record.controls.physics, ...record.controls.art]) checkControl(control, record.id);
}

const manifest = json(path.join(lab, "manifest.json"));
assert(manifest.schemaVersion === "0.1.0", "lab schema version unsupported");
assert(Array.isArray(manifest.records) && manifest.records.length === 3, "exactly three pilot records required");
const registry = json(path.resolve(root, "..", "..", "..", "material-validation-lab", "SOURCE_REGISTRY.json"));
const sourceIds = new Set(registry.sources.map((source) => source.id));
for (const relative of manifest.records) validateRecord(json(path.join(lab, relative)), sourceIds);
console.log(`Material Validation Lab: ${manifest.records.length} records valid; source registry aligned.`);
