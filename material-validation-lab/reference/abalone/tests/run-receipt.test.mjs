import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { buildRunReceipt, carryForwardDiagnostics, runReceiptFileName, gitCommit, writeRunAttempt } from "../tools/run-receipt.mjs";

const swift = { renderer: "ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero)), SwiftShader driver)", userAgent: "Mozilla/5.0 HeadlessChrome/156", vendor: "Google Inc.", glVersion: "WebGL 2.0" };
const hw = { renderer: "ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 Direct3D11)", userAgent: "Mozilla/5.0 Chrome/156", vendor: "Google Inc.", glVersion: "WebGL 2.0" };
const commit = { sha: "b21f2972b7c1e8662a21aa925082974c8a272a42", dirtyWorkingTree: false };
const now = new Date("2026-11-09T18:00:00.000Z");

test("software renderer: inconclusive, compile/render only", () => {
  const r = buildRunReceipt({ label: "inconclusive", commit, environment: swift, browserVersion: "156.0", now });
  assert.equal(r.verdict, "inconclusive");
  assert.equal(r.rendererClass, "software");
  assert.match(r.evidenceScope, /compile and render only/);
  assert.match(r.evidenceScope, /not GPU evidence, not visual evidence/);
  assert.equal(r.commit.sha, commit.sha);
  assert.equal(r.timestamp, "2026-11-09T18:00:00.000Z");
  assert.equal(r.userAgent, swift.userAgent);
});

test("an automated pass is never reported as a pass", () => {
  for (const env of [swift, hw]) assert.equal(buildRunReceipt({ label: "pass", commit, environment: env, now }).verdict, "inconclusive");
});

test("measured fail and blocked are reported as-is", () => {
  assert.equal(buildRunReceipt({ label: "fail", commit, environment: swift, now }).verdict, "fail");
  assert.equal(buildRunReceipt({ label: "blocked", commit, environment: {}, now }).verdict, "blocked");
});

test("missing UA/renderer/commit become 'unavailable'", () => {
  const r = buildRunReceipt({ label: "blocked", commit: undefined, environment: undefined, now });
  assert.equal(r.userAgent, "unavailable");
  assert.equal(r.renderer, "unavailable");
  assert.equal(r.rendererClass, "unavailable");
  assert.equal(r.commit.sha, "unavailable");
  assert.equal(r.browser, "unavailable");
  assert.match(r.evidenceScope, /not GPU evidence/);
});

test("hardware renderer is labelled reported, still needs human review", () => {
  const r = buildRunReceipt({ label: "inconclusive", commit, environment: hw, now });
  assert.equal(r.rendererClass, "hardware-reported");
  assert.match(r.evidenceScope, /human visual review/);
  assert.ok(!JSON.stringify(r).match(/"verdict":"pass"/));
});

test("file name is stable and filesystem-safe", () => {
  const r = buildRunReceipt({ label: "inconclusive", commit, environment: swift, now });
  assert.equal(runReceiptFileName(r), "run-2026-11-09T18-00-00-000Z-b21f297.json");
});

test("gitCommit returns a 40-hex sha or 'unavailable'", () => {
  const c = gitCommit(process.cwd());
  assert.ok(c.sha === "unavailable" || /^[0-9a-f]{40}$/.test(c.sha));
  assert.equal(gitCommit("/").sha, "unavailable");
});

test("a blocked attempt is append-only and does not replace the last complete receipt", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "mvt-abalone-blocked-"));
  const receipts = path.join(root, "receipts"); fs.mkdirSync(receipts);
  const canonical = path.join(receipts, "receipt.json");
  fs.writeFileSync(canonical, "last-complete-receipt\n");
  const blocked = buildRunReceipt({ label: "blocked", commit, environment: undefined, now });
  const attempt = writeRunAttempt(root, blocked);
  assert.equal(fs.readFileSync(canonical, "utf8"), "last-complete-receipt\n");
  assert.deepEqual(JSON.parse(fs.readFileSync(attempt, "utf8")), blocked);
  assert.throws(() => writeRunAttempt(root, blocked), /EEXIST/);
});

test("complete receipt regeneration carries label-inert UV diagnostics forward", () => {
  const diagnostics = { uvCoverage: { label: "measured", h1: { verdict: "inconclusive" } } };
  const previous = { label: "inconclusive", diagnostics };
  const next = { label: "inconclusive", history: [{ run: 7, result: "fail preserved" }] };
  const merged = carryForwardDiagnostics(next, previous);
  assert.deepEqual(merged.diagnostics, diagnostics);
  assert.deepEqual(merged.history, next.history);
  assert.equal(carryForwardDiagnostics({ ...next, diagnostics: { newer: true } }, previous).diagnostics.newer, true);
});
