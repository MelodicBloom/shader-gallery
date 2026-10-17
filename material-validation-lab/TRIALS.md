# Bounded Trial Contracts

## MVT-ABALONE-001 — channel and lighting baseline

- **Decision dependency:** whether documented glTF iridescence maps can anchor a procedural-nacre comparison.
- **Hypothesis:** with a pinned asset, loader and renderer, the packed R/G texture produces independent iridescence intensity and thickness behavior under controlled light and view changes.
- **Falsifier:** a channel-isolation fixture cannot produce the declared behavior, map colour-space differs from `NoColorSpace`, or the result depends on undocumented manual changes.
- **Control:** neutral `MeshPhysicalMaterial` with the same geometry and no iridescence map.
- **Independent variables:** camera polar angle; key-light azimuth; iridescence multiplier; thickness range; isolated R/G test maps.
- **Dependent measures:** compile/load status; map-channel receipt; three captures; reviewer ratings against declared angular response.
- **Fixtures:** neutral / grazing / sweep, fixed HDRI and exposure, pinned asset commit/hash.
- **Result:** planned. No performance or physical-accuracy claim is permitted.

## MVT-BUBBLE-001 — optical treatment vs RGB-proxy control

- **Decision dependency:** whether spectral integration is worth its cost for this gallery.
- **Hypothesis:** a bounded two-beam spectral treatment changes hue and intensity coherently with thickness and incident/view angle, while an RGB-proxy control does not satisfy the same mechanism criterion.
- **Falsifier:** the treatment does not respond monotonically to thickness changes in chosen fixture slices, cannot compile in WebGL2, or is visually indistinguishable from its proxy under the review protocol.
- **Control:** existing RGB-proxy thin-film/soap-bubble material, labeled non-spectral.
- **Negative control:** fixed single-color film map; expected to fail the spectral-response criterion.
- **Boundary control:** thickness below/above declared range must clamp or produce a labeled invalid state, never NaN/flicker.
- **Time/mutation ceiling:** one GLSL module + one new record; stop before scene-level bubble dynamics or drainage simulation.
- **Result:** planned.
## MVT-GOLD-001 — original field and PBR response

- **Decision dependency:** whether original deterministic structural fields can create a reusable metallic material without image-asset dependence.
- **Hypothesis:** a fold-height field coupled to normal and roughness variation produces directional highlight breakup that persists under three light directions.
- **Falsifier:** visual identity vanishes outside its hero view, fields are non-deterministic for a fixed seed, or normal/roughness controls cause invalid values.
- **Control:** flat metallic gold with identical base color and lighting.
- **Negative control:** fold amplitude zero; expected to collapse toward the flat control.
- **Result:** planned.
