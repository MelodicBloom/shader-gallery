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