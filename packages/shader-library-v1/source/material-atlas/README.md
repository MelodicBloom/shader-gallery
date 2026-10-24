# Material Atlas v0.1 — Option C, bounded 3D pilot

**Status:** Experimental browser implementation + shared state/parameter semantics; Unreal asset is a mapping handoff only. Existing `Shader Library v1` and its 15-specimen manifest remain unchanged. No claim is made that the user's full 30+ material inventory has yet been reconciled.

## Run

Within `packages/shader-library-v1/source/`, run a static web server (`python3 -m http.server 8000` or `npx serve .`) and visit `/material-atlas/`.

The app loads its new **Precious Opal** definition, then consumes the existing `../manifest.json` and corresponding `meta.json` records as live legacy 2D entries. It displays 3D/2D status clearly, avoiding a false claim that every existing fragment shader has a topology-aware volume renderer. It does not change the existing 15-entry count assertion, previews, generated outputs or public gallery.

## Mechanism boundaries

`core.js` — renderer-neutral, strict type/range/default validation, semantic controls, immutable state snapshots, event log, deterministic state replay, uniform output contract, Unreal scalar parameter mapping.

`materials/precious-opal.json` — semantic and UI controls with distinct topology, polish, surface relief, refractive index, body clarity, scatter, spectral domains, light direction and energy. `topology` is integer-valued, mapped as a choice (0 sphere, 1 cabochon, 2 crystal).

`shaders/precious-opal.frag` — WebGL2 300 ES 3D signed-distance field with editable topology, finite-difference surface normals, Fresnel/one-interface approximate refraction, approximate body scattering, spatial spectral-domain fire, roughness-controlled highlights and directional lighting. This is a **visually expressive approximation**, not measured precious opal or a spectral/FDTD photonic-crystal solver. Do not label brightness controls as actual radiometric values.

`app.js` — browser adapter using the existing `ShaderPlayer.js` from `../src/core/`, consuming v1 legacy metadata and the experimental semantic IR. Camera orbit and zoom are viewer parameters, not material optical coefficients. Reduced motion freezes the time dimension.

The `opalescent-glass` recipe in `qt314wink/shader-grammar` describes Rayleigh-like volume scattering and Fresnel/Snell. Precious opal's play-of-color involves ordered microstructure/Bragg diffraction: this experiment introduces a **separately tagged and intentionally unvalidated structural-color approximation**. Do not silently promote the approximation into the canonical grammar.

## Unreal adapter handoff (not yet implemented)

1. Export `materials/precious-opal.json` and parse into data assets or a material-function parameter schema in the Unreal adapter.
2. Map float parameters to a Dynamic Material Instance or Material Parameter Collection as appropriate; `topology` should select distinct meshes or SDF modeling assets (a scalar alone does not produce geometry).
3. Map Fresnel, scatter, domain-field controls to a UE material graph/HLSL implementation, using the same semantic interpretation and ranges. A WebGL2 GLSL file is **not** Unreal HLSL and is not directly portable.
4. Implement light direction through a spatially correct world/view transform, not mere angle reuse without coordinate reconciliation.
5. Verify with reference-camera, reference-light, neutral-test-chart, shader compile, and silhouette comparison. Record differences rather than claiming parity.

## QA & migration gates

Run `node --test material-atlas/tests/core.test.mjs` from package source. With EGL/GLES2 development libraries installed, run `node material-atlas/tests/shader.test.mjs` for six native GPU compilation/linking/render checks; GitHub workflow `.github/workflows/material-atlas-pilot.yml` runs both on the PR. Serve and test in a WebGL2 browser; check that orbit, topology, light, polish, spectral domains, screenshot capture and reset behave correctly. Verify that reduced-motion preferences freeze animation; non-WebGL2 must show a readable error.

Cross-material migration requires an inventory from `MelodicBloom/shader-gallery`, `qt314wink/shaders`, and any additional material registry. Deduplicate aliases by original implementation path and material mechanism; identify unported or missing specimens. For each migrated 3D material, require its own mechanism, shape/topology constraints, plausible and explicit default values, visual reference, neutral-light capture, controlled light-angle tests, and performance acceptance criteria. Do **not** substitute one generic rainbow effect across families.

Known limitations: no spectral transport, no real caustic bounce, limited single-surface SDF, experimental structural color, no GPU image-difference baseline, no Unreal binary asset, and no performance claims without device measurements. The standalone shader's look must be reviewed against a real reference independently of the image concept.
