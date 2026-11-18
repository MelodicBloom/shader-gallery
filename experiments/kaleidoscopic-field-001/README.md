# Kaleidoscopic Field / 001

An independent, reproducible WebGL2 field-versus-geometry laboratory for [MelodicBloom/shader-gallery](https://github.com/MelodicBloom/shader-gallery).

[Mini UV's TouchDesigner Tutorial 09](https://www.youtube.com/watch?v=-mYNZbLxKS8) motivated the investigation. Original WebGL2 shaders interpret one feedback field in two ways: a flat mirrored color surface and an actual Z-displaced point cloud. Independent implementation; **not** a port of third-party GPL GLSL code.

## Run (Windows PowerShell or WSL Ubuntu)

Prerequisites: Node.js 20 or newer, modern browser with WebGL2. No npm dependencies and no online service needed.

```sh
cd experiments/kaleidoscopic-field-001
npm run fixture            # required after cloning (creates the local WAV)
npm test                   # expect 8 passing tests
npm run dev                # local-only server on 127.0.0.1:4177
```

Open [http://127.0.0.1:4177](http://127.0.0.1:4177). Downloading a source ZIP without the repository prefix? Change directory into `kaleidoscopic-field-001` and run the same commands. Browser `file://` opening is unsupported because ES modules and `fetch` require HTTP origins.

## Do the experiment

1. Choose **PROOF** → **USE REFERENCE AUDIO** → **RESET**. Allow animation or press PLAY. Audio must start after a user click due to browser autoplay policies.
2. Left is **flat field**, right is **geometry displaced in Z**. Both sample the same 256×256 feedback texture and identical audio envelope on each simulated frame.
3. Pause and scrub frame `120`, `240`, `360`, `480`, and `600`; for each save **CAPTURE PNG** and **EXPORT RECEIPT**. Backward seeks reconstruct feedback from frame 0.
4. Test controls `SYMMETRY SECTORS`, `DEPTH AMPLITUDE`, `FEEDBACK MEMORY`, `FIELD EVOLUTION`, `AUDIO INFLUENCE`, `CAMERA TILT`, `POINT SIZE`, and `GRID WIDTH`. Switching a preset invalidates the prior field state and deterministically replays to the selected frame.
5. Try **RESTRAINED** and **ENERGETIC**, then select **LOAD OWN AUDIO** to compare an external track locally. User audio stays in the browser and is omitted from receipts.
6. Carry results through `docs/EXPERIMENT-PROTOCOL.md`, then construct the TouchDesigner parallel with `docs/TOUCHDESIGNER.md`. Do not label a result “cross-engine parity” before both are actually run and logged.

## What is implemented

- 60 Hz fixed-step 12-second trace, 720 envelope samples, authored WAV with RMS/beat ground-truth events.
- RGBA8 ping-pong framebuffer with analytic fBm and warped persistence feedback.
- sector reflection and identical field sampling for 2D and 3D interpretations.
- true `gl.POINTS` geometry, grid width 72–280, adjustable depth/camera/point size.
- audio file decoder/heuristic beat proxy, user controls, interactive timeline, PNG capture and structured JSON receipt.
- eight Node test cases covering the deterministic control layer. A browser/GPU visual pass is separate and not asserted.

## Document map

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — mechanisms, equations, interfaces, trade-offs, provenance.
- [`docs/EXPERIMENT-PROTOCOL.md`](docs/EXPERIMENT-PROTOCOL.md) — reproducible G0–G4 gates and evidence taxonomy.
- [`docs/TOUCHDESIGNER.md`](docs/TOUCHDESIGNER.md) — exact construction sequence, expected approximations and legal boundary.
- [`docs/parameter-schedule.json`](docs/parameter-schedule.json) — exact time-window contract for an external implementation.
- [`.agents/skills/kaleidoscopic-field-lab/SKILL.md`](.agents/skills/kaleidoscopic-field-lab/SKILL.md) — reusable bounded agent workflow.

## State and exclusions

No current claims of calibrated physical rendering, shader portability across mobile GPUs, TouchDesigner `.toe` completion, user-audio detection accuracy, measured 60fps, or exact cross-implementation pixel parity. If G1 fails, stop and save the shader compiler error. The screenshot workflow uses `preserveDrawingBuffer`, a deliberately conservative capture choice that may affect frame performance.
