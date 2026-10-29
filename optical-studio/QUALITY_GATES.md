# Verification record and governed follow-up

Date: 2026-10-11 (Eastern Time) — Optical Studio 1.2.0

## Invariants

1. The original 3 shader source strings are preserved byte-for-byte; compare SHA-256 digests to baseline viewer.
2. Each contract slider must have an active GL uniform. No inert controls are accepted as functional.
3. Each material may compile independently. One failed specimen must not prevent all healthy specimens from being selected.
4. All procedural material features are anchored to object/surface coordinates unless motion is intentionally part of the material.
5. Optical approximations, source evidence, renderer capability and calibration status stay distinguishable.
6. A preset is accepted only if its schema, numerical bounds and shader hash match a current specimen. Unchanged old specimens may accept legacy revision numbers.
7. A preview is marked GPU-verified only when its associated source digest matches the compiled source digest.

## Completed verification

| Gate | Result | Evidence |
|---|---|---|
| Original 3 source SHA-256 preserved | PASS | `shader-manifest.json`, comparison in `tools/build_viewer.py` |
| 7 GLSL ES 3.00 shader compilations | PASS | `egl-render-report.json` |
| 7 program links | PASS | `egl-render-report.json` |
| All required GL uniforms active | PASS | `egl-render-report.json` |
| 7 real OpenGL draw/readback operations | PASS | `gpu-preview.png` under each shader |
| View-only versus fixed-light variation | PASS | `meanViewOnlyDifference` per material |
| Light-only versus fixed-camera variation | PASS | `meanLightOnlyDifference` per material |
| Abalone isolated passes 1, 2, 3, 4 nonempty | PASS | `isolatedPasses` in GPU report |
| Desktop/mobile material selection and accessible sliders | PASS | `tools/verify_interface.py` |
| Valid legacy preset restore and forged digest rejection | PASS | `tools/verify_interface.py` |
| Full live browser WebGL2 output | NOT TESTED | Controlled Chromium had WebGL2 disabled; EGL GPU compilation/draw checked separately |
| Mobile 30/60 FPS and thermal budget | NOT TESTED | Requires target device measurements |
| Quantitative material optical calibration | NOT CLAIMED | Spectral RGB projections and parameters are authored approximations |

## Proven technical failures in submitted build

**Crystal:** `sample` was used as a GLSL function name and was rejected as a reserved word by Mesa's GLSL compiler. Independently, ellipsoid intersection selected a negative near root when launched from inside, preventing ordinary exit transport. Both are repaired.

**Moissanite:** the halfspaces `y <= +0.22` and `-y <= -0.30` were mutually exclusive; the second is now `-y <= +0.30`. Inconsistent time-based facet rotation and Fresnel double blending were also removed.

**Ripple:** the wave normal used `height(p.xy)` even though the water plane sets `p.y=0`, flattening the second wave direction. The floor was treated as the same plane as the water and absorption depended on eye-ray distance rather than transmitted water path length. A ray-heightfield and below-surface floor replace this.

**Viewer:** a source compile failure previously broke all studies. It now compiles per specimen, caches errors and continues to show independently healthy specimens. Embedded real GPU captures replace misleading blank/illustrative placeholders. Hash-compatible presets from revisions 1.0.0 and 1.1.0 can be read; changed shader hashes cannot be silently reinterpreted.

## Open engineering gates

1. **Live browser QA:** open `optical-studio.html` in Chrome/Edge/Firefox with WebGL2, confirm mouse/touch orbit, light adjustment, frozen motion and screenshot download. Verify compilation errors are shown only for the failing study.
2. **Performance:** measure GPU frame time, thermals and memory on representative Android mid-tier and high-end devices; choose resolution scaling against observed data rather than assumed target FPS.
3. **Metrology:** replace thin-layer single cosine in abalone with transfer-matrix or sampled multilayer reflectance and cite optical constants and morphology datasets. Introduce measured, provenance-bearing calibration conditions.
4. **Color and bloom:** route physically intended light into an HDR linear framebuffer, spatial bloom pass and explicit output transfer function. Current RGB bump-color proxy and single-pass halo are appearance-only.
5. **Validation of caustics:** compare lens Gaussian and pool Jacobian footprint with a limited reference path tracer before using quantitative transport language.
6. **Moissanite cut:** substitute a traceable facet/pavilion geometry model with actual faceting orientation and calibrated refractive-index dispersion. Run grazing and total-internal-reflection reference images.
7. **A/B camera-light semantics:** expand hardware tests across fixed light / moving view, fixed view / moving light, and grazing-angle sweeps; save baselines per study and uniform set.

## Stop conditions

- **Reject physical accuracy claims** until source optical constants, measurement geometry and pass/fail comparisons exist.
- **Reject a material slider** if its GL uniform is absent, inactive or its influence is unmeasurable across a meaningful test sweep.
- **Do not promote** a shader into the production abalone gallery until mobile performance and independent light/view controls pass on real hardware.
- **Do not call a preview verified** after a source change until it is redrawn and its SHA-256 digest matches the report.

## 2026-10-29 — dispersion remix and historical video QA supplement

This is an additive QA contract, **not a new pass status**. See [PROVENANCE_AND_REMIX_2026-10-29.md](PROVENANCE_AND_REMIX_2026-10-29.md) for source references, source/license boundary, and the original wording of the attribution.

- Keep the original 7 shader source hashes fixed while inspecting the remix. Three-channel Crystal Lens paths are not seven-wavelength spectral rendering; its base IOR and artistic spread sliders are not yet Cauchy/Abbe controls.
- Analytical benchmark: given `n_d`, `V_d`, and F/d/C wavelengths 486.13/587.56/656.27 nm, recompute `n_F-n_C=(n_d-1)/V_d` and check normalization at the d line. Confirm decreasing spread with rising Abbe at fixed `n_d`, invalid-input rejection, and unchanged reference readouts when visual spread is exaggerated 3×.
- The Oct 8 video provenance is historical, not replayed in this update: a prior report recorded 41 timestamped frames across 4:16.872 of `Dispersion.mp4`. Reacquire the source and hash it before saying the video QA was rerun. Earlier black frame extraction was reported as extraction failure, not an observation of a blank source.
- Video mechanism checklist: silhouette and shape transition, second-object interaction, view/motion parallax, stripe/background warping, rim spectral spread, dark TIR facets, highlights, shadow/bright-core/caustic, floor/reflection and underglow. Record two competing causes and a falsifier for every major apparent mechanism.
- Use a fixed camera / swept light and fixed light / swept camera, neutral and no-dispersion controls, paused time, known geometry, static stripe chart, and separate artistic-composite versus physical-reference output.
- Every comparison receipt records reference source/hash, original frame timestamp, target fixture, material parameters/units, GLSL/hash, renderer/browser/GPU identity, viewport/DPR, light, camera, time, exposure, tone map, color space, actual image hash, target-vs-rendered comparison and human verdict.
- Accessible UI, real browser WebGL2, three-dimensionality, scene-linear HDR bloom, calibrated sample Abbe, target-device frame time and Gallery/Pages deployment remain **NOT TESTED / NOT CLAIMED** until evidence exists. A local analytical instrument or static chart is not GPU runtime evidence.
- The independent candidate-only analytical Cauchy tool and its six passing local Node tests exist in the 2026-10-29 downloadable handoff package; those source files are **not** part of this documentation-only PR. Do not imply their CI or publication from this commit.
