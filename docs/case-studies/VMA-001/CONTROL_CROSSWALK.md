# VMA-001 — Abalone Control Crosswalk

**Scope:** descriptive reconciliation only. This document does not introduce a shared control schema or establish numerical equivalence.

## Contexts compared

| Context | Authority / ref | Renderer | Contract status |
|---|---|---|---|
| Material Validation Lab | `MVT-ABALONE-001` on `main@f9bebc…` | planned Three.js glTF reference lane | authoritative evidence record; trial not run |
| Optical Studio v1.2 | PR #13 at `bc84ebc…` | standalone fullscreen WebGL2 | experimental draft; its checked-in metadata is derived |
| Portfolio runtime | `feature/issue-11-abalone-runtime@089326c` | raw WebGL2/GLSL ES 3.00 + Zustand | separate experimental branch; not merged into `main` |

## Crosswalk

| Semantic area | Portfolio runtime | Optical Studio v1.2 | Lab / Khronos reference | Translation decision |
|---|---|---|---|---|
| Fine surface structure | `grain`, `[0,1]`, default `0.48`, “Layer detail” | `grain`, `[0,1]`, default `0.56`, “Growth texture” | external base/normal texture semantics to inspect | Same spelling, different stated role and defaults. No shared value. |
| Lamellar organization | `layerSpacing`, `[0.35,1.6]`, default `0.94` | `layerDepth`, `[0,1]`, default `0.6` | `iridescenceThicknessRangeNm`, `[0,2000] nm`, default `[100,400]` | **Incompatible units and mechanism.** A nanometre thin-film range is not an authored spacing/depth dial. |
| Hue / phase art direction | `paletteShift`, `[0,1]`, default `0.32` | `paletteShift`, `[0,1]`, default `0.48` | no equivalent Lab art control | Similar name/range only. May be compared qualitatively, not copied. |
| Interference/color amplitude | `spectral`, `[0,1]`, default `0.62` | `spectral`, `[0,2]`, default `0.92` | `iridescence`, `[0,1]`, default `1` | Values are not transferable: Optical Studio allows >1 authored gain; glTF iridescence is a material-factor semantic. |
| Inner light events | `fireStrength`, `[0,1.5]`, default `0.78` | `glintStrength`, `[0,3]`, default `1.35`; `fireDensity`, `[0,1]`, default `0.72` | none | Related visual intent only; one runtime control cannot stand in for amplitude plus density. |
| Surface spread | `roughness`, `[0.08,0.8]`, default `0.26` | `roughness`, `[0.05,0.85]`, default `0.28` | Khronos ORM G channel, to inspect; Lab does not define a mutable roughness control | Comparable concept, but texture, BRDF and lighting contexts differ. Record observations before any adapter. |
| Light | `lightHeading`, `[-3.14,3.14]`, camera-basis behavior | hidden `lightDirection` vec3 and time-based sweep | controlled light position/vector captured per fixture | Fixture inputs can be aligned descriptively; no common coordinate system has been proven. |
| View | yaw/pitch/distance camera, 3 × 3 paused matrix | hidden `cameraOrbit` vec3 | neutral/grazing/light-sweep camera receipt | Use the Lab fixtures as acceptance names; preserve each renderer’s camera implementation. |
| Debug isolation | none | `debugPass`, `[0,4]` | none | Optical Studio-only diagnostic; no production/UI mapping. |
| Exposure | no material control shown | no material control shown | art `exposure`, `[-4,4] EV`, default `0` | Lab-only presentation control; must be recorded in every capture. |

## Rules for a later adapter

1. It must declare source and target renderer, coordinate system, transfer function, units, default, bounds, and whether a mapping is measured, fitted, or artistic.
2. A mapping cannot be called equivalent solely because control labels overlap.
3. `iridescenceThicknessRangeNm` remains a physical-input proxy in nanometres; `layerSpacing` and `layerDepth` remain authored proxy controls unless a future experiment proves a relationship.
4. The Lab's neutral control must set `iridescence: 0`, not merely remove the map.
5. G1 must preserve the three fixed Lab views and the runtime’s separate 3 × 3 matrix. One does not replace the other.

## Decision

**No control consolidation in G0.** The correct short-term architecture is a translated, evidence-labeled adapter only if G1 demonstrates need. The alternative—one universal “nacre” control object—would be convenient but would erase units, renderer assumptions, and the evidence boundary that the Lab exists to protect.
