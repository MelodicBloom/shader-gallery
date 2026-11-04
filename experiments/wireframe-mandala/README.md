# Living Wireframe Mandala — experimental procedural reference

This is an **original, independently implemented interpretation**, inspired by MechBullRodeo's [Wireframe Mandala / TouchDesigner tutorial](https://www.youtube.com/watch?v=sFY78EmBZvY). No third-party project, code, video, assets or .toe files are copied. It is a Canvas2D reference study, **not** a TouchDesigner network, GLSL shader, validated 60 fps renderer, or photographic recreation.

## Quick start

From the root of `shader-gallery`:

```bash
node --test experiments/wireframe-mandala/tests/*.test.mjs
node experiments/wireframe-mandala/tools/run-evidence.mjs --time 0 --out experiments/wireframe-mandala/artifacts/baseline.json
python -m http.server 8000
```

Open <http://localhost:8000/experiments/wireframe-mandala/> in a modern browser. On Windows/WSL, launch the server from WSL then open the URL in Windows Chrome/Edge. `node` version 20+ recommended; test command uses built-in Node test runner. No npm install needed.

Interact with radial/nested modes, point count, radial copies, template count, amplitude, frequency, speed, seed, and glow. The controls reject combinations exceeding 30,000 segments. The current viewport deliberately caps redraws near 30 Hz and makes **no** 60 fps claim; 60 fps is a later measured optimization gate. Pause, export JSON receipt, and capture PNG. For repeated geometry comparisons, use the *same* normalized controls and exact time. The JSON receipt's `geometryFingerprint` is an FNV-style diagnostic, **not a cryptographic integrity hash**. Rendered pixels may differ by browser, font/OS, canvas scaling, and hardware.

A local static server is required because browsers restrict relative ES module imports under `file://`. The viewer doesn't make network calls or request microphone access.

## Evaluation recipe

1. Run the five core tests and save their output. Optionally run `CHROMIUM_PATH=/usr/bin/chromium python experiments/wireframe-mandala/tests/browser-smoke.py` after installing Python Playwright. This in-memory smoke tests controls/downloads but not deployed-origin behavior.
2. Generate a deterministic geometry receipt at time zero; save its JSON alongside the source revision SHA (`git rev-parse HEAD`).
3. Open browser, pause, switch between `radial` and `nested`, and ensure the segment count/fingerprint updates. Test reset, PNG download, JSON receipt, and viewport resize. Capture a screenshot and note browser/OS.
4. Run 30 s under normal animation, inspect DevTools for exceptions and dropped frames, and **measure** FPS/frame-time before claiming 60 fps. Check mobile and reduced-motion separately.
5. Rebuild the TouchDesigner operator graph following [the experiment protocol](../../docs/experiments/wireframe-mandala.md), and record which geometry attributes/normal transforms do not match the browser interpretation.
6. For any material/shader port, preserve this CPU reference; do not modify the established Shader Library manifest or optical materials until parity/CI review.

Do not commit `artifacts/` receipts unless they are part of a reviewed evidence submission; never paste personal microphone recordings into the repo. The skill at `.agents/skills/procedural-mandala-lab/SKILL.md` defines the agent handoff.
