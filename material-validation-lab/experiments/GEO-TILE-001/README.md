# GEO-TILE-001 — procedural reconstruction experiment

**Status:** executable original synthetic-field baseline; comparison/render trial **NOT RUN**. This is an additive, noncanonical Material Validation Lab experiment, not a fourth pilot record or a new Shader Grammar operator.

## Why this exists

Turn the procedural reasoning demonstrated in debe3D's [InstaMAT recreation video](https://www.youtube.com/watch?v=CJjm8A7xbdo) into inspectable operations: shape → controlled tiling/parity → height/noise/wear → channel-specific maps → controlled comparisons. It is **inspired by the workflow**, not an import of the artist's material or InstaMAT graph. No external textures or copyrighted reference frames are redistributed.

## Quick start (Windows WSL Ubuntu, Python 3.10+, no pip packages)

~~~bash
cd material-validation-lab/experiments/GEO-TILE-001
python3 -m unittest discover -s . -p 'test_*.py' -v
python3 generate_maps.py --size 512 --tiles 6 --seed 42 --wear-gain 0.4 --output out/geotile-seed42
python3 generate_maps.py --size 512 --tiles 6 --seed 43 --wear-gain 0.4 --output out/geotile-seed43
~~~

Inspect out/geotile-seed42/diagnostic_preview.png and receipt.json. Outputs are **generated** into an ignored out/ directory; no render results are committed as validation evidence by default.

### Contract / interpretation

- height.png: normalized **16-bit linear** synthetic height (scale is arbitrary until a renderer assigns physical displacement scale).
- normal_tangent_proxy.png: RGB8 +Z tangent-like derivative normal, Y convention requires importer check; not yet validated on UV-mapped geometry.
- roughness.png: RGB-independent 8-bit *linear roughness*, **not** sRGB. It derives from arc/wear/grain, not the height map alone.
- base_color.png: RGB8 authored green stylization, interpret as sRGB base color.
- metalness.png: all zero (dielectric), intentionally not a metallic foil.
- ambient_occlusion_proxy.png: grayscale stylized cavity weighting, **not** physically baked AO.
- wear_mask.png: synthetic art-direction mask; diagnostic_preview.png is a simple CPU preview, **not** PBR.
- receipt.json: inputs, algorithm version, channel semantics, file SHA-256 and explicit non-claims.

Changing --seed must change at least the height map hash; the same seed and params must reproduce all map hashes. The test suite checks these properties and PNG dimensions. Tile parity rotates the asymmetrical corner arcs 180 degrees, unlike the failed symmetric first draft. Every pixel is evaluated from a deterministic coordinate hash; no uncontrolled RNG or image download occurs.

## Guided experimental sequence

1. **Local proof (automated):** run tests and generation above; save exit status, receipt, and full command. Stop on any failed test.
2. **InstaMAT reconstruction (manual):** follow [INSTAMAT_RECIPE.md](INSTAMAT_RECIPE.md). Author an independent graph. Record node parameters, app version, screenshots and export channel settings; do not claim export automation exists.
3. **A/B:** render the generated textures and manually authored InstaMAT set on the **same** mesh, camera, neutral environment, exposure and three lighting fixtures (neutral, grazing, light-sweep). Record normal-Y, UV tiling, material scale, roughness response and edge seams.
4. **Ablations:** compare wear 0 vs 0.4; seed 42 vs 43; alternate rotation on vs off (manual graph); linear vs nearest filtering (InstaMAT). Change exactly one independent variable at a time.
5. **Decision gate:** do not call it matched, physically accurate, performant or portable without named visual review and renderer/device receipts. Record pass/fail/blocked/inconclusive in a separate trial receipt following [TRIAL_TEMPLATE.json](TRIAL_TEMPLATE.json).

GEO-TILE-001 is deliberately outside packages/shader-library-v1/source and its source ZIP parity contract until runtime adoption is approved. shader-grammar remains semantic authority. A future mapping to its existing typed operations must be separately reviewed; do not invent operators in this experiment.
