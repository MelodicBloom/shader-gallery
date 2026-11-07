# SVG ↔ GLSL port — seam tranche 1 (grain / lighting / glass)
Status: **grain-only comparison authorized and implemented for review; later ports remain owner-gated.**

## Owner decision — 2026-11-06

The owner said “Go ahead, and get started on the work” after the recommendation
to begin with isotropic grain and pin bounded acceptance checks. This authorizes
the grain-only comparison. The proposed sequence is grain → lighting → glass;
lighting and glass each retain a later owner decision. No merge is authorized here.

- `MelodicBloom/svg-filter-lab` stays the **teaching lab** and is never overwritten.
- GLSL ports land **beside** SVG (dual-backend) in `library-v1`, under a new port package path.
- **woodGrain / Brushed Metal stays SVG-only (seam S2).** No wood GLSL replacement.
- Risograph / posterize not ported until order decided.

| Seam | SVG primitive(s) | GLSL candidate | State |
|---|---|---|---|
| grain | feTurbulence (isotropic) | value/fbm noise grain | isolated prototype; acceptance below |
| lighting | feDiffuseLighting / feSpecularLighting | N·L + Blinn-Phong on height | planned |
| glass | feDisplacementMap | UV refraction offset | planned |
| S2 directional fibre (woodGrain) | anisotropic feTurbulence → feDiffuseLighting | **none — SVG-only** | pinned |

## Revert
Delete `packages/shader-library-v1/source/ports/grain` and rebuild the live preview,
or revert the implementation commit and rebuild. The generated
`library-v1/ports/grain` route disappears. The regression test checks that existing
manifest shaders remain intact. SVG lab is a separate repository and unchanged.

## Grain slice and acceptance

- Canonical source: `packages/shader-library-v1/source/ports/grain`; generated
  comparison route: `library-v1/ports/grain/`. The transactional build copies ports
  from source so the route survives rebuilds. No manifest promotion.
- Preserve upstream `roughPaper` in a frozen SVG fixture with source commit and
  SHA-256 receipts. Label the active SVG grain-only extraction separately from
  that original filter, which also contains lighting.
- Use bounded shared strength, isotropic frequency, octave, and seed controls.
  Independently seeded SVG fractalNoise and GLSL value noise are approximate
  correspondences; no identical-pixel or physical-material claim.
- Verify same-backend pixel repeatability, zero-strength identity against the
  unfiltered substrate, visible nonzero grain, and sensitivity to each control.
- Exercise desktop and phone-width rendering, keyboard controls, invalid input,
  WebGL fallback/context recovery, and source-package removal/rebuild rollback.
- Browser evidence must identify the tested revision, browser, viewport, renderer,
  and limitations. Software rendering is not hardware-GPU acceptance.

Tests: `node --test tools/grain-port.test.mjs`, `node tools/test-build-live-preview.mjs`,
and `node tools/grain-port-qa.mjs` from the source package. Runtime is static and
needs no application build beyond `node tools/build-live-preview.mjs`.

Grain approval does not authorize a risograph/posterize port, S2 replacement,
lighting/glass implementation, specimen deletion, consolidation, or force-push.
Human material/texture review and a deployed-route smoke test remain separate gates.
