# Gem reverse-hemisphere flash — light-frame contract (incubate scaffold)
Status: **draft / not implemented.** No shader GLSL changed in this commit.

## Problem
Gem/lens specimens (moissanite-brilliance, crystal-lens, opal-fire, labradorite-schiller, spectral-prism) go dark on reverse orbit: `lightDirection` is world-space, so the backside never sees key/fill.

## Proposed uniform contract (carry PR #29 pattern)
| Uniform | Type | Default | Meaning |
|---|---|---|---|
| `u_lightFrame` | int | `1` (camera-basis, once owner decides) | 0 = world-space (current behaviour, recoverable), 1 = camera-basis |
| `u_camRight` / `u_camUp` / `u_camForward` | vec3 | from `cameraOrbit` | camera basis fed per frame from JS |

GLSL: `vec3 L = (u_lightFrame == 1) ? normalize(u_camRight*lightDirection.x + u_camUp*lightDirection.y - u_camForward*lightDirection.z) : normalize(lightDirection);`

## Rules
- World-space path stays reachable (flag 0) — no specimen loses its current look.
- Lineage-B byte-identical GLSL (opal / labradorite / prism) gets a side-by-side variant path, not in-place rewrite.
- Abalone Inner Fire is NOT collapsed into portfolio-runtime abalone.
- Blocked until: world-space light toggle decision.

## Revert
`git revert <this commit>` (docs only). Once wired: set `u_lightFrame = 0` or revert the wiring commit.
