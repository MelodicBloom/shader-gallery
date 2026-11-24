# KF-001 first validation receipt — 2026-10-18

- Target branch: `experiment/kaleidoscopic-field-001` under `MelodicBloom/shader-gallery`; initial commit `c2773ffeb1fa79a3cf608856c3b95418c14ff45d`; draft PR #24.
- Hypothesis: independently sampled, symmetrical field has distinct spatial legibility when mapped to GPU point-grid Z versus flat color.
- Fixtures: authored 12s synthetic WAV + derived RMS + authored kick/snare onset envelope at 60 Hz. `tools/build-fixture.mjs` is the generator of record.
- Environment: container Node.js v22.16.0; Chromium binary available but software GL backend fails initialization in headless Linux environment.
- Command `npm run fixture`: exit 0; 720 frames and 576044 byte WAV generated.
- Command `npm test`: exit 0; 8 tests passed / 0 failed (first execution).
- Command `chromium --headless --enable-unsafe-swiftshader ... --screenshot`: timed out; GPU process errors `eglInitialize: Not initialized` and `EGL_NOT_INITIALIZED`. No PNG was produced.
- G0 (pure contracts): PASS, provided tests re-run after packaging.
- G1 browser visual: BLOCKED (headless GPU context initialization); compilation/link is not certified.
- G2 reconstruction: NOT RUN (requires working browser and paired PNGs).
- G3 device 60-FPS timing: NOT RUN; no device profile.
- G4 TouchDesigner parity: NOT RUN; no `.toe` or parameter sweep.
- Known confounds: point-size/camera crop can differ from flat view, fixed RGBA8 precision, browser-driver raster behavior, audio autoplay.
- Decision: retain as an isolated, non-promoted experiment. Next: open in actual GPU WebGL2 browser, capture frames 0/120/240/360/480/600/719, export receipts, compare reset/seek frame 360.
