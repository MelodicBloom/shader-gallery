# Mandala Glass

A deterministic, procedural 3D mandala in dispersive cut glass, polished gold filigree and enamel glass tiles, built with **three.js (WebGL2) + Vite**. Everything (geometry, backdrop and studio lighting) is generated in code. There are no external models, HDRs or textures, and no licensed assets.

It reinterprets the hero reference: blue petals, a cream lotus around a glowing cyan core, a gold octagonal filigree ring, pink and yellow outer tiles, and eight satellite brilliant-cut gems whose hue cycles pink → purple → blue.

## Run

```bash
cd mandala-glass
npm install
npm run dev        # http://localhost:5173
npm run build      # outputs dist/
npm run preview    # serves dist/ on :4173
```

## Controls
- **Drag** to orbit, **scroll or pinch** to zoom. The orbit range is clamped so the backdrop always fills the view.
- **Hue cycle**: speed of the satellite-gem hue cycle (0–3×).
- **Dispersion**: three.js `MeshPhysicalMaterial.dispersion`, applied to every glass part (doubled in Gem mode).
- **Petal bloom**: opens or cups the lotus and the blue petals.
- **Auto-rotate**: deterministic in-plane spin and tilt sway.
- **Glass / Gem**: Glass uses IOR 1.52. Gem uses IOR 2.05 with denser colour (shorter attenuation distance).

## URL parameters (QA and determinism)
| Param | Effect |
|---|---|
| `t=<sec>` | Freeze the clock at a time, for reproducible captures |
| `q=0..4` | Lock the quality level (0 = full, 4 = lite, no transmission) |
| `mat=gem`, `disp=`, `open=`, `hue=`, `rotate=0` | Initial control state |
| `panel=1/0` | Force the control panel open or collapsed |
| `nowebgl` | Force the no-WebGL fallback |
| `reduced` | Simulate prefers-reduced-motion |
| `seed=<int>` | PRNG seed for backdrop texture and gem tilt (default 1708) |

## Robustness
- DPR is capped at 2. Adaptive quality steps down (DPR, MSAA, transmission resolution, bloom, then lite glass) when the median frame interval stays above 40 ms over 90 frames.
- No-WebGL2 fallback card. `webglcontextlost`/`restored` handling rebuilds the PMREM environment, then resumes at one level lower quality.
- `prefers-reduced-motion`: auto-rotate off, breathing and orbit motion off, hue cycle slowed to 0.3×.

## QA
<!-- coderabbit-ai-generated:v1 -->

<!-- coderabbit-ai-generated-section:v1:7cd50bab83b975580bbc799acce60227ca7dc8093b75ccbcd308da908de34e40 -->

`scripts/qa.mjs` and `scripts/bench4.mjs` run in headless Chromium through Playwright. Install Playwright and Chromium from the `mandala-glass/` project directory so both scripts can resolve the package. See [`RECEIPTS.md`](./RECEIPTS.md#build-commands) for the setup and run commands, and `receipts/` for the results and screenshots.

<!-- /coderabbit-ai-generated:v1 -->
