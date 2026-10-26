# BUILD_RECEIPT — MVT-ABALONE-001 UV/mask diagnostic (fix option A)

2026-10-26 (America/New_York). Labels: measured / proposed / historical / unverified / blocked.

| Field | Value |
|---|---|
| Handoff | `BUILD_HANDOFF-MVT-ABALONE-001-UVDIAG.md` committed first at `e93d3bd` (before any diagnostic code/run) |
| Start SHA | `7166109` |
| Diagnostic commit | `f150e18` |
| Command | `cd material-validation-lab/reference/abalone && npm run uvdiag` (exit 0) |
| Renderer | headless Chrome, SwiftShader (same as trial) |

## Results (measured; receipt.json → diagnostics.uvCoverage)
Shell mesh, mapSource synth-r, mask = app.js buildMask on control render. Frame 720×540.

| Fixture | maskPixelCount | maskFrac | uMin | uP5 | uMean | uP95 | uMax | uSpread | vP5 | vP95 | rP5 | rP95 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| neutral | 101918 | 0.2621 | 0.0157 | 0.5333 | 0.7578 | 0.9373 | 0.9765 | 0.4039 | 0.0980 | 0.8706 | 0.5333 | 0.9373 |
| grazing | 97370 | 0.2504 | 0.0353 | 0.5529 | 0.7458 | 0.9333 | 0.9804 | 0.3804 | 0.0824 | 0.9020 | 0.5529 | 0.9333 |
| light-sweep | 101918 | 0.2621 | 0.0157 | 0.5333 | 0.7578 | 0.9373 | 0.9765 | 0.4039 | 0.0980 | 0.8706 | 0.5333 | 0.9373 |
| **pooled** | 301206 | — | 0.0157 | 0.5373 | 0.7539 | 0.9373 | 0.9804 | **0.4000** | 0.0902 | 0.8824 | 0.5373 | 0.9373 |

vMin/vMax pooled 0.0157/0.9882; rMin/rMax 0.0157/0.9843. Light-sweep camera = neutral, hence identical numbers. synth-r R tracks U (gradient along U), as expected.

## H1 verdict vs locked cut-offs
Pooled uSpread = 0.40 → not < 0.20 (support) and not > 0.60 (rule-out) → **H1 inconclusive** (every fixture agrees). Cut-offs not revised.
Interpretation (proposed): shell sees R≈0.54–0.94 rather than 0–1 — a partial compression of R contrast, not a narrow band. UV dilution may contribute but cannot be the sole explanation on this evidence.

## Label integrity
`label` = `inconclusive` (unchanged); `review.decision` = `pending`; `automated`, `history` (runs 1–4), `labelReason` byte-identical — verified by runner assertion and by a JSON key diff vs `7166109` (only `diagnostics` differs). fractionOver8 / 0.01 / 8/255 untouched. `npm run trial` not re-run (not in scope).

## Commands (measured exit codes)
`npm run uvdiag` 0 (first attempt exit 1: JS stack overflow in Math.min spread over 300k values, fixed in stats helper, no data seen); validate-material-lab 0; test-validate-material-lab 0; validate-meta 0; verify-source-archive 0; validate-shaders 1 (blocked: missing -lEGL/-lGLESv2, pre-existing).

## Limitations (unverified)
UVs clamped to [0,1] in the debug shader (out-of-range UVs would pile at 0/1); 8-bit quantisation ±1/255; SwiftShader only.

## Files changed
receipts/BUILD_HANDOFF-…-UVDIAG.md, receipts/BUILD_RECEIPT-…-UVDIAG.md, reference/abalone/app.js (api.uvDiag hook), reference/abalone/tools/run-uvdiag.mjs (new), reference/abalone/package.json (uvdiag script), reference/abalone/receipts/receipt.json (diagnostics only), reference/abalone/README.md, CONFLICT_LEDGER.md (C-09 H1 row; C-07, C-09 open).

## Next slice (proposed)
B — pre-registered shell-sensitivity (shell geometry with metalness/roughness overrides), since H1 is inconclusive. C-09 not closed.
