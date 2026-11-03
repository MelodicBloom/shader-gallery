# Experiment contract / agent reference

## Definitions

- `field`: scalar `H_t ∈ [0,1]` stored in RGBA8 framebuffer, R channel authoritative.
- `frame`: integer simulation step at 60 Hz, 0-based, [0,719].
- `audio`: tuple `{rms,kick,snare,rhythm}` in [0,1], from authored JSON or local decode heuristic.
- `geometry`: NxN point coordinates `[0,1]²`; `z = scaled(H_t - 0.42) * radialMask`.
- `symmetry`: reflection operator parameterized by N; mathematical output repeats over `2N` half-wedges.
- `persistence`: mix weight of previous displaced field, not physical fluid viscosity.
- `observedFPS`: optional display loop callback estimate; never use as a standalone 60fps guarantee.

## Frozen baseline

- `FPS=60`, `DURATION=12`, `NGRID=216`, `fieldTexture=256x256`, `format=RGBA8`, `presets.proof` from `src/control.js`.
- Source fixture: `tools/build-fixture.mjs` → `fixtures/benchmark-12s.wav` and `fixtures/envelope-60fps.json`.
- Event source: authored onset frames, not microphone beat extraction.
- Shared phase schedule: 0–239 N9 multiplier1; 240–479 N12 multiplier1.2; 480–719 N7 multiplier0.8.
- Variables may be explored one at a time; each new change requires a receipt plus explicit changed setting.

## Core invariants

1. Sanitized ranges prevent NaN/unbounded numeric values.
2. Folding has angular symmetry and period 2π/N.
3. Fresh `reset` + same audio + params + same frame reproduces the feedback trajectory on the same runtime, subject to GPU precision variation.
4. Flat and 3D view read the same field texture at the same frame.
5. Audio upload never goes to a server (local static app, decoded in browser).
6. SHA, fixture source and version are present in a trial receipt before cross-engine conclusions.

## Reference commands

```sh
npm run fixture
npm test
npm run dev
```

Expected initial unit test result: 8 passes. Actual browser and mobile tests must be run and separately reported.

## Decision boundaries

Keep first phase portable (WebGL2, no libraries, no glTF dependency). If feedback precision visibly fails, create a separate RGBA16F gated trial and compare evidence. If geometry loses coherence, reduce point count or adjust projection **without** changing the control field simultaneously. Before merging to gallery or shader-grammar, ask whether observed behavior is general enough to warrant a reusable grammar operator.
