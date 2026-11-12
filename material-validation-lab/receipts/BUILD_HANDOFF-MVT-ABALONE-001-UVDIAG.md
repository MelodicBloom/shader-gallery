# BUILD_HANDOFF — MVT-ABALONE-001 UV/mask diagnostic on the shell (fix option A)

Written and committed BEFORE any UV-diagnostic measurement code or run, 2026-10-26 (America/New_York). Labels: measured / proposed / historical / unverified / blocked.

| Field | Value |
|---|---|
| OBJECTIVE | Measure shell UV coverage and mask stats under the synthetic R map so H1 (UV dilution: the shell samples only a narrow U band of the synth-r gradient, compressing the R-channel effect) can be supported or weakened against pre-declared cut-offs, WITHOUT changing the trial outcome label. |
| REPO | `MelodicBloom/shader-gallery`, local `/workspace/shader-gallery` |
| WORKING BRANCH | `feat/mvt-abalone-001` |
| START SHA | `7166109` (measured, clean tree) |
| PR | Draft #31 (body update only; no merge) |
| AUTHORIZATION | User choice "Run A: UV/mask diagnostic on the shell" (widget t13s4) |

## AUTHORITY
- Authoritative: `CONFLICT_LEDGER.md` C-07 (open), C-09 (open); `TRIALS.md` MVT-ABALONE-001.
- Historical: receipt.json history runs 1–4 (kept intact). Current trial `label = inconclusive`, `review.decision = pending`.

## LABEL-INERT RULE (locked)
- This diagnostic adds `diagnostics.uvCoverage` (and related) to receipt.json only. It MUST NOT change `label`, `labelReason`, `review`, `fractionOver8`, the 0.01 threshold, the 8/255 cut-off, or any pass/fail channel check.
- Implemented as a separate command `npm run uvdiag` (tools/run-uvdiag.mjs) that reads the existing receipt.json, adds/replaces only the `diagnostics` key, and asserts label/review/automated/history are byte-identical before writing. `npm run trial` behaviour unchanged.

## METHOD (locked)
- Geometry: asset shell mesh (not the plane); map source `synth-r`; fixtures neutral, grazing, light-sweep (light-sweep camera = neutral; reported for completeness).
- Mask: identical to app.js `buildMask` — control-mode render, pixels whose summed |RGB − bg(12,15,20)| > 6.
- UV readback: temporarily swap the shell material for a debug RawShaderMaterial that writes `(u, v, synthR(u,v), 1)` to RGBA8 (no tone mapping, no colour-space conversion), using the same UV attribute channel the iridescence map uses and the same synth-r texture (NoColorSpace, flipY=false, wrap as loaded). Read pixels, restore material. 8-bit quantisation (±1/255) is accepted and documented.
- If UV attribute is missing or the debug render covers <90% of masked pixels → BLOCKED.

## DIAGNOSTIC OUTPUTS (measured)
maskPixelCount, maskFractionOfFrame; on masked pixels: uMin, uMax, uP5, uP95, uMean, vMin, vMax, vP5, vP95; rMin, rMax, rP5, rP95 (synth-r R channel sampled at those UVs, 0..1). Per fixture plus pooled.

## PRE-DECLARED H1 CUT-OFFS (proposed, LOCKED — not revised after seeing data)
- Statistic: uSpread = uP95 − uP5 on POOLED masked pixels (all three fixtures).
- Support H1 (narrow U): uSpread < 0.20
- Rule out H1 (wide U): uSpread > 0.60
- Otherwise: inconclusive for H1.
- Per-fixture spreads reported; if any fixture's verdict differs from the pooled verdict, it is noted (pooled verdict still governs).
- Note: synth-r gradient runs along U only (V unused by the map), so V stats are descriptive only.
- H1 verdict never alters the trial label.

## SCOPE IN
This handoff; debug UV hook in app.js (`api.uvDiag`), tools/run-uvdiag.mjs, `npm run uvdiag`; receipt `diagnostics` section; BUILD_RECEIPT-MVT-ABALONE-001-UVDIAG.md; CONFLICT_LEDGER H1 row (C-07 open, C-09 open); brief README note; push; PR #31 body.

## SCOPE OUT
Changing criterion; shell-sensitivity (B); new metric trial (C); HDRI; ACES toggle; human review; merge; record-status rewrites; Bubble/Gold/Console.

## TESTS / GATES
validate-material-lab, test-validate-material-lab, validate-meta, verify-source-archive (expect 0); validate-shaders (may exit 1 EGL — pre-existing). `npm run uvdiag` exit 0.

## STOP CONDITIONS
Urge to change label or soften criterion → stop. UVs cannot be sampled reliably → BLOCKED with what was tried. Do not start B before A's receipt is written.

## EVIDENCE TO RETURN
Final SHA, PR URL, uvCoverage numbers, H1 verdict vs locked cut-offs, label-unchanged confirmation, files changed, next slice.
