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
  const defaults = Array.isArray(control.default) ? control.default : [control.default];
  assert(defaults.length > 0 && defaults.every((value) => Number.isFinite(value) && value >= control.min && value <= control.max), `${id}: ${control.key} default outside declared bounds`);
}
function validateRegistry(registry) {
  assert(Array.isArray(registry.statusVocabulary) && registry.statusVocabulary.length > 0, "source registry status vocabulary missing");
  assert(Array.isArray(registry.sources) && registry.sources.length > 0, "source registry sources missing");
  const ids = new Set();
  for (const source of registry.sources) {
    for (const field of ["id", "title", "url", "kind", "license", "freshness", "status"]) {
      assert(typeof source[field] === "string" && source[field].trim().length > 0, `source registry: ${field} missing`);
    }
    assert(!ids.has(source.id), `source registry: duplicate id ${source.id}`);
    ids.add(source.id);
    assert(registry.statusVocabulary.includes(source.status), `source registry: ${source.id} status invalid`);
    assert(Array.isArray(source.usable) && source.usable.length > 0, `source registry: ${source.id} permitted-use list missing`);
    assert(Array.isArray(source.notTransferred) && source.notTransferred.length > 0, `source registry: ${source.id} rejection list missing`);
    assert(Array.isArray(source.assumptionsAndLimits) && source.assumptionsAndLimits.length > 0, `source registry: ${source.id} limits missing`);
  }
  return ids;
}
function validatePassedRecordEvidence(record) {
  if (record.status !== "pass") return;
  assert(Array.isArray(record.resolvedPins) && record.resolvedPins.length === record.requiredPins.length, `${record.id}: pass requires one resolved pin per requirement`);
  const declaredRequirements = new Set(record.requiredPins);
  const resolvedRequirements = new Set();
  for (const pin of record.resolvedPins) {
    assert(typeof pin.requirement === "string" && typeof pin.value === "string" && pin.value.trim().length > 0, `${record.id}: pass requires resolved pin values`);
    assert(declaredRequirements.has(pin.requirement) && !resolvedRequirements.has(pin.requirement), `${record.id}: pass requires each declared pin exactly once`);
    resolvedRequirements.add(pin.requirement);
  }
  assert(resolvedRequirements.size === declaredRequirements.size, `${record.id}: pass requires each declared pin exactly once`);
  const receipt = record.receipt;
  assert(receipt && typeof receipt.command === "string" && receipt.command.length > 0, `${record.id}: pass requires receipt command`);
  assert(receipt.environment && typeof receipt.environment === "object" && Object.keys(receipt.environment).length > 0, `${record.id}: pass requires receipt environment`);
  assert(Array.isArray(receipt.captures) && ["neutral", "grazing", "light-sweep"].every((fixture) => receipt.captures.includes(fixture)), `${record.id}: pass requires controlled capture receipts`);
  assert(typeof receipt.artifactSha256 === "string" && /^[a-f0-9]{64}$/i.test(receipt.artifactSha256), `${record.id}: pass requires receipt artifact SHA-256`);
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
  validatePassedRecordEvidence(record);
}

const manifest = json(path.join(lab, "manifest.json"));
assert(manifest.schemaVersion === "0.1.0", "lab schema version unsupported");
assert(Array.isArray(manifest.records) && manifest.records.length === 3, "exactly three pilot records required");
const registry = json(path.join(lab, "SOURCE_REGISTRY.json"));
const sourceIds = validateRegistry(registry);
for (const relative of manifest.records) validateRecord(json(path.join(lab, relative)), sourceIds);
console.log(`Material Validation Lab: ${manifest.records.length} records valid; source registry aligned.`);
