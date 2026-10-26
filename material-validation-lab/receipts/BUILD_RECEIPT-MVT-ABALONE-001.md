# BUILD_RECEIPT — MVT-ABALONE-001

Completed 2026-10-26 ~10:15 AM EDT (America/New_York). Labels: measured / proposed / historical / unverified / blocked.

| Field | Value |
|---|---|
| Repo / path | `MelodicBloom/shader-gallery`, `/workspace/shader-gallery` |
| Base branch | `feat/material-validation-lab-v0` @ `61b3142a66444708196ccad7ec0d407150ba81ab` |
| Working branch | `feat/mvt-abalone-001` |
| Implementation commits | `614f2e6` (pins + record), `776c90b` (lane, page, receipt); this receipt is the next commit |
| Trial label | **`inconclusive`** (measured automated checks; R-channel criterion unmet at 2/3 fixtures; human review outstanding) |
| Stop condition reached | Definition of done met for abalone; stopped before MVT-BUBBLE-001 / MVT-GOLD-001 as scoped |

## Source pins (measured)
- Asset: KhronosGroup/glTF-Sample-Assets @ `4995a638c96dbc94376d3d6164e70fee3ac7f7a2`, `Models/IridescenceAbalone/glTF-Binary/IridescenceAbalone.glb`, 9,300,744 bytes, SHA-256 `d15ab000d3b04f177e101b2a36aacbf1c99490fc9bfe3868d481d75736946bab`, git blob `ba1db49b…` (matches GitHub API listing). Hash re-checked in-browser at runtime.
- License: `LICENSE.md` + `metadata.json` at that commit say CC-BY-4.0; Abby Crawford 2015 (everything), Eric Chadwick 2023 (materials). Matches registry attribution, so no provenance stop.
- Spec: KhronosGroup/glTF @ `acfcbe65e40c53d6d3aa55a7299982bf2c01c75d` (latest commit touching `KHR_materials_iridescence`).
- Three.js `0.186.1` (r186), locked in `reference/abalone/package-lock.json` only. No global dependency change, so no migration stop.

## Files changed
- Modified: `README.md` (branch map row), `material-validation-lab/README.md`, `material-validation-lab/CONFLICT_LEDGER.md` (C-07, C-08), `packages/shader-library-v1/source/material-validation-lab/SOURCE_REGISTRY.json`, `…/materials/abalone-baseline.record.json` (status `inconclusive`, resolvedPins, receiptRef), `packages/shader-library-v1/melodicbloom-shader-library-v1-source.zip` (the same two members refreshed for archive parity).
- Added: `material-validation-lab/reference/abalone/**` (page, app, styles, tools, package lock, receipt, 7 captures), `material-validation-lab/receipts/BUILD_HANDOFF-…`, this file.

## Commands and exit codes (measured)
| Command (from `packages/shader-library-v1/source` unless noted) | Exit | Note |
|---|---|---|
| `node tools/validate-material-lab.mjs` | 0 | 3 records valid |
| `node tools/test-validate-material-lab.mjs` | 0 | mutants rejected |
| `node tools/validate-meta.mjs` | 0 | 19 metadata files |
| `node tools/verify-source-archive.mjs` | 0 | 80 files / 19 shaders parity |
| `node tools/validate-shaders.mjs` | 1 | **blocked**: box lacks `libEGL`/`libGLESv2` dev libs (`ld: cannot find -lEGL`); fails identically on the untouched base branch; library mechanics only |
| `reference/abalone`: `node tools/fetch-asset.mjs` | 0 | hash ok |
| `reference/abalone`: `node tools/run-trial.mjs` (run 1) | 1 | historical: whole-frame metric → automated `fail` |
| `reference/abalone`: `node tools/run-trial.mjs` (final) | 0 | label `inconclusive`, 0 console errors |

## Environment (measured)
Headless Chrome 156.0.8078.47 via playwright-core 1.64.1; WebGL2 through ANGLE Vulkan **SwiftShader (software)**. There is no hardware GPU on the box.

## Control outcomes (measured, shell-masked fraction of pixels changing by more than 8/255; criterion ≥ 0.01)
| Fixture | treatment vs neutral control | R contributes (treatment vs G-only) | G contributes (treatment vs R-only) | R-only vs G-only |
|---|---|---|---|---|
| neutral (polar 20°, light 45°) | 0.0446 ✓ | 0.0075 ✗ | 0.0648 ✓ | 0.0777 ✓ |
| grazing (polar 75°) | 0.0466 ✓ | 0.0077 ✗ | 0.0648 ✓ | 0.0889 ✓ |
| light-sweep (light 180°; 0/90/180/270 sweep) | 0.0756 ✓ | 0.0103 ✓ | 0.0905 ✓ | 0.1101 ✓ |
Map colour-space: both iridescence maps are `NoColorSpace` (measured), and both use the same packed texture.

## Performance
Frame time is **blocked**: the box only has a software rasterizer and no device target has been declared. No FPS numbers were recorded or claimed.

## Conflicts discovered (kept open)
- C-07: the record default thickness is 100–400 nm, but the asset authors 600–800 nm. The trial used the asset values and left the record unchanged.
- C-08: the metric was revised after run 1 (post-hoc). Both runs are kept in `receipt.history`. R independence is unproven with the asset's own map.

## Known limitations
RoomEnvironment (procedural) stands in for a pinned HDRI. The pixel metric shows that an effect exists, not that it is correct. RGBA8 readback cannot see NaN. The renders are software-only. There has been no human review, so `pass` is impossible by design.

## Explicit non-claims
No measured abalone optics, physical calibration, mineral simulation, original material, mobile optimisation, frame rate, or KHR_materials_iridescence conformance.

## Blocked / needs approval
Human review (named reviewer) is needed for any `pass`. Merging and Pages publication have not been requested and were not done. Hosting the page statically would need `node_modules/three` vendored or a CDN import map (proposed).

## Exact next slice
**Proposed: finish MVT-ABALONE-001 before Bubble.** Add synthetic isolated R/G test maps (an R gradient with constant G, and a G gradient with constant R), pre-declare the criterion, re-run, then get a named human review. After that, the next item in the handoff order is MVT-BUBBLE-001 (step 4).
