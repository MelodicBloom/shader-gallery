# MVT-ABALONE-001 — Khronos Abalone Baseline (isolated Three.js reference lane)

**Result label: `inconclusive`** (run 4, pre-registered C-09 sensitivity fixture met the unchanged criterion; awaiting named human review). Run 3 (shell fixture, synthetic maps) remains `fail` as history; runs 1–3 are kept in `receipts/receipt.json`. A "Geometry" switch selects the shell or the C-09 flat sensitivity plane (metalness 1, roughness 0); a third synthetic map `g-gradient-const-r1.png` (G gradient, R=1.0) was added for run 4. A "Map source" switch selects the asset's packed map or the synthetic maps in `assets/synthetic/` (authored by `tools/make-synthetic-maps.mjs`: R gradient/G=0.5 and G gradient/R=0.5, NoColorSpace, flipY=false). This folder has its own `package.json`/`package-lock.json` (three `0.186.1`, playwright-core `1.64.1` dev-only). Nothing here is a gallery dependency.

## Run it locally (one command)

```bash
cd material-validation-lab/reference/abalone && npm ci && npm run fetch-asset && npm run serve
# open http://localhost:4173/
```

Re-run the trial and regenerate captures + receipt: `npm run trial` (needs Chrome; env var `CHROME_PATH` overrides the default `/usr/bin/google-chrome`).

The GLB (9.3 MB) is not committed. `fetch-asset` downloads it from the pinned commit and refuses it unless SHA-256 matches; the page re-hashes it in the browser before parsing.

## Evidence chain (for reviewers, hiring managers, mentors)

| Step | What happened | Label |
|---|---|---|
| Problem | Iridescent nacre is easy to fake from one hero angle; the lab needs a documented, licensed reference whose channels can be checked before any procedural nacre is invented. | — |
| Decision | Use Khronos IridescenceAbalone as a comparison fixture in an isolated Three.js lane (CONFLICT_LEDGER C-01, C-03); no global dependency migration. | historical (lab decision) |
| Implementation | Pinned asset commit + hash; neutral control (`iridescence: 0`, no map); R-only and G-only isolation; three fixtures (neutral, grazing, light-sweep); headless capture → machine-readable receipt. | measured (code runs, exit 0) |
| Human-control boundary | Script measures load, map colour-space, pixel differences. Visual correctness at each fixture needs a named human reviewer; `pass` is impossible without one (validator-enforced). | blocked (no review yet) |
| Claimed | Maps load as `NoColorSpace`; iridescence produces a measurable difference vs the neutral control at all three fixtures; G (thickness) contributes at all three; R (intensity) contributes above criterion only at light-sweep. | measured |
| Not claimed | Measured abalone optics, physical calibration, mineral simulation, an original material, mobile optimisation, frame rates, KHR conformance of any WebGL2 proxy. | — |

Tensions kept open, not resolved: C-07 (record default thickness 100–400 nm vs asset 600–800 nm) and C-08 (metric revised after run 1; R independence unproven with the asset's own map).

## UV/mask diagnostic (label-inert)
`npm run uvdiag` renders the shell's UVs and the synth-r value under the trial mask and writes `receipt.json → diagnostics.uvCoverage` (pre-registered in `receipts/BUILD_HANDOFF-MVT-ABALONE-001-UVDIAG.md`). It never changes `label`, `review`, `automated`, or `history`; the runner aborts if it would. Measured: shell uP5–uP95 0.54–0.94 (spread 0.40) → H1 inconclusive.

## Accessibility / fallback
No autoplay. The light sweep animates only on click and is hidden under `prefers-reduced-motion`. If WebGL2, the asset, or its hash fails, the page shows the recorded static capture with the record's fallback label.

## Attribution
IridescenceAbalone — model © 2015 Abby Crawford, material © 2023 Eric Chadwick, licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Source: KhronosGroup/glTF-Sample-Assets @ `4995a638c96dbc94376d3d6164e70fee3ac7f7a2`. Captures in `receipts/captures/` are renders of that asset and carry the same attribution.
