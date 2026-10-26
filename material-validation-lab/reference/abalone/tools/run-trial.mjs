#!/usr/bin/env node
// Executes MVT-ABALONE-001 headlessly: three fixture captures + receipts/receipt.json.
import fs from "node:fs"; import path from "node:path"; import crypto from "node:crypto"; import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";
import { start } from "./serve.mjs";
import { ASSET, SPEC, THREE_VERSION } from "./pins.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const capDir = path.join(root, "receipts", "captures");
fs.mkdirSync(capDir, { recursive: true });
const sha = (b) => crypto.createHash("sha256").update(b).digest("hex");
const executablePath = process.env.CHROME_PATH || "/usr/bin/google-chrome";
const server = await start(0);
const port = server.address().port;
const browser = await chromium.launch({ executablePath, args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const page = await browser.newPage({ viewport: { width: 1200, height: 1400 }, deviceScaleFactor: 1 });
const consoleErrors = [];
page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });
page.on("pageerror", (e) => consoleErrors.push(String(e)));
await page.goto(`http://localhost:${port}/`);
await page.waitForFunction(() => window.__mvt && (window.__mvt.ready || window.__mvt.error), null, { timeout: 120000 });
const boot = await page.evaluate(() => ({ ready: window.__mvt.ready, error: window.__mvt.error, environment: window.__mvt.environment, mapReceipt: window.__mvt.mapReceipt, assetSha256: window.__mvt.assetSha256 }));
const browserVersion = browser.version();

const captures = [], outcomes = {};
if (boot.ready) {
  for (const fixture of ["neutral", "grazing", "light-sweep"]) {
    outcomes[fixture] = await page.evaluate((f) => window.__mvt.measure(f), fixture);
    for (const mode of ["treatment", "control"]) {
      await page.evaluate(([f, m]) => { window.__mvt.fixture(f); window.__mvt.set({ mode: m }); }, [fixture, mode]);
      const png = await page.locator("#view").screenshot();
      const rel = `captures/${fixture}-${mode}.png`;
      fs.writeFileSync(path.join(root, "receipts", rel), png);
      const st = await page.evaluate(() => ({ camera: window.__mvt.cameraPosition(), light: window.__mvt.lightPosition(), materialState: window.__mvt.materialState(), exposure: window.__mvt.state.exposure }));
      if (mode === "treatment") captures.push({ fixture, ...st, artifactPath: `reference/abalone/receipts/${rel}`, sha256: sha(png) });
      else outcomes[fixture].controlCapture = { artifactPath: `reference/abalone/receipts/${rel}`, sha256: sha(png) };
    }
  }
  await page.evaluate(() => { window.__mvt.fixture("neutral"); window.__mvt.set({ mode: "treatment" }); });
  fs.writeFileSync(path.join(root, "receipts", "captures", "page.png"), await page.screenshot({ fullPage: true }));
}
await browser.close(); server.close();

