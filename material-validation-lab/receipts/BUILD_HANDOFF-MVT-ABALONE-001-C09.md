# BUILD_HANDOFF — MVT-ABALONE-001 C-09 sensitivity probe (run 4)

Written and committed BEFORE any run-4 measurement code or trial execution, 2026-10-26 (America/New_York). Labels: measured / proposed / historical / unverified / blocked.

| Field | Value |
|---|---|
| OBJECTIVE | Pre-register and run one sensitivity probe (run 4) that isolates CONFLICT_LEDGER C-09 fixture suspects without changing the pass threshold, and record whether synthetic R/G independence checks clear under the sensitivity fixture. |
| REPO | `MelodicBloom/shader-gallery`, local `/workspace/shader-gallery` |
| BASE / WORKING BRANCH | stack base `feat/material-validation-lab-v0`; working branch `feat/mvt-abalone-001` |
| START SHA | `2bf981c456b6b9cf4057a9942cbb7ba73da0561d` (measured, clean tree) |
| PR | Draft #31 (body update only; no merge) |
| AUTHORIZATION | User choice "Probe C-09 first with a new pre-registered run" (widget t12s3) |

## AUTHORITY
- Authoritative: `CONFLICT_LEDGER.md` C-07 (open), C-08, C-09 (proposed; reversal = newly pre-registered fixture declared before running); `TRIALS.md` MVT-ABALONE-001.
- Historical: `BUILD_HANDOFF/RECEIPT-MVT-ABALONE-001(.md|-SYNTH.md)`, `reference/abalone/receipts/receipt.json` runs 1–3. Run 3 label `fail` (measured) is preserved and NOT relabelled.

## PRE-REGISTERED CRITERION (LOCKED before run 4 — unchanged from run 3, re-stated, not revised)
- Metric: masked `fractionOver8` = fraction of masked pixels (control pixels differing from clear colour by >6 summed RGB) whose mean RGB abs-diff exceeds 8/255.
- Threshold: `fractionOver8 >= 0.01` at ALL of neutral / grazing / light-sweep for EACH check used.
- Checks (on sensitivity fixture): `iridescenceVisibleVsNeutralControl`, `rChannelContributes` (synth-r: treatment vs G-only), `gChannelContributes` (synth-g R=0.5 AND synth-g-R1 R=1.0, each: treatment vs R-only), `channelsDistinct` (R-only vs G-only, each set).
- Primary automated decision field: `automated.sensitivity.automatedChannelCheck` = pass iff every check above passes for every synth set; else fail. Per-variant outcomes also recorded.
- Threshold and 8/255 cut-off are NOT revised after seeing results. Means and any extra numbers are measured diagnostics only and cannot flip the label.

## SENSITIVITY FIXTURE (pre-declared independent variables)
1. Geometry: flat plane (PlaneGeometry, UV 0..1, same span the synthetic maps expect), NOT the shell mesh. Mask = plane pixels in control.
2. Material overrides: `metalness = 1.0`, `roughness = 0.0`, `iridescence = 1.0`, `iridescenceThicknessRange = [600, 800]` nm (asset-authored). Lab record default `[100,400]` untouched (C-07 open).
3. Maps: `r-gradient-const-g.png`, `g-gradient-const-r.png` (R=128), plus new pre-declared `g-gradient-const-r1.png` (G 0→255 gradient, R=255, B=0, A=255). NoColorSpace, flipY=false, packed as iridescenceMap + iridescenceThicknessMap.
4. Environment / tone mapping: RoomEnvironment + ACES unchanged from run 3. ACES and SwiftShader remain uncontrolled for device fidelity (blocked).
5. Control: iridescence 0, no maps. Modes: treatment / control / r-only / g-only.

## WHAT RUN 4 CLAIMS TO ANSWER (proposed)
- Clears → leans "run-3 fail was fixture-compressed" (C-09 partially supported); run-3 fail stays historical fact.
- Fails → stronger evidence the independence check fails under MeshPhysicalMaterial + this metric even with a generous fixture; C-09 weakened (not disproven for hardware GPU).

## LABELING
- Never `pass` without named human review.
- Sensitivity clears → trial `label = inconclusive` (awaiting human review; run-3 fail kept in history).
- Sensitivity fails → `label = fail`, reason naming run 3 and run 4.

## SCOPE IN
This handoff; plane fixture path in `reference/abalone/` (asset path intact); generator + new synth map; run-trial.mjs run 4 with history 1–3 preserved and `effectCriterion.preRegistered` for run 4; captures; CONFLICT_LEDGER C-09 update; BUILD_RECEIPT-MVT-ABALONE-001-C09.md; READMEs/record status only as validators require; source zip refresh if record changes; push; PR #31 body run-4 section.

## SCOPE OUT
Lowering 0.01 or 8/255; merge; MVT-BUBBLE-001 / Gold / Console; hardware-GPU claims; removing ACES; rewriting C-07 defaults; completing human review.

## TESTS / GATES
`validate-material-lab`, `test-validate-material-lab`, `validate-meta`, `verify-source-archive` (expect 0); `validate-shaders` (may exit 1 on EGL — pre-existing). `npm ci && npm run fetch-asset && npm run trial` in reference/abalone; serve smoke if practical.

## DEFINITION OF DONE
Handoff committed before probe code; run 4 recorded with locked criterion and per-variant numbers; history intact; ledger + receipt written; validators run; pushed; PR #31 updated; not merged.

## STOP CONDITIONS / IF-THEN
Urge to soften criterion → stop, report fail. License issue → stop. Bubble → out. If validators need status change → status/receiptRef only.

## INTERRUPT ONLY FOR
Merge, publication, spend, credentials, licensing.

## EVIDENCE TO RETURN
Final SHA, PR URL, label, per-variant fractionOver8, commands+exit codes, files changed, C-09 status, next slice (named GPU review), receipt paths.
