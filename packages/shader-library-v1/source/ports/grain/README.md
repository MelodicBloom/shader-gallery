# Isotropic grain comparison

Run from the repository root with `python3 -m http.server 8000`, then open
`http://localhost:8000/library-v1/ports/grain/` after rebuilding:

```sh
cd packages/shader-library-v1/source
node tools/build-live-preview.mjs
node --test tools/grain-port.test.mjs
node tools/grain-port-qa.mjs
```

Browser QA requires the same `playwright@1.55.0` runtime used by the existing
live-preview workflow. `GRAIN_QA_OUTPUT` selects an evidence directory outside
the repository. `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` optionally selects an
already installed Chromium. No dependency or lockfile change is required.

The canonical package lives at `source/ports/grain`. The build copies it to
`library-v1/ports/grain`; edit source, then rebuild. This package has no external
runtime dependencies and does not modify the shader manifest or shared player.

## Source and interpretation

The original `roughPaper` SVG filter is preserved byte-for-byte inside
`reference/rough-paper.svg`, with a wrapper and flat substrate added for viewing.
It includes the original lighting. Its upstream revision, source-file digest,
filter-excerpt digest, fixture digest, and adaptations are in `provenance.json`.
Source: MelodicBloom/svg-filter-lab, `index.html`, commit
`1d58b4a178d74f30d1f83699d1043eab8306455d` (upstream README declares MIT).

The active SVG comparison is a separately labeled derivative: isolate its
isotropic fractalNoise, remove lighting, add explicit seeded controls, grayscale,
opaque multiply strength, and an explicit sRGB filter space. GLSL uses independent
value noise; equal seeds do **not** mean equal noise patterns across backends.
Frequency means noise scale per fixed fixture pixel. CSS resize does not change
the 384×384 sampling grid. The study intentionally does not animate.

Tests establish same-backend repeatability in the recorded browser, zero-strength
identity, nonzero spatial variation, control sensitivity, input bounds, layout,
keyboard controls, fallback, context-loss recovery, and rebuild/rollback behavior.
They do not establish visual equivalence, cross-browser/cross-driver bit equality,
physical accuracy, hardware behavior, accessibility compliance, or performance.

## Revert

Delete `source/ports/grain` and rebuild; the generated grain route disappears.
Existing manifest shaders and previews remain. The builder's regression test
exercises this removal. Alternatively revert the implementation commit and
rebuild. SVG Filter Lab is a separate repository and receives no writes.
