# Material Validation Lab v0 — Engineering Handoff

## Recommended path

Run the three pilot trials against a pinned source snapshot, using Shader Library v1 for WebGL2 compile/fallback evidence and an isolated Three.js reference lane for the Khronos GLB. Do not merge the Lab into a claim of a fully PBR, mobile or physically calibrated system.

## Entry state

| Field | Verified value |
|---|---|
| Repository | `MelodicBloom/shader-gallery` |
| Lab authority | merged to `main` by PR #18 as `f9bebc950864d83e6748f97cd4b2319f0a965c98` on 2026-10-24; historic PR head `61b3142a66444708196ccad7ec0d407150ba81ab` |
| Historical base snapshot | PR #18 was based on `main@1497a52d1e22312c287fc3f88a3fe695f6fa559f`; it is not the current execution base |
| Existing unresolved review debt | No inherited PR #15/PR #17 debt: source archive parity is currently verified at 80 source files / 19 manifest shaders, and Optical Studies resumes after persisted `pageshow` |
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
6. Keep archive parity and bfcache recovery under their existing CI/browser checks; do not reopen completed PR #15/PR #17 remediation during a material trial.

## Stop / escalate

- A source cannot be pinned, its license conflicts, or a record cannot retain attribution.
- A proposed control has no unit, bound, visual criterion or stated model boundary.
- The Three reference lane would require a global dependency migration.
- A material only matches a static hero image and fails neutral/grazing/sweep review.
- Device FPS thresholds are requested before target devices and scene complexity are declared.

## Receipt required per trial

Return source revisions/hashes; changed files; commands and exit codes; browser/GPU/version; neutral/grazing/sweep state receipts; control and negative-control outcomes; label (`pass`, `fail`, `blocked`, `inconclusive`); attribution; limitations; and an explicit statement of what was not claimed.
