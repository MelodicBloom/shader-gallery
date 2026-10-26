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

## Added by MVT-ABALONE-001 (2026-10-26)

| ID | Showdown | Evidence | Decision | What it enables | Cost / retained risk | Reversal trigger |
|---|---|---|---|---|---|---|
| C-07 | Record default thickness `[100,400]` nm vs asset-authored `iridescenceThicknessMinimum/Maximum` `600/800` nm | Pinned GLB JSON at 4995a63 declares 600/800; record predates the pin | Trial runs the asset-authored 600–800 nm; record default left unchanged and unresolved | Tests the asset as documented rather than an unsourced default | Record default may be stale or meant for a different fixture; slider still exposes 0–2000 | Owner states the intended source of `[100,400]`, or a synthetic-map fixture needs it |
| C-08 | R-channel independence: whole-frame metric (run 1) vs shell-masked metric (run 2) | Run 1 failed R contribution at all fixtures (background dilution); run 2 still below the 1%-of-pixels criterion at neutral/grazing, passes at light-sweep | Keep both runs in the receipt; label `inconclusive`, not `pass` or `fail`; criterion revision is explicitly post-hoc | Prevents a metric tweak from being read as a success | The asset's R map may be near-saturated where iridescence is visible, so the asset alone may not isolate R | Synthetic isolated R/G test maps (contract independent variable) run with a pre-declared criterion |

## Added by MVT-ABALONE-001 synthetic slice, run 3 (2026-10-26)

C-08 reversal trigger fired: synthetic isolated R/G maps ran under a criterion pre-registered in `receipts/BUILD_HANDOFF-MVT-ABALONE-001-SYNTH.md`. Outcome (measured, SwiftShader): synthetic `rChannelContributes` fractionOver8 0.0055 / 0.0049 / 0.0073 (neutral / grazing / light-sweep); synthetic `gChannelContributes` 0.0047 / 0.0028 / 0.0044; `iridescenceVisibleVsNeutralControl` synth-r 0.0113 / 0.0147 / 0.0196 but synth-g 0.0049 / 0.0060 / 0.0048; `channelsDistinct` 0.0517–0.0799 (synth-r), 0.0155–0.0190 (synth-g). Label `fail`. C-08 is **not** closed by a pass; it is answered with a fail under the pre-registered rule and the tensions below remain.

| ID | Showdown | Evidence | Decision | What it enables | Cost / retained risk | Reversal trigger |
|---|---|---|---|---|---|---|
| C-08 (update) | Post-hoc asset metric vs pre-registered synthetic test | Run 3 synthetic checks fail the locked threshold (numbers above); asset map re-measured identically to run 2 (R 0.0075/0.0077/0.0103) | Label `fail` for the independence hypothesis; threshold not revised | Honest falsification instead of a tuned success | The failing quantity is a pixel-count fraction; mean diffs are non-zero (e.g. synth-r treatment vs G-only mean 0.94–1.10/255), so "no effect" is unverified — only "below locked criterion" is measured | A new, separately pre-registered run (new trial id or run number) — never a retroactive threshold change |
| C-09 | Does the fail reflect the material/renderer, or the fixture design? | (proposed, unverified) Abalone metalness 0.5 + roughness 1 under RoomEnvironment + ACES, and SwiftShader, may compress the iridescent term; synth-g holds R=0.5 which halves intensity; 8/255 cut-off may be insensitive to diffuse low-amplitude shifts | Kept open; no fixture or metric change in this slice | Separates "hypothesis fails" from "test cannot see it" for the next reviewer | Risk that a real effect is under-detected; also risk of motivated re-testing | Named human GPU review of the run-3 captures, and/or a newly pre-registered fixture (e.g. flat plane, roughness 0) declared before running |
| C-07 (unchanged) | Record default `[100,400]` nm vs asset 600/800 nm | Run 3 still uses asset-authored 600–800 nm | Unresolved; record default not overwritten | — | Synthetic G gradient maps across 600–800 nm only | Owner states source of `[100,400]` |
