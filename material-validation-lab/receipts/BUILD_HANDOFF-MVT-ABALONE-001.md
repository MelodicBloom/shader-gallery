# BUILD_HANDOFF — MVT-ABALONE-001 (Khronos abalone baseline)

Written before implementation, 2026-10-26 (America/New_York). Labels: measured / proposed / historical / unverified / blocked.

| Field | Value |
|---|---|
| OBJECTIVE | Ship one public-facing abalone material trial page with a machine-readable evidence receipt that separates measured results from non-claims. |
| REPO | `MelodicBloom/shader-gallery` (origin `https://github.com/MelodicBloom/shader-gallery.git`), local `/workspace/shader-gallery` |
| DEFAULT BRANCH | `main` (local start `f9bebc9`, shallow) |
| BASE BRANCH / START SHA | `feat/material-validation-lab-v0` @ `61b3142a66444708196ccad7ec0d407150ba81ab` |
| WORKING BRANCH | `feat/mvt-abalone-001` |
| DIRTY STATE AT START | clean |
| PACKAGE MANAGER | npm (Node v20.19.2). No root lockfile; `packages/shader-library-v1/source/package.json` has no dependencies and no lockfile. |
| TEST AVAILABILITY | Node validators present; Chrome (`/usr/bin/google-chrome`) and Playwright Chromium cache present on box; GPU is unknown (likely software rasterizer). |

## AUTHORITY
- Authoritative: `material-validation-lab/ENGINEERING_HANDOFF.md` (implementation order steps 1–3), `TRIALS.md` (MVT-ABALONE-001 contract), `CONFLICT_LEDGER.md` (C-01, C-03), `packages/shader-library-v1/source/material-validation-lab/SOURCE_REGISTRY.json` + `materials/abalone-baseline.record.json`, validator `tools/validate-material-lab.mjs`.
- Supporting: lab `README.md`, root README branch map.
- Settled: WebGL2 library stays baseline; Three lane is isolated; neutral control = `iridescence: 0` + no map; `pass` requires a named human review.
- Open: no device FPS target exists (ledger "known non-resolution").

## SCOPE IN
- Pin SRC-KHR-ABALONE, SRC-KHR-IRIDESCENCE, SRC-THREE-PHYSICAL revisions/hashes in the registry and record.
- New isolated lane `material-validation-lab/reference/abalone/` with its own `package.json` + `package-lock.json` (three pinned exactly).
- Trial page (WebGL2 via Three), control/treatment toggle, R/G channel-isolation views, reduced-motion + static fallback, attribution, evidence chain section.
- Capture script producing three fixture captures + `receipt.json`; record status update; validator mutant case if a new rule is added.

## SCOPE OUT
Unity/Unreal; studio UI / catalog expansion; PR #15/#17 remediation; MVT-BUBBLE-001; MVT-GOLD-001; FPS numbers; physical calibration claims; merge to main; Pages publication; seed-loom PR #71.

## REQUIREMENT IDS
MVT-ABALONE-001; ENGINEERING_HANDOFF steps 1, 2, 3.

## TESTS / GATES
`node tools/validate-material-lab.mjs`, `node tools/test-validate-material-lab.mjs`, `node tools/validate-meta.mjs`, `node tools/validate-shaders.mjs` (latter two = library mechanics only), headless capture run exit code. Manual: human reviewer rating of the three captures (cannot be performed by the agent).

## DEFINITION OF DONE
Branch pushed; one documented run command; receipt with pins, files, commands+exit codes, environment, control outcomes, label, attribution, limitations, non-claims; validators pass; PR opened (not merged).

## STOP CONDITIONS
License/provenance mismatch with registry; Three would need a global dependency migration; any urge to start bubble/gold.

## IF/THEN RULES
- No human reviewer → label cannot be `pass`; use `inconclusive` with reason "awaiting human review".
- Software GPU only → frame timing `blocked`; captures still recorded with renderer string.
- Asset declared values differ from record defaults → keep both, log in CONFLICT_LEDGER, do not silently overwrite.

## INTERRUPT ONLY FOR
Merge, publication, spend, credentials, licensing conflict.

## EVIDENCE TO RETURN
`BUILD_RECEIPT-MVT-ABALONE-001.md` + `reference/abalone/receipts/receipt.json`.