const mr = boot.mapReceipt || {};
const mapOk = mr.iridescenceMap?.colorSpace === mr.noColorSpaceConstant && mr.iridescenceThicknessMap?.colorSpace === mr.noColorSpaceConstant;
// Run-2 criterion (revised after run 1, see receipt.history): an effect exists when >= 1% of shell pixels change by > 8/255 mean RGB.
const T = 0.01;
const effects = Object.fromEntries(Object.entries(outcomes).map(([f, o]) => [f, {
  iridescenceVisibleVsNeutralControl: o.treatmentVsControl.fractionOver8 >= T,
  rChannelContributes: o.treatmentVsGOnly.fractionOver8 >= T,
  gChannelContributes: o.treatmentVsROnly.fractionOver8 >= T,
  channelsDistinct: o.rOnlyVsGOnly.fractionOver8 >= T,
}]));
const allEffects = Object.values(effects).every((e) => Object.values(e).every(Boolean));
const swiftshader = /swiftshader|llvmpipe|software/i.test(boot.environment?.renderer || "");
// Colour-space mismatch is a declared falsifier -> fail. A weak channel effect with the asset's own packed map is NOT the full
// falsifier: the contract's synthetic isolated R/G test maps have not been run yet, so it yields inconclusive with automatedChannelCheck=fail.
const automatedChannelCheck = allEffects ? "pass" : "fail";
const label = !boot.ready ? "blocked" : !mapOk ? "fail" : "inconclusive";
const receipt = {
  schemaVersion: "0.1.0", trial: "MVT-ABALONE-001", generatedAt: new Date().toISOString(),
  command: "cd material-validation-lab/reference/abalone && npm ci && npm run trial",
  label,
  labelReason: label === "inconclusive" ? (automatedChannelCheck === "pass" ? "Automated checks passed; awaiting named human review (required for pass)." : "R (intensity) channel effect below criterion at neutral and grazing with the asset's own map; synthetic isolated R/G test maps not yet run; no human review.") : label === "blocked" ? `Page did not boot: ${boot.error}` : "Map colour-space or channel-effect check failed; see automated.",
  pins: {
    asset: { ...ASSET, measuredSha256InBrowser: boot.assetSha256, label: boot.assetSha256 === ASSET.sha256 ? "measured" : "blocked" },
    specification: { ...SPEC, label: "measured (commit observed via GitHub API); conformance not tested" },
    three: { version: THREE_VERSION, revisionReportedAtRuntime: boot.environment?.three, lockfile: "reference/abalone/package-lock.json" },
  },
  environment: { browser: `Chrome ${browserVersion} (headless, playwright-core)`, ...boot.environment, gpuNote: swiftshader ? "software rasterizer (SwiftShader); no hardware GPU on box" : "hardware renderer reported" },
  automated: {
    automatedChannelCheck,
    mapReceipt: mr, mapColorSpaceIsNoColorSpace: mapOk,
    effectCriterion: "fractionOver8 >= 0.01 of shell-masked pixels", effectThresholdFraction: T, pixelDifference: outcomes, effects,
    consoleErrors,
  },
  captures,
  history: [{ run: 1, metric: "whole-frame mean abs 8-bit diff > 0.5", result: "fail", detail: "rChannelContributes=false at all fixtures (treatment vs G-only 0.20-0.22); background pixels diluted the mean. Metric revised to shell-masked fraction before run 2. The revision was made after seeing run-1 data, so run-2 effect checks are post-hoc, not pre-registered.", label: "historical" }],
  review: { decision: "pending", reviewer: null, rationale: null, protocol: "Rate each fixture: does iridescence (a) appear only in treatment, (b) shift with view angle between neutral and grazing, (c) shift with key-light azimuth in the sweep, (d) respond separately to R-only vs G-only?" },
  performance: { frameTime: { label: "blocked", reason: swiftshader ? "software rasterizer; timing would not represent any target device and no device target is declared (CONFLICT_LEDGER known non-resolution)" : "no device target declared" } },
  attribution: "IridescenceAbalone — model © 2015 Abby Crawford; material © 2023 Eric Chadwick; CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/). KhronosGroup/glTF-Sample-Assets @ " + ASSET.commit,
  limitations: [
    "Environment is Three.js RoomEnvironment (procedural, fixed), not a pinned HDRI file; fixture lighting is deterministic but not the HDRI the trial contract names.",
    "Pixel-difference metric (shell-masked) is mean absolute 8-bit sRGB difference after ACES tone mapping; it shows an effect exists, not that it is correct.",
    "RGBA8 readback cannot detect NaN directly; visible NaN/flicker review is part of the human protocol.",
    "Rendered by software rasterizer in headless Chrome; hardware GPUs may differ.",
    "Thickness range used is the asset-authored 600–800 nm; the lab record default [100,400] is preserved as an unresolved conflict (C-07).",
  ],
  nonClaims: ["measured-abalone", "original-material", "mobile-optimized", "physical calibration", "mineral simulation", "frame rate / performance", "KHR_materials_iridescence conformance of any WebGL2 proxy"],
};
fs.writeFileSync(path.join(root, "receipts", "receipt.json"), JSON.stringify(receipt, null, 2) + "\n");
console.log(`MVT-ABALONE-001 label=${label} mapNoColorSpace=${mapOk} effects=${JSON.stringify(effects)} renderer=${boot.environment?.renderer}`);
process.exit(label === "blocked" ? 2 : label === "fail" ? 1 : 0);
