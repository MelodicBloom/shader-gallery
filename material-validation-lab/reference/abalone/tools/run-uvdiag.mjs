#!/usr/bin/env node
// Label-inert UV/mask diagnostic for MVT-ABALONE-001 (pre-registered in receipts/BUILD_HANDOFF-MVT-ABALONE-001-UVDIAG.md).
// Adds/replaces ONLY receipt.diagnostics; asserts label/labelReason/review/automated/history unchanged before writing.
import fs from "node:fs"; import path from "node:path"; import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";
import { start } from "./serve.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const rp = path.join(root, "receipts", "receipt.json");
const before = JSON.parse(fs.readFileSync(rp, "utf8"));
const frozen = (r) => JSON.stringify([r.label, r.labelReason, r.review, r.automated, r.history]);
const frozenBefore = frozen(before);

const server = await start(0);
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome", args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const page = await browser.newPage({ viewport: { width: 1200, height: 1400 }, deviceScaleFactor: 1 });
const errs = []; page.on("pageerror", (e) => errs.push(String(e))); page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
await page.goto(`http://localhost:${server.address().port}/`);
await page.waitForFunction(() => window.__mvt && (window.__mvt.ready || window.__mvt.error), null, { timeout: 120000 });
const FIX = ["neutral", "grazing", "light-sweep"];
const raw = {};
const bootErr = await page.evaluate(() => window.__mvt.error);
if (!bootErr) for (const f of FIX) raw[f] = await page.evaluate((x) => window.__mvt.uvDiag(x), f);
await browser.close(); server.close();
if (bootErr) { console.error(`BLOCKED: page did not boot: ${bootErr}`); process.exit(2); }

const q = (a, p) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.max(0, Math.round(p * (s.length - 1))))]; };
const mn = (a) => a.reduce((x, y) => (y < x ? y : x), Infinity), mx = (a) => a.reduce((x, y) => (y > x ? y : x), -Infinity);
const r4 = (x) => +x.toFixed(4);
const stats = (u, v, r) => ({ uMin: r4(mn(u)), uMax: r4(mx(u)), uP5: r4(q(u, .05)), uP95: r4(q(u, .95)), uMean: r4(u.reduce((a, b) => a + b, 0) / u.length),
  vMin: r4(mn(v)), vMax: r4(mx(v)), vP5: r4(q(v, .05)), vP95: r4(q(v, .95)),
  rMin: r4(mn(r)), rMax: r4(mx(r)), rP5: r4(q(r, .05)), rP95: r4(q(r, .95)), uSpread: r4(q(u, .95) - q(u, .05)) });
const verdict = (s) => s < 0.20 ? "support" : s > 0.60 ? "rule-out" : "inconclusive";
const perFixture = {}; const U = [], V = [], R = [];
let blocked = null;
for (const f of FIX) {
  const d = raw[f];
  if (!d.uvAttribute || d.maskPixelCount === 0 || d.coveredMaskPixels / d.maskPixelCount < 0.9) blocked = `fixture ${f}: uvAttribute=${d.uvAttribute} mask=${d.maskPixelCount} covered=${d.coveredMaskPixels}`;
  const s = stats(d.u, d.v, d.r);
  perFixture[f] = { maskPixelCount: d.maskPixelCount, maskFractionOfFrame: r4(d.maskPixelCount / (d.frameW * d.frameH)), frame: [d.frameW, d.frameH], ...s, h1VerdictThisFixture: verdict(s.uSpread) };
  for (let i = 0; i < d.u.length; i++) { U.push(d.u[i]); V.push(d.v[i]); R.push(d.r[i]); }
}
if (blocked) { console.error(`BLOCKED: ${blocked}`); process.exit(2); }
const pooled = stats(U, V, R);
const h1 = verdict(pooled.uSpread);
const meta = raw.neutral;
const after = { ...before, diagnostics: {
  uvCoverage: {
    label: "measured", labelInert: true, run: "uvdiag", generatedAt: new Date().toISOString(),
    command: "cd material-validation-lab/reference/abalone && npm run uvdiag",
    preRegisteredIn: "material-validation-lab/receipts/BUILD_HANDOFF-MVT-ABALONE-001-UVDIAG.md",
    method: "Shell mesh, mapSource synth-r. Mask = app.js buildMask on control render (summed |RGB-bg(12,15,20)|>6). Debug RawShaderMaterial writes (u,v,texture(synth-r,uv).r) to RGBA8, no tone mapping / colour-space conversion; UVs clamped to [0,1]; 8-bit quantisation +-1/255.",
    uvAttributePresent: meta.uvAttribute, iridescenceMapUvChannel: meta.iridescenceMapChannel, synthTextureWrap: meta.textureWrap,
    vNote: "synth-r gradient varies along U only; V is descriptive.",
    perFixture, pooled: { maskPixelCount: U.length, ...pooled },
    h1: { hypothesis: "H1 UV dilution: shell samples a narrow U band of synth-r", statistic: "pooled uP95 - uP5", value: pooled.uSpread,
      cutoffs: { support: "< 0.20", ruleOut: "> 0.60", else: "inconclusive" }, cutoffsLockedBeforeRun: true, verdict: h1,
      perFixtureDisagreement: FIX.filter((f) => perFixture[f].h1VerdictThisFixture !== h1) },
    consoleErrors: errs,
  } } };
if (frozen(after) !== frozenBefore) { console.error("ABORT: diagnostic would alter label/review/automated/history"); process.exit(3); }
fs.writeFileSync(rp, JSON.stringify(after, null, 2) + "\n");
console.log(`UVDIAG label(unchanged)=${after.label} review=${after.review.decision} pooled=${JSON.stringify(after.diagnostics.uvCoverage.pooled)} H1=${h1}`);
for (const f of FIX) console.log(f, JSON.stringify(perFixture[f]));
