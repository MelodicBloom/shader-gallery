# Material Validation Lab v0 — Engineering Handoff

## Recommended path

Run the three pilot trials against a pinned source snapshot, using Shader Library v1 for WebGL2 compile/fallback evidence and an isolated Three.js reference lane for the Khronos GLB. Do not merge the Lab into a claim of a fully PBR, mobile or physically calibrated system.

## Entry state

| Field | Verified value |
|---|---|
| Repository | `MelodicBloom/shader-gallery` |
| Lab branch | `feat/material-validation-lab-v0` |
| Base snapshot | PR #15 head `aec2e3cfaf4e53d639ec611655d927e1b5942f6e` |
| Existing unresolved review debt | source ZIP lacks three studies; bfcache restore stops studio animation |
| Authority | Lab docs/records/tools only; does not merge, deploy, or alter existing shader behavior |

## Commands

```bash
cd packages/shader-library-v1/source
node tools/validate-material-lab.mjs
node tools/test-validate-material-lab.mjs
node tools/validate-meta.mjs
node tools/validate-shaders.mjs
```

The last two commands test existing library mechanics; their result is not a material-fidelity pass.

## Next implementation order

1. Pin the external source commits and downloaded asset hashes in the three records. Stop if license text or asset provenance differs from the registry.
2. Add an isolated Three.js `reference/abalone` adapter with its own version lock and no gallery dependency change.
3. Execute MVT-ABALONE-001, producing controlled captures and a machine-readable receipt.
4. Add the Bubble treatment beside, not over, its RGB proxy control. Execute MVT-BUBBLE-001.
5. Build Gold Foil’s deterministic field and execute MVT-GOLD-001.
6. Reconcile PR #15's stale archive and bfcache fixes independently; its review debt is upstream of public presentation but not a reason to rewrite the Lab.

## Stop / escalate

- A source cannot be pinned, its license conflicts, or a record cannot retain attribution.
- A proposed control has no unit, bound, visual criterion or stated model boundary.
- The Three reference lane would require a global dependency migration.
- A material only matches a static hero image and fails neutral/grazing/sweep review.
- Device FPS thresholds are requested before target devices and scene complexity are declared.

## Receipt required per trial

Return source revisions/hashes; changed files; commands and exit codes; browser/GPU/version; neutral/grazing/sweep state receipts; control and negative-control outcomes; label (`pass`, `fail`, `blocked`, `inconclusive`); attribution; limitations; and an explicit statement of what was not claimed.
