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
const boot = await page.evaluate(() => ({ ready: window.__mvt.ready, error: window.__mvt.error, environment: window.__mvt.environment, mapReceipt: window.__mvt.mapReceipt, synthMapReceipt: window.__mvt.synthMapReceipt, assetSha256: window.__mvt.assetSha256 }));
const browserVersion = browser.version(); if (!boot.ready) console.error("BOOT", JSON.stringify(boot));

const FIX = ["neutral", "grazing", "light-sweep"];
const captures = [], outcomes = {}, synth = { "synth-r": {}, "synth-g": {} }, synthCaptures = [];
const sens = { "synth-r": {}, "synth-g": {}, "synth-g-r1": {} }, sensCaptures = [];
const shellSens = { "synth-r": {}, "synth-g": {}, "synth-g-r1": {} }, shellSensCaptures = [];
// Run 6 (pre-registered in BUILD_HANDOFF-MVT-ABALONE-001-FACTORS.md): exactly two one-factor variants.
const FACTORS = { "shell-rough0": { key: "shellRough0", run: "6a", prefix: "rough0" }, "shell-metal1": { key: "shellMetal1", run: "7 (anchor; first 6b)", prefix: "metal1" },
  // Run 7 (pre-registered in BUILD_HANDOFF-MVT-ABALONE-001-METALMAP.md): metalness scalar vs metalnessMap 2x2.
  "shell-metal1-mapkept": { key: "shellMetal1MapKept", run: "7a", prefix: "metal1mapkept" }, "shell-metal05-mapnull": { key: "shellMetal05MapNull", run: "7b", prefix: "metal05mapnull" } };
