# BUILD_RECEIPT — MVT-ABALONE-001 METALMAP (run 7)

| Field | Value |
|---|---|
| Handoff | `receipts/BUILD_HANDOFF-MVT-ABALONE-001-METALMAP.md` (committed ed10eb9 before any run-7 code/measurement) |
| Command | `cd material-validation-lab/reference/abalone && npm ci && npm run trial` (exit 0) |
| Renderer | ANGLE / SwiftShader (Vulkan 1.3.0), headless |
| Criterion | unchanged: shell-masked fractionOver8 >= 0.01, cut-off 8/255, ALL fixtures × EACH check × EACH synth variant |
| Trial label | `inconclusive` (no human review; cannot emit pass) |

## Results (measured, same run)
| Cell | metalness | metalnessMap | automatedChannelCheck | min fractionOver8 (where) |
|---|---|---|---|---|
| authored shell synthetic (anchor) | 0.5 | kept | fail | 0.0028 (grazing / gChannelContributes / synth-g) |
| **shell-metal1-mapkept** (7a, new) | 1.0 | kept | **pass** | 0.0275 (neutral / rChannelContributes / synth-r) |
| **shell-metal05-mapnull** (7b, new) | 0.5 | null | **pass** | 0.0163 (grazing / iridescenceVisibleVsNeutralControl / synth-g) |
| shell-metal1 (anchor, run 6b) | 1.0 | null | pass | 0.0733 (grazing / rChannelContributes / synth-r) — matches run 6 |

All four checks pass for both new variants at neutral/grazing/light-sweep for synth-r/synth-g/synth-g-r1.

## Interpretation vs locked rules (proposed)
- mapkept PASS & metal1 PASS → scalar metalness=1 is sufficient; nulling the map was unnecessary for clearing.
- mapnull PASS → removing the map alone (scalar 0.5) is also sufficient. Either change alone clears; neither is required.
- Known mechanism (proposed, three.js docs, not measured GPU math): effective metalness = scalar × texel.b; mapkept is not
  a constant-1 field. Ordering of margins (metal1 > mapkept > mapnull) is consistent with higher effective metalness → larger response (proposed).

## Labels
`automated.shellMetal1MapKept.automatedChannelCheck=pass`, `automated.shellMetal05MapNull.automatedChannelCheck=pass`
(measured); `automated.metalMapOutcome` (proposed). History runs 1–6 preserved (run 6 entry now labelled historical) +
run 7 added; UV diagnostics untouched; C-07 thickness default untouched.

## Validators (measured exit codes)
validate:material-lab 0; test:material-lab 0; validate:meta 0; `node tools/verify-source-archive.mjs` 0; validate:shaders 1 (blocked: missing -lEGL/-lGLESv2, pre-existing).

## Not done
No merge of PR #31; no Bubble/Gold/Console; no human review; no roughness/ACES/HDRI variants; criterion not softened.
