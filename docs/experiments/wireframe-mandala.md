# Experiment 001 — wireframe-mandala generative network

Status: **code/test prototype, not promoted**. Date: 2026-10-18. Repository owner: `MelodicBloom/shader-gallery`. Experiment files: [`experiments/wireframe-mandala/`](../../experiments/wireframe-mandala/). Separate from the pending Optical Studies / Material Validation Lab branches.

## Provenance and claim ledger

- **Observed in recovered video narration:** MechBullRodeo, [Wireframe Mandala | Generative SOP | TouchDesigner Beginner Tutorial – Extra Fast](https://www.youtube.com/watch?v=sFY78EmBZvY) (`sFY78EmBZvY`). A line with ~100 points -> SOP to CHOP -> Noise CHOP with end index tied to point count - 1 -> Replace CHOP modifies `ty` -> CHOP to SOP -> 12 rotational copies at 30° -> second Copy SOP using a curve as source and template -> geometry/camera/Constant MAT/Render TOP -> RGB key, RGB delay, bloom and circular-ramp soft-light composite. Artist notes audio reactivity as a possible extension.
- **Cross-checked with Derivative manuals:** [SOP to CHOP](https://docs.derivative.ca/SOP_to_CHOP), [Noise CHOP](https://docs.derivative.ca/Noise_CHOP), [Replace CHOP](https://docs.derivative.ca/Replace_CHOP), [CHOP to SOP](https://docs.derivative.ca/CHOP_to_SOP), [Copy SOP](https://docs.derivative.ca/Copy_SOP).
- **Our independent design choices (not claimed by tutorial):** seeded three-octave scalar noise; 2D Canvas reference; explicit radial arm and tangent-oriented template copies; capped geometry budget; normalized parameter contract; per-frame geometry fingerprint; pause/export controls; neon additive stroke approximation. **Not exact TouchDesigner noise mathematics or true RGB delay/bloom**. Template placement is a bounded approximation, not claimed operator parity.
- **Locally tested:** five Node geometry tests and a headless Chromium in-memory UI smoke (pause, two modes, over-budget rejection, reset, PNG/JSON downloads, no JS exceptions). **Untested:** hosted-origin behavior, full TouchDesigner .toe reconstruction, correspondence to artist frames, hardware FPS, audio latency, browser/mobile portability across devices. A recovered spoken transcript contains possible ASR mistakes for operator names and placement; confirm visual graph against actual video before asserting exact topology.

## Build the TouchDesigner graph (human-executable recipe)

> These are manual operator steps; parameter names have been cross-referenced, but the graph has not been executed in TouchDesigner in this environment. Save work as `wireframe-mandala-exp001.toe` only after local verification.

1. In a new Base COMP, make `line1` (**Line SOP**), set **Number of Points = 100**, and add `null_line` (**Null SOP**). Keep points in a planar orientation. Inspect point positions.
2. Make `sopto1` (**SOP to CHOP**) targeting `null_line`. Verify that position channels are named `tx`, `ty`, `tz` and the CHOP contains **100 samples**.
3. Make `noise1` (**Noise CHOP**). On Channel page, set both Start Unit and End Unit to **Samples**, Start = `0`, End = `op('sopto1').numSamples - 1` (Python expression) or explicitly `99` for the first trial. Disable Time Slice if it prevents a 100-sample span. Set its Channel Name to `ty` (or rename the generated output channel to `ty` with a Rename CHOP). Check its sample count and name before proceeding.
4. Make `replace1` (**Replace CHOP**). First input: `sopto1`; second input: `noise1`'s `ty` channel. The output should retain `tx`/`tz` and replace only `ty`. If names differ, replace will appear to have no effect; inspect both CHOP viewers.
5. Make `chopto1` (**CHOP to SOP**) and point its CHOP parameter at `replace1`. Verify its curve has 100 points, with constant X/Z channels and noise-displaced Y positions. Confirm source-line geometry if necessary: some CHOP to SOP configurations use a default line.
6. Make `copy_radial` (**Copy SOP**), first input `chopto1`, Number of Copies = `12`, and set the appropriate Rotate-axis incremental value to `360 / 12` (30 degrees). **Select the axis perpendicular to the curve plane** (for a default XY curve, rotate Z). To avoid axis mismatch, inspect orthographic camera orientation. Derivative confirms `360/me.copyTotal` as a parametric variant, but the explicit 30-degree value is easier to validate initially.
7. Make `copy_template` (**Copy SOP**). Feed `chopto1` into **both** source and template inputs, with Number of Copies `1` per template point. Compare a `copy_template -> copy_radial` arrangement and a separate `copy_radial` render branch against the actual tutorial footage; **do not assert the branch ordering until observed visually**. Save screenshots of both networks. If normals rotate objects unexpectedly, test the Rotate to Normal setting explicitly.
8. Put the chosen SOP output in `geo1` (**Geometry COMP**), attach a **Constant MAT**, position a Camera COMP to frame the result, and render through **Render TOP**. A Constant MAT does not require a light. Confirm non-black pixels before adding effects.
9. Post effects: render -> optional **RGB Key TOP** to remove black -> artist's **RGB delay** palette effect -> restrained **Bloom TOP** -> optional circular **Ramp TOP** as a soft-light layer via **Composite TOP**, with output resolution driven by the primary render. Versions/palette components vary: record actual operator names, parameters, colors and resolution in a screenshot before claiming equivalence.
10. In Noise CHOP, animate Translate Z slowly. Record variants of Period, Amplitude, points and rotation independently. For an optional *later* audio pass, route a normalized, smoothed audio envelope to only one bounded parameter (amplitude or copy angle); add clipping, silence behavior, and a privacy/accessibility check before enabling mic input.

A helpful initial network audit is `line1 -> null_line -> sopto1`, `noise1 -> replace1 (second input)` with `sopto1 -> replace1 (first input) -> chopto1`, then both copy branches. Photograph node names/ports and write down exact touched values.

## Parameter and mechanism translation

| TouchDesigner mechanism | Browser approximation | Critical parity gap |
|---|---|---|
| Line SOP point count | `points` 12–128 | Line orientation/extent may differ |
| Noise CHOP period / amplitude / translation | `frequency`, `amplitude`, `speed`, `phase` | Different noise algorithm and coordinate space |
| Replace CHOP `ty` | CPU-defined Y samples | No live SOP/CHOP channel or GPU buffers |
| Copy SOP repetition | `copies`, angle `2π/copies` | Transform accumulation and template normals differ |
| Copy SOP curve-as-template | `templates` tangent-oriented copies | Subsampled template, reduced scale, different order |
| RGB delay, bloom, ramp | 2D strokes, shadow/glow, color bands | No delayed channel buffers / true spatial HDR bloom |
| Audio-reactive mapping | *Not implemented* | Requires input source, envelope/latency gate and permission |

## Three bounded trials

**A / mechanism isolation:** Disable glow; `radial`, 96 points, 12 copies, amplitude 0.3; compare seed 31415 at t=0 and t=5. Requirement: identical geometry fingerprint for identical inputs; no NaNs; count = `(points−1) × copies`.

**B / template complexity:** Fix 96 points, 12 copies, 8 templates, seed 31415, t=0; switch `nested`. Requirement: count = `(points−1) × copies × (1 + templates)`; reject changes over 30,000; visual result reflects interior structures, not simply a palette swap.

**C / control contracts:** Attempt max controls causing overflow; verify rejection with no accepted state change. Test reduced-motion start/pause, resizing, PNG, receipt. Requirement: JSON captures exact normalized input/time/fingerprint; browser exceptions zero; no performance claim absent measured frame-time distributions.

## Promotion gates, stop conditions, and handoff

- Tests must pass with Node's native runner and produce stable geometric receipt under identical inputs; this does **not** validate fidelity to TouchDesigner.
- Browser controls, downloads, reduced-motion, screenshot and resized view must be manually or independently browser-validated. Log browser/OS/device and image evidence.
- An agent must not merge into `main`, add a shader manifest entry, or update optical material claims without explicit review and both source/visual validation. Stop on uncertain source license, missing .toe proof, inconsistent channel count, nonfinite coordinates, unchecked latency, or rendering glitches.
- Recommended next step: capture the **TouchDesigner first-copy vs second-copy network topology** and compare with browser frames at three fixed states. Only then plan a WebGL2 instanced-lines adapter or Hydra/Resolume live-output integration.
