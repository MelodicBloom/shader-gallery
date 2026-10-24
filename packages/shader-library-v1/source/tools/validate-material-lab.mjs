#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
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
  if (Array.isArray(control.default)) assert(defaults.length === 2, `${id}: ${control.key} range default must have exactly two values`);
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
  return new Map(registry.sources.map((source) => [source.id, source]));
}
function validatePassedRecordEvidence(record) {
  if (record.status !== "pass") return;
  assert(Array.isArray(record.resolvedPins) && record.resolvedPins.length === record.requiredPins.length, `${record.id}: pass requires one resolved pin per requirement`);
  const declaredRequirements = new Set(record.requiredPins);
  const resolvedRequirements = new Set();
  for (const pin of record.resolvedPins) {
    assert(typeof pin.requirement === "string" && typeof pin.value === "string" && pin.value.trim().length > 0, `${record.id}: pass requires resolved pin values`);
    assert(declaredRequirements.has(pin.requirement) && !resolvedRequirements.has(pin.requirement), `${record.id}: pass requires each declared pin exactly once`);
    assert(!/\b(?:TO_PIN|TBD|PLACEHOLDER)\b/i.test(pin.value), `${record.id}: pass cannot retain placeholder pin values`);
    resolvedRequirements.add(pin.requirement);
  }
  assert(resolvedRequirements.size === declaredRequirements.size, `${record.id}: pass requires each declared pin exactly once`);
  const receipt = record.receipt;
  assert(receipt && typeof receipt.command === "string" && receipt.command.length > 0, `${record.id}: pass requires receipt command`);
  assert(receipt.environment && ["browser", "renderer", "gpu"].every((key) => typeof receipt.environment[key] === "string" && receipt.environment[key].trim().length > 0), `${record.id}: pass requires browser, renderer, and GPU environment`);
  assert(receipt.review && receipt.review.decision === "pass" && typeof receipt.review.reviewer === "string" && receipt.review.reviewer.trim().length > 0 && typeof receipt.review.rationale === "string" && receipt.review.rationale.trim().length > 0, `${record.id}: pass requires a human review outcome`);
  const fixtures = ["neutral", "grazing", "light-sweep"];
  assert(Array.isArray(receipt.captures) && receipt.captures.length === fixtures.length, `${record.id}: pass requires three controlled capture receipts`);
  const seenFixtures = new Set();
  for (const capture of receipt.captures) {
    assert(capture && fixtures.includes(capture.fixture) && !seenFixtures.has(capture.fixture), `${record.id}: capture fixture invalid or duplicated`);
    seenFixtures.add(capture.fixture);
    assert(Array.isArray(capture.camera) && capture.camera.length === 3 && capture.camera.every(Number.isFinite), `${record.id}: capture camera receipt invalid`);
    assert(Array.isArray(capture.light) && capture.light.length === 3 && capture.light.every(Number.isFinite), `${record.id}: capture light receipt invalid`);
    assert(Number.isFinite(capture.exposure), `${record.id}: capture exposure receipt invalid`);
    assert(capture.materialState && typeof capture.materialState === "object" && Object.keys(capture.materialState).length > 0, `${record.id}: capture material state missing`);
    assert(typeof capture.artifactPath === "string" && capture.artifactPath.length > 0 && !path.isAbsolute(capture.artifactPath) && !capture.artifactPath.split(/[\\/]/).includes(".."), `${record.id}: capture artifact path invalid`);
    assert(typeof capture.sha256 === "string" && /^[a-f0-9]{64}$/i.test(capture.sha256), `${record.id}: capture artifact SHA-256 invalid`);
    const artifact = path.join(lab, capture.artifactPath);
    assert(fs.existsSync(artifact) && fs.statSync(artifact).isFile(), `${record.id}: capture artifact missing`);
    assert(crypto.createHash("sha256").update(fs.readFileSync(artifact)).digest("hex") === capture.sha256, `${record.id}: capture artifact hash mismatch`);
  }
}
function validateRecord(record, sourcesById) {
  assert(/^MVT-[A-Z]+-\d{3}$/.test(record.id), `record id invalid: ${record.id}`);
  assert(record.trial === record.id, `${record.id}: trial must match record id`);
  assert(record.status === "planned" || record.status === "pass" || record.status === "fail" || record.status === "blocked" || record.status === "inconclusive", `${record.id}: status invalid`);
  assert(Array.isArray(record.sourceRefs) && record.sourceRefs.length > 0, `${record.id}: source refs missing`);
  for (const sourceId of record.sourceRefs) {
    const source = sourcesById.get(sourceId);
    assert(source, `${record.id}: unknown source ${sourceId}`);
    assert(source.status !== "excluded", `${record.id}: excluded source ${sourceId} cannot be referenced`);
  }
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
assert(new Set(manifest.records).size === manifest.records.length, "pilot record paths must be distinct");
const registry = json(path.join(lab, "SOURCE_REGISTRY.json"));
const sourcesById = validateRegistry(registry);
const records = manifest.records.map((relative) => json(path.join(lab, relative)));
assert(new Set(records.map((record) => record.id)).size === records.length, "pilot record ids must be distinct");
for (const record of records) validateRecord(record, sourcesById);
console.log(`Material Validation Lab: ${manifest.records.length} records valid; source registry aligned.`);