const factorData = Object.fromEntries(Object.keys(FACTORS).map((g) => [g, { px: { "synth-r": {}, "synth-g": {}, "synth-g-r1": {} }, captures: [] }]));
if (boot.ready) {
  for (const src of Object.keys(synth)) for (const fixture of FIX) {
    synth[src][fixture] = await page.evaluate(([f, s]) => window.__mvt.measure(f, s), [fixture, src]);
    await page.evaluate(([f, s]) => { window.__mvt.set({ mapSource: s, mode: "treatment" }); window.__mvt.fixture(f); }, [fixture, src]);
    const png = await page.locator("#view").screenshot(); const rel = `captures/${src}-${fixture}-treatment.png`;
    fs.writeFileSync(path.join(root, "receipts", rel), png);
    synthCaptures.push({ mapSource: src, fixture, artifactPath: `reference/abalone/receipts/${rel}`, sha256: sha(png) });
  }
  // Run 4 (C-09 sensitivity, pre-registered in BUILD_HANDOFF-MVT-ABALONE-001-C09.md): flat plane fixture.
  for (const src of Object.keys(sens)) for (const fixture of FIX) {
    sens[src][fixture] = await page.evaluate(([f, s]) => window.__mvt.measure(f, s, "plane"), [fixture, src]);
    await page.evaluate(([f, s]) => { window.__mvt.set({ geometry: "plane", mapSource: s, mode: "treatment" }); window.__mvt.fixture(f); }, [fixture, src]);
    const png = await page.locator("#view").screenshot(); const rel = `captures/sens-${src}-${fixture}-treatment.png`;
    fs.writeFileSync(path.join(root, "receipts", rel), png);
    sensCaptures.push({ geometry: "plane", mapSource: src, fixture, materialState: await page.evaluate(() => window.__mvt.materialState()), artifactPath: `reference/abalone/receipts/${rel}`, sha256: sha(png) });
  }
  // Run 5 (shell-sens, pre-registered in BUILD_HANDOFF-MVT-ABALONE-001-SHELLSENS.md): shell mesh + plane-style overrides.
  for (const src of Object.keys(shellSens)) for (const fixture of FIX) {
    shellSens[src][fixture] = await page.evaluate(([f, s]) => window.__mvt.measure(f, s, "shell-sens"), [fixture, src]);
    await page.evaluate(([f, s]) => { window.__mvt.set({ geometry: "shell-sens", mapSource: s, mode: "treatment" }); window.__mvt.fixture(f); }, [fixture, src]);
    const png = await page.locator("#view").screenshot(); const rel = `captures/shellsens-${src}-${fixture}-treatment.png`;
    fs.writeFileSync(path.join(root, "receipts", rel), png);
    shellSensCaptures.push({ geometry: "shell-sens", mapSource: src, fixture, materialState: await page.evaluate(() => window.__mvt.materialState()), artifactPath: `reference/abalone/receipts/${rel}`, sha256: sha(png) });
  }
  for (const [geom, meta] of Object.entries(FACTORS)) for (const src of Object.keys(factorData[geom].px)) for (const fixture of FIX) {
    factorData[geom].px[src][fixture] = await page.evaluate(([f, s, g]) => window.__mvt.measure(f, s, g), [fixture, src, geom]);
    await page.evaluate(([f, s, g]) => { window.__mvt.set({ geometry: g, mapSource: s, mode: "treatment" }); window.__mvt.fixture(f); }, [fixture, src, geom]);
    const png = await page.locator("#view").screenshot(); const rel = `captures/${meta.prefix}-${src}-${fixture}-treatment.png`;
    fs.writeFileSync(path.join(root, "receipts", rel), png);
    factorData[geom].captures.push({ geometry: geom, mapSource: src, fixture, materialState: await page.evaluate(() => window.__mvt.materialState()), artifactPath: `reference/abalone/receipts/${rel}`, sha256: sha(png) });
  }
  await page.evaluate(() => window.__mvt.set({ geometry: "shell", mapSource: "asset", mode: "treatment" }));
  for (const fixture of FIX) {
    outcomes[fixture] = await page.evaluate((f) => window.__mvt.measure(f, "asset"), fixture);
    for (const mode of ["treatment", "control"]) {
      await page.evaluate(([f, m]) => { window.__mvt.set({ mapSource: "asset", mode: m }); window.__mvt.fixture(f); }, [fixture, mode]);
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
// Run-3 criterion: PRE-REGISTERED in receipts/BUILD_HANDOFF-MVT-ABALONE-001-SYNTH.md before this code ran. Same metric/threshold; not revised after results.
const ge = (o) => ({ fractionOver8: o.fractionOver8, meetsCriterion: o.fractionOver8 >= T });
const synthChecks = Object.fromEntries(FIX.map((f) => { const r = synth["synth-r"][f], g = synth["synth-g"][f]; return [f, {
  iridescenceVisibleVsNeutralControl: { "synth-r": ge(r.treatmentVsControl), "synth-g": ge(g.treatmentVsControl) },
  rChannelContributes: { "synth-r": ge(r.treatmentVsGOnly) },
  gChannelContributes: { "synth-g": ge(g.treatmentVsROnly) },
  channelsDistinct: { "synth-r": ge(r.rOnlyVsGOnly), "synth-g": ge(g.rOnlyVsGOnly) },
}]; }));
const synthPerCheck = Object.fromEntries(Object.keys(synthChecks.neutral).map((k) => [k, FIX.every((f) => Object.values(synthChecks[f][k]).every((v) => v.meetsCriterion)) ? "pass" : "fail"]));
const synthOk = Object.values(synthPerCheck).every((v) => v === "pass");
// Run-4 criterion: identical metric/threshold, PRE-REGISTERED in BUILD_HANDOFF-MVT-ABALONE-001-C09.md before this code was written. Not revised.
const sensChecks = Object.fromEntries(FIX.map((f) => { const r = sens["synth-r"][f], g = sens["synth-g"][f], g1 = sens["synth-g-r1"][f]; return [f, {
  iridescenceVisibleVsNeutralControl: { "synth-r": ge(r.treatmentVsControl), "synth-g": ge(g.treatmentVsControl), "synth-g-r1": ge(g1.treatmentVsControl) },
  rChannelContributes: { "synth-r": ge(r.treatmentVsGOnly) },
  gChannelContributes: { "synth-g": ge(g.treatmentVsROnly), "synth-g-r1": ge(g1.treatmentVsROnly) },
  channelsDistinct: { "synth-r": ge(r.rOnlyVsGOnly), "synth-g": ge(g.rOnlyVsGOnly), "synth-g-r1": ge(g1.rOnlyVsGOnly) },
}]; }));
const sensPerCheck = Object.fromEntries(Object.keys(sensChecks.neutral).map((k) => [k, FIX.every((f) => Object.values(sensChecks[f][k]).every((v) => v.meetsCriterion)) ? "pass" : "fail"]));
const sensPerVariant = Object.fromEntries(Object.keys(sens).map((v) => [v, FIX.every((f) => Object.values(sensChecks[f]).every((c) => !c[v] || c[v].meetsCriterion)) ? "pass" : "fail"]));
const sensOk = Object.values(sensPerCheck).every((v) => v === "pass");
// Run-5 criterion: identical metric/threshold, PRE-REGISTERED in BUILD_HANDOFF-MVT-ABALONE-001-SHELLSENS.md before this code was written. Not revised.
const shellSensChecks = Object.fromEntries(FIX.map((f) => { const r = shellSens["synth-r"][f], g = shellSens["synth-g"][f], g1 = shellSens["synth-g-r1"][f]; return [f, {
  iridescenceVisibleVsNeutralControl: { "synth-r": ge(r.treatmentVsControl), "synth-g": ge(g.treatmentVsControl), "synth-g-r1": ge(g1.treatmentVsControl) },
  rChannelContributes: { "synth-r": ge(r.treatmentVsGOnly) },
  gChannelContributes: { "synth-g": ge(g.treatmentVsROnly), "synth-g-r1": ge(g1.treatmentVsROnly) },
  channelsDistinct: { "synth-r": ge(r.rOnlyVsGOnly), "synth-g": ge(g.rOnlyVsGOnly), "synth-g-r1": ge(g1.rOnlyVsGOnly) },
}]; }));
const shellSensPerCheck = Object.fromEntries(Object.keys(shellSensChecks.neutral).map((k) => [k, FIX.every((f) => Object.values(shellSensChecks[f][k]).every((v) => v.meetsCriterion)) ? "pass" : "fail"]));
const shellSensPerVariant = Object.fromEntries(Object.keys(shellSens).map((v) => [v, FIX.every((f) => Object.values(shellSensChecks[f]).every((c) => !c[v] || c[v].meetsCriterion)) ? "pass" : "fail"]));
const shellSensOk = Object.values(shellSensPerCheck).every((v) => v === "pass");
// Run-6 criterion: identical metric/threshold/check mapping, PRE-REGISTERED in BUILD_HANDOFF-MVT-ABALONE-001-FACTORS.md. Not revised.
const evalVariant = (px) => {
  const checks = Object.fromEntries(FIX.map((f) => { const r = px["synth-r"][f], g = px["synth-g"][f], g1 = px["synth-g-r1"][f]; return [f, {
    iridescenceVisibleVsNeutralControl: { "synth-r": ge(r.treatmentVsControl), "synth-g": ge(g.treatmentVsControl), "synth-g-r1": ge(g1.treatmentVsControl) },
    rChannelContributes: { "synth-r": ge(r.treatmentVsGOnly) },
    gChannelContributes: { "synth-g": ge(g.treatmentVsROnly), "synth-g-r1": ge(g1.treatmentVsROnly) },
    channelsDistinct: { "synth-r": ge(r.rOnlyVsGOnly), "synth-g": ge(g.rOnlyVsGOnly), "synth-g-r1": ge(g1.rOnlyVsGOnly) },
  }]; }));
  const perCheck = Object.fromEntries(Object.keys(checks.neutral).map((k) => [k, FIX.every((f) => Object.values(checks[f][k]).every((v) => v.meetsCriterion)) ? "pass" : "fail"]));
  const perVariant = Object.fromEntries(Object.keys(px).map((v) => [v, FIX.every((f) => Object.values(checks[f]).every((c) => !c[v] || c[v].meetsCriterion)) ? "pass" : "fail"]));
  return { checks, perCheck, perVariant, ok: Object.values(perCheck).every((v) => v === "pass") };
};
const factorEval = Object.fromEntries(Object.keys(FACTORS).map((g) => [g, boot.ready ? evalVariant(factorData[g].px) : null]));
const rough0Ok = !!factorEval["shell-rough0"]?.ok, metal1Ok = !!factorEval["shell-metal1"]?.ok;
const mapKeptOk = !!factorEval["shell-metal1-mapkept"]?.ok, mapNullOk = !!factorEval["shell-metal05-mapnull"]?.ok;
const metalMapOutcome = !metal1Ok ? "metal1 anchor FAILED: regression or environment issue; stop and report"
  : (mapKeptOk ? "metal1-mapkept passes and metal1 passes: scalar metalness=1 sufficient; nulling the map was unnecessary (proposed)" : "metal1-mapkept fails and metal1 passes: nulling metalnessMap (or map x scalar interaction) required; metalness=1 alone not enough under authored map (proposed)")
    + (mapNullOk ? "; metal05-mapnull passes: removing the map alone (at 0.5) is enough (proposed)" : "; metal05-mapnull fails: map removal alone insufficient" + (mapKeptOk ? "" : " -> only metal1 (value AND map) clears: joint requirement / interaction (proposed)"));
const h2Outcome = rough0Ok && metal1Ok ? "both clear: either factor alone is sufficient; run-5 bundle over-specified (proposed)"
  : rough0Ok ? "rough0 clears, metal1 fails: roughness (and/or its map) is the dominant compressor under this metric (proposed)"
  : metal1Ok ? "metal1 clears, rough0 fails: metalness path dominates (proposed)"
  : "neither clears: normalMap and/or multi-factor interaction (or side) still required; H2 refined, not closed (proposed)";
const factorBlock = (g, fixture) => ({
  label: "measured", run: FACTORS[g].run, criterionStatus: "pre-registered", hypothesis: "H2 one-factor split", fixture,
  automatedChannelCheck: factorEval[g]?.ok ? "pass" : "fail", perCheck: factorEval[g]?.perCheck, perVariant: factorEval[g]?.perVariant, checks: factorEval[g]?.checks,
  pixelDifference: factorData[g].px, captures: factorData[g].captures, diagnosticsNote: "mean values are measured diagnostics only; they do not affect the label",
});
const sm = boot.synthMapReceipt || {};
const synthNoCS = Object.values(sm).length === 3 && Object.values(sm).every((m) => m.colorSpace === mr.noColorSpaceConstant);
const swiftshader = /swiftshader|llvmpipe|software/i.test(boot.environment?.renderer || "");
// Colour-space mismatch is a declared falsifier -> fail. A weak channel effect with the asset's own packed map is NOT the full
// falsifier: the contract's synthetic isolated R/G test maps have not been run yet, so it yields inconclusive with automatedChannelCheck=fail.
const automatedChannelCheck = allEffects ? "pass" : "fail";
const automatedSyntheticChannelCheck = synthOk ? "pass" : "fail";
const clean = consoleErrors.length === 0;
// Run-5 labelling (pre-registered in SHELLSENS handoff): shell-sens (and run-4 plane) clear -> inconclusive (awaiting human review;
// authored shell fail preserved); shell-sens fails -> fail. Never pass without named human review.
const label = !boot.ready ? "blocked" : !mapOk || !synthNoCS ? "fail" : !sensOk || !shellSensOk ? "fail" : clean ? "inconclusive" : "fail";
const receipt = {
  schemaVersion: "0.1.0", trial: "MVT-ABALONE-001", generatedAt: new Date().toISOString(),
  command: "cd material-validation-lab/reference/abalone && npm ci && npm run trial",
  label,
  labelReason: label === "inconclusive" ? `Run-7 metalness scalar vs map (pre-registered, METALMAP handoff): shell-metal1-mapkept=${mapKeptOk ? "pass" : "fail"}, shell-metal05-mapnull=${mapNullOk ? "pass" : "fail"}, shell-metal1 anchor=${metal1Ok ? "pass" : "fail"} -> ${metalMapOutcome}. Run-6 one-factor splits (pre-registered, FACTORS handoff): shell-rough0=${rough0Ok ? "pass" : "fail"}, shell-metal1=${metal1Ok ? "pass" : "fail"} -> ${h2Outcome}. Run-5 shell-sens fixture (shell mesh + metalness 1/roughness 0/maps removed) met the pre-registered criterion (automated.shellSens.automatedChannelCheck=pass); run-4 plane sensitivity=pass; authored-shell synthetic=${automatedSyntheticChannelCheck} preserved (run-3 fail in history); asset=${automatedChannelCheck} (post-hoc metric). Awaiting named human review (required for pass).` : label === "blocked" ? `Page did not boot: ${boot.error}` : (!sensOk || !shellSensOk) ? `Authored shell synthetic=${automatedSyntheticChannelCheck}; run-4 plane sensitivity=${sensOk ? "pass" : "fail"}; run-5 shell-sens=${shellSensOk ? "pass" : "fail"} (failing checks: ${Object.entries(shellSensPerCheck).filter(([, v]) => v === "fail").map(([k]) => k).join(", ") || "none"}) under the pre-registered criterion on SwiftShader.` : "Map colour-space or console-error check failed; see automated.",
  pins: {
    asset: { ...ASSET, measuredSha256InBrowser: boot.assetSha256, label: boot.assetSha256 === ASSET.sha256 ? "measured" : "blocked" },
    specification: { ...SPEC, label: "measured (commit observed via GitHub API); conformance not tested" },
    three: { version: THREE_VERSION, revisionReportedAtRuntime: boot.environment?.three, lockfile: "reference/abalone/package-lock.json" },
  },
  environment: { browser: `Chrome ${browserVersion} (headless, playwright-core)`, ...boot.environment, gpuNote: swiftshader ? "software rasterizer (SwiftShader); no hardware GPU on box" : "hardware renderer reported" },
  automated: {
    effectCriterion: { metric: "shell-masked fractionOver8 (fraction of shell pixels with mean RGB abs-diff > 8/255)", threshold: ">= 0.01", fixtures: FIX, scope: "ALL fixtures x EACH check", preRegistered: true, lockedIn: "material-validation-lab/receipts/BUILD_HANDOFF-MVT-ABALONE-001-SYNTH.md", lockedBeforeRun: 3, revisedAfterResults: false },
    effectCriterionRun4: { metric: "masked fractionOver8 (fraction of masked pixels with mean RGB abs-diff > 8/255)", threshold: ">= 0.01", fixtures: FIX, scope: "ALL fixtures x EACH check x EACH synth variant on the sensitivity fixture", preRegistered: true, lockedIn: "material-validation-lab/receipts/BUILD_HANDOFF-MVT-ABALONE-001-C09.md", lockedBeforeRun: 4, revisedAfterResults: false },
    effectCriterionRun5: { metric: "shell-masked fractionOver8", threshold: ">= 0.01", fixtures: FIX, scope: "ALL fixtures x EACH check x EACH synth variant on the shell-sens fixture", preRegistered: true, lockedIn: "material-validation-lab/receipts/BUILD_HANDOFF-MVT-ABALONE-001-SHELLSENS.md", lockedBeforeRun: 5, revisedAfterResults: false },
    effectCriterionRun6: { metric: "shell-masked fractionOver8", threshold: ">= 0.01", fixtures: FIX, scope: "ALL fixtures x EACH check x EACH synth variant, evaluated per one-factor variant (shell-rough0, shell-metal1)", preRegistered: true, lockedIn: "material-validation-lab/receipts/BUILD_HANDOFF-MVT-ABALONE-001-FACTORS.md", lockedBeforeRun: 6, revisedAfterResults: false },
    effectThresholdFraction: T,
    shellRough0: factorBlock("shell-rough0", { geometry: "abalone shell mesh", roughness: 0.0, metalness: "authored 0.5", removedMaps: ["roughnessMap"], keptMaps: ["metalnessMap", "normalMap", "aoMap", "map"], side: "authored (FrontSide)", iridescence: "asset-authored (1.0)", thicknessRangeNm: "asset-authored 600-800", environment: "RoomEnvironment + ACESFilmic (unchanged)", mask: "shell pixels in shell-rough0 control frame" }),
    shellMetal1: factorBlock("shell-metal1", { geometry: "abalone shell mesh", metalness: 1.0, roughness: "authored 1.0", removedMaps: ["metalnessMap"], keptMaps: ["roughnessMap", "normalMap", "aoMap", "map"], side: "authored (FrontSide)", iridescence: "asset-authored (1.0)", thicknessRangeNm: "asset-authored 600-800", environment: "RoomEnvironment + ACESFilmic (unchanged)", mask: "shell pixels in shell-metal1 control frame", ifThen: "metalnessMap nulled as pre-registered because metalness 1 x texel.b would make the scalar override ineffective" }),
    effectCriterionRun7: { metric: "shell-masked fractionOver8", threshold: ">= 0.01", cutoff: "8/255", fixtures: FIX, scope: "ALL fixtures x EACH check x EACH synth variant, per variant (shell-metal1-mapkept, shell-metal05-mapnull; anchors shell-metal1, authored shell)", preRegistered: true, lockedIn: "material-validation-lab/receipts/BUILD_HANDOFF-MVT-ABALONE-001-METALMAP.md", lockedBeforeRun: 7, revisedAfterResults: false },
    shellMetal1MapKept: factorBlock("shell-metal1-mapkept", { geometry: "abalone shell mesh", metalness: 1.0, roughness: "authored 1.0", removedMaps: [], keptMaps: ["metalnessMap", "roughnessMap", "normalMap", "aoMap", "map"], side: "authored (FrontSide)", iridescence: "asset-authored (1.0)", thicknessRangeNm: "asset-authored 600-800", environment: "RoomEnvironment + ACESFilmic (unchanged)", mask: "shell pixels in shell-metal1-mapkept control frame", mechanismNote: "proposed (three.js docs, not measured GPU math): effective metalness = 1.0 * texel.b, NOT a constant-1 field" }),
    shellMetal05MapNull: factorBlock("shell-metal05-mapnull", { geometry: "abalone shell mesh", metalness: "authored 0.5", roughness: "authored 1.0", removedMaps: ["metalnessMap"], keptMaps: ["roughnessMap", "normalMap", "aoMap", "map"], side: "authored (FrontSide)", iridescence: "asset-authored (1.0)", thicknessRangeNm: "asset-authored 600-800", environment: "RoomEnvironment + ACESFilmic (unchanged)", mask: "shell pixels in shell-metal05-mapnull control frame" }),
    metalMapOutcome: { label: "proposed", outcome: metalMapOutcome, grid2x2: { "0.5+map (authored shell synthetic)": automatedSyntheticChannelCheck, "1.0+map (metal1-mapkept)": mapKeptOk ? "pass" : "fail", "0.5+null (metal05-mapnull)": mapNullOk ? "pass" : "fail", "1.0+null (metal1)": metal1Ok ? "pass" : "fail" } },
    h2FactorOutcome: { label: "proposed", outcome: h2Outcome, rough0: rough0Ok ? "pass" : "fail", metal1: metal1Ok ? "pass" : "fail", confound: "one-factor variants keep authored FrontSide; shell-sens used DoubleSide (declared, untested)" },
    shellSens: {
      label: "measured", run: 5, criterionStatus: "pre-registered", hypothesis: "H2 (shell material compresses channel response)",
      fixture: { geometry: "abalone shell mesh (authored trial geometry)", metalness: 1.0, roughness: 0.0, removedMaps: ["metalnessMap", "roughnessMap", "normalMap"], side: "DoubleSide", iridescence: "asset-authored (1.0)", thicknessRangeNm: "asset-authored 600-800", environment: "RoomEnvironment + ACESFilmic (unchanged)", mask: "shell pixels in shell-sens control frame", variants: "bundled only (no one-factor splits in this slice)" },
      automatedChannelCheck: shellSensOk ? "pass" : "fail", perCheck: shellSensPerCheck, perVariant: shellSensPerVariant, checks: shellSensChecks,
      pixelDifference: shellSens, captures: shellSensCaptures,
      diagnosticsNote: "mean values are measured diagnostics only; they do not affect the label",
    },
    sensitivity: {
      label: "measured", run: 4, criterionStatus: "pre-registered", ledger: "C-09",
      fixture: { geometry: "flat PlaneGeometry (UV 0..1), size 1.2x asset bounding radius, at asset centre, DoubleSide", metalness: 1.0, roughness: 0.0, removedMaps: ["metalnessMap", "roughnessMap", "normalMap"], iridescence: "asset-authored (1.0)", thicknessRangeNm: "asset-authored 600-800", environment: "RoomEnvironment + ACESFilmic (unchanged from run 3; uncontrolled for device fidelity)", mask: "plane pixels in control frame" },
      automatedChannelCheck: sensOk ? "pass" : "fail", perCheck: sensPerCheck, perVariant: sensPerVariant, checks: sensChecks,
      pixelDifference: sens, captures: sensCaptures,
      diagnosticsNote: "mean values are measured diagnostics only; they do not affect the label",
    },
    synthetic: {
      label: "measured", criterionStatus: "pre-registered",
      automatedSyntheticChannelCheck, perCheck: synthPerCheck, checks: synthChecks,
      maps: {
        "synth-r": { file: "reference/abalone/assets/synthetic/r-gradient-const-g.png", sha256: sha(fs.readFileSync(path.join(root, "assets/synthetic/r-gradient-const-g.png"))), content: "R horizontal 0..255 gradient, G=128, B=0, A=255; 256x256", ...sm["synth-r"] },
        "synth-g": { file: "reference/abalone/assets/synthetic/g-gradient-const-r.png", sha256: sha(fs.readFileSync(path.join(root, "assets/synthetic/g-gradient-const-r.png"))), content: "G horizontal 0..255 gradient, R=128, B=0, A=255; 256x256", ...sm["synth-g"] },
        "synth-g-r1": { file: "reference/abalone/assets/synthetic/g-gradient-const-r1.png", sha256: sha(fs.readFileSync(path.join(root, "assets/synthetic/g-gradient-const-r1.png"))), content: "G horizontal 0..255 gradient, R=255, B=0, A=255; 256x256 (run 4 only)", ...sm["synth-g-r1"] },
      },
      mapColorSpaceIsNoColorSpace: synthNoCS,
      pixelDifference: synth, captures: synthCaptures,
    },
    asset: {
      label: "measured", criterionStatus: "post-hoc (metric revised after run 1; same threshold re-applied in run 3)",
      automatedChannelCheck, mapReceipt: mr, mapColorSpaceIsNoColorSpace: mapOk, pixelDifference: outcomes, effects,
    },
    consoleErrors,
  },
  captures,
  history: [{ run: 1, metric: "whole-frame mean abs 8-bit diff > 0.5", result: "fail", detail: "rChannelContributes=false at all fixtures (treatment vs G-only 0.20-0.22); background pixels diluted the mean. Metric revised to shell-masked fraction before run 2. The revision was made after seeing run-1 data, so run-2 effect checks are post-hoc, not pre-registered.", label: "historical" },
    { run: 2, metric: "shell-masked fractionOver8 >= 0.01 (asset map only)", result: "inconclusive", detail: "Asset map: rChannelContributes treatment vs G-only fractionOver8 0.0075 (neutral), 0.0077 (grazing), 0.0103 (light-sweep); all other checks met. Criterion post-hoc.", label: "historical/post-hoc" },
    { run: 3, metric: "shell-masked fractionOver8 >= 0.01, pre-registered in BUILD_HANDOFF-MVT-ABALONE-001-SYNTH.md", result: "fail", detail: "Original run-3 measurement (commit 584f5a9): shell fixture synthetic rChannelContributes fractionOver8 0.0055/0.0049/0.0073, gChannelContributes 0.0047/0.0028/0.0044 (neutral/grazing/light-sweep) under >= 0.01; label fail. Shell synthetic is re-measured in run 4 under automated.synthetic.", label: "historical (pre-registered synthetic; result fail)" },
    { run: 4, metric: "masked fractionOver8 >= 0.01, pre-registered in BUILD_HANDOFF-MVT-ABALONE-001-C09.md", result: `sensitivity=${sensOk ? "pass" : "fail"}; shellSynthetic=${automatedSyntheticChannelCheck}; asset=${automatedChannelCheck}`, detail: "C-09 flat-plane sensitivity fixture (metalness 1, roughness 0) with synth-r, synth-g (R=0.5), synth-g-r1 (R=1.0); shell synthetic + asset re-measured in the same run.", label: "historical (pre-registered sensitivity; re-measured each run)" },
    { run: 5, metric: "shell-masked fractionOver8 >= 0.01, pre-registered in BUILD_HANDOFF-MVT-ABALONE-001-SHELLSENS.md", result: `shellSens=${shellSensOk ? "pass" : "fail"}; planeSens=${sensOk ? "pass" : "fail"}; shellSynthetic=${automatedSyntheticChannelCheck}; asset=${automatedChannelCheck}`, detail: "Bundled shell-sens fixture: shell mesh + plane override bundle (metalness 1, roughness 0, metalness/roughness/normal maps removed) with synth-r, synth-g, synth-g-r1.", label: "historical (pre-registered shell-sens; re-measured each run)" },
    { run: 6, metric: "shell-masked fractionOver8 >= 0.01, pre-registered in BUILD_HANDOFF-MVT-ABALONE-001-FACTORS.md", result: `6a shellRough0=${rough0Ok ? "pass" : "fail"}; 6b shellMetal1=${metal1Ok ? "pass" : "fail"}; shellSens=${shellSensOk ? "pass" : "fail"}; planeSens=${sensOk ? "pass" : "fail"}; shellSynthetic=${automatedSyntheticChannelCheck}`, detail: "One-factor splits of the run-5 bundle: 6a roughness 0 (roughnessMap null), 6b metalness 1 (metalnessMap null); other maps and side authored.", label: "historical (pre-registered one-factor splits; result string reflects run-7 re-measure of same code)" },
    { run: 7, metric: "shell-masked fractionOver8 >= 0.01 (8/255), pre-registered in BUILD_HANDOFF-MVT-ABALONE-001-METALMAP.md", result: `7a shellMetal1MapKept=${mapKeptOk ? "pass" : "fail"}; 7b shellMetal05MapNull=${mapNullOk ? "pass" : "fail"}; anchor shellMetal1=${metal1Ok ? "pass" : "fail"}; anchor shellSynthetic=${automatedSyntheticChannelCheck}`, detail: "Metalness scalar vs metalnessMap 2x2 on the shell; FrontSide; roughness/normal maps authored.", label: "pre-registered metal-map split (this run)" }],
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
console.log(`MVT-ABALONE-001 label=${label} mapNoColorSpace=${mapOk} synthNoCS=${synthNoCS} synthetic=${JSON.stringify(synthPerCheck)} sensitivity=${JSON.stringify(sensPerCheck)} sensVariants=${JSON.stringify(sensPerVariant)} shellSens=${JSON.stringify(shellSensPerCheck)} shellSensVariants=${JSON.stringify(shellSensPerVariant)} rough0=${JSON.stringify(factorEval["shell-rough0"]?.perCheck)} metal1=${JSON.stringify(factorEval["shell-metal1"]?.perCheck)} metal1mapkept=${JSON.stringify(factorEval["shell-metal1-mapkept"]?.perCheck)} metal05mapnull=${JSON.stringify(factorEval["shell-metal05-mapnull"]?.perCheck)} assetEffects=${JSON.stringify(effects)} renderer=${boot.environment?.renderer}`);
process.exit(label === "blocked" ? 2 : label === "fail" ? 1 : 0);
