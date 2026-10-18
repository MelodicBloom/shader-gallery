---
name: procedural-material-reconstruction
description: Conduct bounded procedural material reconstruction experiments from visual references or node-graph tutorials. Use for InstaMAT/Substance Designer translation, synthetic height/normal/roughness texture generation, source/provenance triage, deterministic tests, shader-gallery Material Validation Lab receipts, and controlled comparison planning.
compatibility: Python 3.10+, git, optional InstaMAT Studio and a separately pinned renderer. No Python packages needed for GEO-TILE-001.
metadata:
  author: MelodicBloom
  version: "0.1.0"
---
# Procedural Material Reconstruction — experiment skill

Use this skill only after checking repository authority and local state. **Do not** silently edit qt314wink/shader-grammar, the three existing Material Validation Lab pilots, packages/shader-library-v1/source/manifest.json, or the source archive. This skill belongs to MelodicBloom/shader-gallery and produces **candidate evidence**, not canonical materials.

## Procedure

1. Read material-validation-lab/README.md, material-validation-lab/SOURCE_REGISTRY.json, the target experiment README and [quality gates](references/QUALITY_GATES.md). Record the exact base SHA and working-tree status. Existing unmerged PRs are not implicit authorization to merge.
2. Identify source identity, license, and evidence: tutorial steps are described mechanisms; external artwork or assets require separate permission/pinning. Label every assumption observed, inferred or proposed; never invent a measurement.
3. Map the reference to independent operations: geometry and tiling → structured height → stochastic wear → channel-specific outputs → actual view/light behavior. Keep filtering, seed, tile parity, map bit depth, and color-space assumptions visible.
4. For GEO-TILE-001 run at repository root:

   ~~~bash
   cd material-validation-lab/experiments/GEO-TILE-001
   python3 -m unittest discover -s . -p 'test_*.py' -v
   python3 generate_maps.py --size 512 --tiles 6 --seed 42 --wear-gain 0.4 --output out/geotile-seed42
   ~~~

5. Inspect PNG dimensions, SHA-256 receipt and diagnostic_preview.png; rerun same settings to test byte stability, then vary one parameter at a time. Read INSTAMAT_RECIPE.md if comparing against manually authored InstaMAT maps.
6. Require three controlled renderer captures (neutral, grazing, light-sweep) and one negative control for a **visual/material** pass; generate TRIAL_TEMPLATE.json-derived receipt filled with environment metadata and any failure. Automated CPU tests alone qualify only as synthetic-field-generated.
7. Produce a handoff: source links/licenses, pinned code SHA, commands + exit statuses, full changed-file list, hashes, claims/non-claims, failures and next smallest action. Stop if requested to claim physics, fidelity, app automation, or frame rate not actually tested.

## Escalation / stop

Stop and ask for a scope decision before changing shared schema, adding operators, importing a non-redistributable texture, changing existing gallery shaders, deploying, merging, or backfilling results. Do not treat approximate normal/AO maps as measured ground truth. Follow [quality gates](references/QUALITY_GATES.md) for fail/blocked/inconclusive outcomes.
