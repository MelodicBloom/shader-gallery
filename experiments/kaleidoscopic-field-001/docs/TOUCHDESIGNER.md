# TouchDesigner reconstruction / KF-001

## Source, scope, and license

Refer to [Mini UV's tutorial](https://www.youtube.com/watch?v=-mYNZbLxKS8). The presenter refers to a GLSL Kaleidoscope component from [David Braun / TouchDesigner_Shared](https://github.com/DBraun/TouchDesigner_Shared). Verify that repository's current license before reuse. Do not copy its shader into the MIT browser specimen; a local use of an independently installed TouchDesigner component is a separate licensing decision. Numeric values below distinguish **transcribed** settings from new KF-001 controls.

## Operator network to construct

1. Create a project set to **60 FPS**. Set project playback to **12 seconds**, looping disabled for capture. Use `Audio File In CHOP` and load `fixtures/benchmark-12s.wav`, with playback index driven by the same fixed frame counter. Keep it stopped while taking repeatable stills.
2. UV points: create a regularly sampled UV grid, preferably through a native point/POP operator or a small custom generator if available in your TouchDesigner build. Target `216 × 216` points for direct comparison; the presenter uses a Palette UV component, not a standard guaranteed operator. Record the actual geometry count.
3. `Noise TOP`: use coherent animated noise as a scalar source. Tutorial transcript indicates harmonics 0, exponent 0, amplitude 2, and animation along Z; exact UI property names vary with TouchDesigner version. Start at 256², then calibrate to the WebGL2 field range `[0,1]` before claiming numerical similarity.
4. `Level TOP` → `Feedback TOP` → `Displace TOP` temporal chain. Transcript suggests feedback opacity `0.03` and displacement around `0.1`, mirror extension, nearest filtering, 32-bit float where available. Those values are **pedagogical starting points**, not WebGL2-equivalent persistence. Explicitly wire a reset button to clear history.
5. Process another branch using `Edge TOP` → `Slope TOP` → `Blur TOP` and feed gradient detail back to Displace. Transcript suggests edge ring `10`, slope strength responding to sound, blur 32-ish pixels; the automated transcript may mishear parameter labels. Keep operator screenshots and exact settings in the trial evidence.
6. Introduce kaleidoscopic radial reflection **after** generating the field but **before** sampling the point displacement. Either use a vetted installed Kaleidoscope GLSL component in a local TD project, or implement the original mathematical fold shown in `docs/ARCHITECTURE.md` independently. Start with N=9, then N=12 at frame 240, N=7 at frame 480.
7. Map the resulting field height into point-grid **Z**, not into fragment color only. Point Render output should expose 3D relief on camera tilt; create a second flat textured comparison render with the same field. Capture the two pipelines at identical frames.
8. `Math CHOP`→`Analyze CHOP` (RMS) for signal intensity, and a beat/event branch. For **proof-parity**, do not rely on live auto-detection: import the authored 720-frame envelope from `fixtures/envelope-60fps.json` as sampled channels at 60Hz (e.g., through `Table DAT`/`CHOP Execute`/`Script CHOP`) and select `rms`, `kick`, `snare` exactly by indexed frame.
9. Gate kick/snare using `Logic CHOP` OR, combine with RMS using `Math CHOP`. The tutorial remaps audio to roughly `[0.5,100]` slope strength and applies smoothing. KF-001's browser uses a normalized derived control, NOT a matching operator-value scale. Calibrate slopes separately and record mappings.
10. Save local `.toe` and a read-only copy of the operator parameter table. Export PNG from frames 0, 120, 239, 240, 360, 479, 480, 600, 719. Log output color space, TOP pixel format, camera, point size, exposure and any nondeterministic caching.

## Schedule / exact comparability

| Frames | Time | Sector N | Browser displacement multiplier |
|---:|---:|---:|---:|
| 0–239 | 0–3.983s | 9 | 1.0 |
| 240–479 | 4–7.983s | 12 | 1.2 |
| 480–719 | 8–11.983s | 7 | 0.8 |

**Critical control:** every reset and frame seek should rebuild the feedback state deterministically from frame 0; merely dragging TouchDesigner timeline without clearing history makes invalid comparisons. Start with snapshots at 0 and 360 to test this.

## What can differ legitimately

TOP-based feedback displacement ≠ KF-001's animated noise/advection kernel. TouchDesigner POP grid ≠ WebGL2 vertex buffer sampling unless UV and transforms match. Live CHOP beat detection ≠ authored synthetic beat annotations. Color management, anti-aliasing, quantization and camera lens can all cause visual differences. Classify each as model difference, configuration difference, expected numerical variation, or defect; never paper over it.
