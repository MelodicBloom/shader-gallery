# KF-001 / Mechanism Architecture and Provenance

**Date:** 2026-10-18 · **Status:** independent browser experiment; TouchDesigner parity NOT verified.

## Investigative question

Given the same evolving scalar field `H_t(u,v)` and the same authored audio events, what additional spatial character does a true point-coordinate Z displacement provide beyond applying kaleidoscopic symmetry to a flat color field?

## Source boundary

Primary instructional reference: Mini UV, [Kaleidoscope — TouchDesigner Tutorial 09](https://www.youtube.com/watch?v=-mYNZbLxKS8). The transcript describes UV point positions, Noise TOP, Level/Feedback, Displace, Edge, Slope, Blur, the GLSl kaleidoscope shared component, and CHOP RMS + detected event modulation. Operator names/numeric values transcribed by speech recognition are tentative, not authoritative measurements.

Referenced third-party TouchDesigner GLSL Kaleidoscope from David Braun's [TouchDesigner_Shared](https://github.com/DBraun/TouchDesigner_Shared). Do **not** vendor it into this MIT experiment without explicit attribution and a compatible licensing decision. This WebGL2 implementation is original and does not copy the TouchDesigner shader source. When using the shared tool separately, obey its upstream license and maintain repository provenance.

## Causal graph

```
Authored 12-second WAV ──> 720-frame RMS, kick, snare event trace
                                     │
                                     ▼
                 derivedAudio(hit, rms, gain)
                                     │
Noise/turbulence ──> RGBA8 field ────┤    fixed-step simulation at 60 Hz
                     ▲               │
                     └─ warp/read feedback ── memory / persistence
                                     │
                         same current H_t
                          /            \
                         ▼              ▼
                  [sector folding]  [sector folding]
                         │              │
                  color + edges      grid XY + H→Z
                         │              │
                    FLAT view        POINT view
```

## Parameterized mechanisms

### 1. Scalar field + feedback

For centered coordinates `p = 4.5*(uv - 0.5)`:

- `N(p,t) = Σ_(i=0..4) a_i noise(M_i p + t v)`; `a_(i+1) = 0.53 a_i`, seeded by the fixed analytic hash in `src/shaders.js`.
- `T(p,t) = clamp(0.08 + 1.17 N + 0.09 sin(8.1|p| - 6 atan(p_y,p_x) - 1.2 t), 0, 1)`.
- `P_t(uv) = H_(t-1)(clamp(uv + drift(N,t,hit)))` sampled with bilinear texture filtering.
- `H_t(uv) = clamp(mix(T,P_t,persistence) + beat_excitation,0,1)`.
- `H_0` uses `T` directly. Both ping-pong framebuffers start cleared to midgray `0.5`. `RGBA8` is an intentional portable baseline, so quantization is expected; this is NOT floating-point fluid simulation.

`speed` changes animation time, `persistence` changes temporal memory, and `hit` alters advection and burst excitation. A true two-component vector displacement field is a future comparison, not represented as the current implementation.

### 2. Kaleidoscopic reflection

For angle `θ = atan(y,x)`, sectors `N`, wedge `ω = π/N`:

```
θ' = mod(θ + 2π, 2ω)
if θ' > ω: θ' = 2ω - θ'
fold(p) = |p| (cos θ', sin θ')
```

`H_t` is sampled at `fold(p)*0.47 + 0.5`. This reflection produces N angular wedges of width `π/N` over a full 2π turn: **2N mirrored half-sectors**. The control is labeled `symmetry sectors` as an artistic parameter, not a mathematical count of repeated tiles. The flat and 3D views apply the same fold but may differ in apparent crop/aspect due to their projections.

### 3. Image interpretation vs geometry

- **Flat:** sample `H`, use finite-difference gradients to modulate cyan edges, violet body, and sparse coral accents; vignette for framing. All depth is perceptual shading.
- **3D:** sample `H` at each UV-grid point, compute `z = (H-0.42) * displacement * scheduleMultiplier * (1 + 0.35 audio.motion) * radialMask`; rotate around the X plane and in XY; render real `gl.POINTS` with round point sprites, additive glow, and depth-responsive sizing.
- `grid` is the number of points **per axis**, so the draw count equals `grid²`: default 216→46,656 points; maximum 280→78,400 points. Geometry is GPU-mapped from deterministic UV buffer.
- The implementation does not currently solve light transport, real lens refraction, cast shadows, physically accurate normals, or a registered TouchDesigner color-space match.

### 4. Audio control and clocks

The supplied 12-second WAV is synthesized by `tools/build-fixture.mjs`. Its kick/snare onsets are exact scripted annotations, while RMS is computed from the actual generated PCM. The playback envelope is sampled at `frame/60`, not built from live microphone features. An imported user audio file is locally decoded and heuristically analyzed via `src/audio.js`; those detected events are **not** reference ground truth.

The **simulation clock** advances in 1/60 s increments, even if the display misses frames; audio-element playback can require catch-up simulation. **UI FPS** describes requestAnimationFrame cadence, not measured GPU rendering time. There is no 60-FPS performance certification from this experiment alone.

### 5. Schedule and reset semantics

`0≤t<4`: N=9, amplitude multiplier 1.0. `4≤t<8`: N=12, 1.2. `8≤t≤12`: N=7, 0.8. The exact source of this schedule is `src/control.js:scheduleAt()`; `docs/parameter-schedule.json` is a declarative mirror for external implementations.

Every seek backward reconstructs all intervening feedback steps from zero. Preset/parameter changes reset and replay to the selected frame, eliminating stale accumulated state. This costs O(frameIndex * fieldPixels) and is deliberate for traceability, not optimal for very long clips. For future long-running use, snapshot state periodically with receipt checksums.

## Contracts

`src/control.js` exports `sanitizeParams`, `audioAt`, `derivedAudio`, `scheduleAt`, `buildProvenance`, `foldAngle`, `FPS`, `DURATION`, `PRESETS`.

`src/gl.js` exports `KaleidoscopicRenderer(canvas)` with `setGrid(n)`, `reset()`, `step(time,params,audio)` and `render(params,audio,time,schedule)`.

`src/audio.js` exports `analyzeBuffer(decodedAudioBuffer)`, `isEnvelopeValid(envelope)`, and `audioEnvelopeFromFile(File)`.

`fixtures/envelope-60fps.json` has `{schema, sampleRate, fps, durationSeconds, annotationMethod, kickFrames, snareFrames, samples:[{rms,kick,snare,rhythm}]}`.

The user-exported receipt has schema `kaleidoscopic-field-trace/v1`; it includes control params, audio provenance and performance caveats but does not contain the uploaded source audio (which remains local to the browser).

## Decision ledger

| Decision | Reason | Disconfirmation / next test |
|---|---|---|
| RGBA8 ping-pong instead of float FBO | WebGL2 portable baseline without float render extension | Visible 8-bit banding in a gradient trial ⇒ enable separately gated RGBA16F |
| Fixed 60 Hz step trace | Reproducible time-aligned comparisons | Long seek is too slow ⇒ add checkpoint FBO snapshots |
| Authored audio events | Ground truth for synchronization and deterministic replay | Real microphone/DJ use ⇒ introduce separately validated onset extractor |
| Same field drives both views | Isolates geometry as independent variable | Surface field ambiguity ⇒ export exact texture checkpoints |
| Independent shaders / no third-party code | Small licensing and reproducibility surface | Measured need for source parity ⇒ explicit upstream license review |
| Side-by-side viewport in one WebGL2 context | Minimizes divergent frame clocks | Confounding crop/aspect ⇒ match camera framing through calibrated transforms |

## Nonclaims

A shared mathematical mechanism is not proof of pixel-level parity. Browser tests on one GPU are not cross-device performance validation. Synthetic beat annotations are not measured live beat detection. This does not represent a complete TouchDesigner `.toe` file.
