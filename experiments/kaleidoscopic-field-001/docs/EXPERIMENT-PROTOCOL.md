# KF-001: reproducible experiment procedure

## Purpose

Compare two interpretations of the same scalar feedback field: flat symmetry/color treatment (left) versus 3D displaced point-grid geometry (right). Do not confuse aesthetic preference with demonstrated mechanism equivalence.

## Equipment and environment

Node.js >=20, Chromium/Firefox/Safari with WebGL2, hardware acceleration. For 60-FPS evaluation, record GPU/driver, browser version, OS, display resolution, browser zoom, devicePixelRatio, point grid and whether battery saver is active. Use the same machine and display setting throughout a trial.

## Trial A / deterministic browser comparator

1. From specimen root run `npm run fixture`, then `npm test` (expect **8 passing** test cases).
2. Run `npm run dev` and navigate to `http://127.0.0.1:4177/`.
3. Check top status `WEBGL2 / GPU FIELD ACTIVE`. If initialization fails, record error and stop rather than marking a visual pass.
4. Select **PROOF**, **USE REFERENCE AUDIO**, and **RESET**. Export receipt at frame 0 and PNG capture. Record image crop/point visibility.
5. Pause, seek to frames `120`, `239`, `240`, `360`, `479`, `480`, `600`, and `719`; capture both the PNG and receipt at each frame. **Preserve all screenshots.**
6. Reset and re-seek to `360`. Compare the same-pixel RGB values from two independently reconstructed captures **on the same browser/GPU**. Difference should be zero or explainable by nondeterministic GPU/driver behavior; note actual differences, do not assume zero.
7. Repeat with **RESTRAINED** and **ENERGETIC** presets. Ensure the field resets on each change and that no stale history remains.
8. Set `displacement = 0`; verify right side loses height relief but still renders points. Then set to `3`; verify increase in geometric relief (avoid inferring physical depth accuracy).
9. Change `segments` from 3→20; verify radial symmetry count and check the transition for abrupt sector changes. This change is **intentionally instantaneous**, not an interpolated morph.
10. Load a local audio file under 90MB (optional). Confirm on-device decode and event-proxy change; exported JSON must disclose `kind: upload` without including raw audio.

## Trial B / TouchDesigner reconstruction

Follow `docs/TOUCHDESIGNER.md`; use exactly the same authored audio fixture WAV and 60-FPS frame schedule. Record operator versions, sample format, feedback reset, mirrored wrap, data range, color-space, camera/point count and depth range. Where TouchDesigner does not expose an exact analytic function, mark the operator as an **approximation** instead of claiming numerical parity.

## Comparison matrix

| Observation | Flat baseline | 3D displacement | Evidence / confidence |
|---|---|---|---|
| Temporal smoothness | visual rating 1–5 | visual rating 1–5 | paired recording, observed |
| Symmetry adherence | repeated sector boundaries | geometry/height boundaries | saved frame and sector count |
| Audio alignment | flash/edge variation | height/motion variation | onset frame and ± frame offset |
| Structural coherence | lines/regions | identifiable displaced ribbons | two blind raters where possible |
| Frame cadence | UI FPS trace | same UI FPS trace | NOT GPU time; use independent profiling |
| Recoverability | frame 360 after seek | frame 360 after seek | PNG and receipt pair |

## Acceptance gates / stop conditions

- **G0 — structural:** 8 unit tests pass, JS parses, fixture remains 720 samples, schedule boundaries match 240/480.
- **G1 — browser visual:** WebGL2 shaders compile and link; both views are nonempty and differentiated; controls are responsive; screenshots and receipts download. Requires an actual browser render run.
- **G2 — deterministic:** same source audio, params, environment and frame reconstruct the expected field on repeated seeks. Compare artifacts; no unsupported pixel guarantee.
- **G3 — timing:** on a named target device, profile ≥1800 consecutive animation callbacks; calculate p50/p95 wall frame interval, dropped-frame fraction, render call duration and GPU timer queries when supported. Target ≥95% callbacks ≤16.7ms on 60Hz; mark target FAIL if not met. Do not infer this from one UI FPS reading.
- **G4 — TouchDesigner parity:** both pipelines export matching frame indices and audio alignments; human comparison documents known projection/feedback differences. Does not require byte identity.

Stop and record a failure receipt if shaders fail to compile/link, audio decode rejects, context is lost, non-finite field samples appear, or evidence/attribution is missing. Do not widen scope to physically accurate materials or a full VJ tool before G1/G2 are observed.

## Evidence registry (each trial)

`trial-id`, UTC timestamp, git SHA, variant/preset, browser/GPU/OS, frame number, original WAV sha256, JSON envelope sha256, parameter schedule JSON sha256, captured receipt, PNG, pass/fail per gate, observed deviations, next action. Store under `docs/evidence/KF-001/<trial-id>/` after a real run.

## Expected initial results and limitations

The reference source demonstrates a generative technique; the WebGL2 version tests shared principles, not copied implementation. Nominal 60Hz simulation is not proof of 60FPS. In this build environment Chromium could not initialize its headless GPU backend, so G1/G2/G3/G4 require a real hardware browser trial.
