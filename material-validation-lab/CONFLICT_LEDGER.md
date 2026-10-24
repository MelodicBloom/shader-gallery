# Material Validation Lab — Conflict Ledger

This ledger preserves disagreement instead of converting it into a neat but false architecture.

| ID | Showdown | Evidence | Decision | What it enables | Cost / retained risk | Reversal trigger |
|---|---|---|---|---|---|---|
| C-01 | Existing fullscreen WebGL2 library vs immediate R3F rewrite | PR #15 contains compile fixtures, metadata and fallback mechanics; no current R3F app dependency is evidenced | Keep WebGL2 as the pilot runtime; design an adapter boundary for later Three/R3F comparison | Uses verified infrastructure and avoids a dependency migration before material behavior is known | The baseline cannot directly load the Khronos GLB | A pinned Three reference lane passes the same fixture protocol and gives a material behavior impossible to test in fullscreen mode |
| C-02 | Three.js physical material vs custom optical shader | Three docs expose iridescence, anisotropy, transmission and dispersion; Bubble requires explicit two-beam spectral mathematics | Use `MeshPhysicalMaterial` where its parameters express the target; write custom GLSL only for differentiated mechanism | Smaller custom surface and clearer portability | Some signature appearance will remain a proxy | Standard material fails a defined view/light response despite valid maps and environment fixture |
| C-03 | Khronos abalone map vs procedural nacre from screenshots | Khronos supplies documented packed maps; screenshots do not expose thickness or lighting conditions | Abalone asset is the first comparison fixture, not a copied final material | Establishes map semantics and attribution before aesthetic invention | Asset has partial-metalness artistic shortcut; it is not measured shell truth | Map study cannot reproduce expected documented channel response in pinned Three/glTF environment |
| C-04 | Spectral Bubble port vs existing RGB iridescence proxy | Oviedo source declares Fresnel + phase + wavelength integration + XYZ-to-sRGB; existing Optical Studies explicitly label authored RGB proxies | Maintain both as named control and treatment | Makes any gain from spectral mathematics observable | Increased fragment cost and color-management sensitivity | Treatment produces no distinguishable, stable angular response or fails target budget |
| C-05 | OpenPBR Viewer as library base vs reference renderer | Viewer is a WebGL path tracer/rasterizer; gallery needs many interactive materials | Reference-only comparison lane | High-fidelity plausibility checks without forcing path tracing onto the gallery | Separate parameter translation must be maintained | A measured interactive requirement selects path tracing and a device budget makes it viable |
| C-06 | Raw GLSL Next/Webpack source map vs current repository conventions | Library proposal assumes `next.config.js`; repo uses Node scripts, manifest JSON and static generated output | Reject as implementation dependency; retain only explicit resolver principle | Avoids an invented framework migration | No import-loader shortcut | Project deliberately adopts a pinned bundler and compiles a migration spike |

## Architecture stress simulation

**Scenario:** all three pilots share a preview shell, a source is updated upstream, WebGL2 is unavailable, and a reviewer asks whether a color event is physical or authored.

- Source changes are contained by a `revision`/`assetHash` gate. A record becomes `blocked`, not silently fresh.
- WebGL2 failure shows the recorded static capture plus mechanism/non-claim text; the task remains legible.
- The record distinguishes `physics` from `art` controls, and `modelBoundary` blocks unsupported words.
- The gold pilot has no external shader dependency, so it checks whether this governance is useful even when the source library is irrelevant.

**Known non-resolution:** no named-device FPS target is selected. The Lab records a measurement protocol first; choosing a threshold before the scene and device list exist would be performance theatre wearing a lab coat.
