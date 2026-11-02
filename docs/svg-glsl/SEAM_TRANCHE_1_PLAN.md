# SVG ↔ GLSL port — seam tranche 1 (grain / lighting / glass)
Status: **plan only; port order still owner-gated.**

- `MelodicBloom/svg-filter-lab` stays the **teaching lab** and is never overwritten.
- GLSL ports land **beside** SVG (dual-backend) in `library-v1`, under a new port package path.
- **woodGrain / Brushed Metal stays SVG-only (seam S2).** No wood GLSL replacement.
- Risograph / posterize not ported until order decided.

| Seam | SVG primitive(s) | GLSL candidate | State |
|---|---|---|---|
| grain | feTurbulence (isotropic) | value/fbm noise grain | planned |
| lighting | feDiffuseLighting / feSpecularLighting | N·L + Blinn-Phong on height | planned |
| glass | feDisplacementMap | UV refraction offset | planned |
| S2 directional fibre (woodGrain) | anisotropic feTurbulence → feDiffuseLighting | **none — SVG-only** | pinned |

## Revert
Delete the port package / revert merge commit; SVG lab unchanged.
