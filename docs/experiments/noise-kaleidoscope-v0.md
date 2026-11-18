# EXP-001 — noise-driven dihedral symmetry
Date: 2026-10-18. Implementation: MelodicBloom/shader-gallery, isolated experimental route.

## Provenance

Inspiration: bnsh_av, Touchdesigner Tutorial - Kaleidoscope with Noise (Beginner Friendly), https://www.youtube.com/watch?v=fSa0vZrXk9k. Description confirms TouchDesigner, noise, kaleidoscopic treatment, no commentary, and a linked free Patreon file. The precise original nodes and settings have not been verified. Code below is an independently authored mechanism reconstruction, not copied tutorial or Patreon content.

Reference documentation: https://docs.derivative.ca/Noise_TOP ; https://docs.derivative.ca/GLSL_TOP ; https://docs.derivative.ca/Write_a_GLSL_TOP .

## Algorithm and decisions

1. p = (uv - 0.5) * 2 * (aspect,1), aspect=width/height.
2. theta = atan(y,x) + rotation + time*speed*.16.
3. sector width delta = 2pi/N, with N integer in [3,24].
4. local = mod(theta,delta), mirrored angle = min(local,delta-local).
5. q = radius * (cos(mirrored), sin(mirrored)).
6. Apply a radial warp based only on radius and folded angle; generate 4-octave seeded value-noise fBm from q.
7. Map field intensity using a cosine palette; apply contrast and a bounded glint. Artistic chromatic simulation, not physical iridescence.
8. Save state, seed, time, resolution and GPU/browser with images. Same renderer state should replay; cross-GPU pixel parity is not promised.

## Run

Clone this branch, then from repository root:
  node --test experiments/noise-kaleidoscope-v0/test.mjs
  python3 -m http.server 4173

Open http://localhost:4173/experiments/noise-kaleidoscope-v0/ . Choose N=3,6,12,24; pause at t=0, then vary warp/scale. Inspect seam boundaries. The browser route is deliberately separate from library-v1/manifest.json and the Pages homepage.

TouchDesigner path: experiments/noise-kaleidoscope-v0/touchdesigner/README.md.

## Trial acceptance and gating

A: Contract tests pass (CPU geometry; not GPU shader verification).
B: Real WebGL2 compilation, linking and draw documented on named browser/GPU; screenshot proves nonblank output and parameter changes.
C: Controls including pause, time reset, capture, reduced motion work; mobile viewport inspected.
D: TouchDesigner node setup and GLSL TOP Info DAT checked on a real installation, or remains explicitly unverified.
E: 512x512 and mobile 1080x1920 frame-time median/p95 measured before making any 60 FPS claim.

No automatic merge or gallery promotion until review. The Material Validation Lab tracks physically motivated materials and must not absorb unmeasured kaleidoscopic appearance claims.

## Experiment matrix

K01: N 6→12→18, hold all else: look for seam tearing.
K02: warp 0→0.45→1.5: mirror axes should remain continuous.
K03: frequency 2→9: inspect aliasing and detail.
K04: fixed time/seed render twice: same-frame replay.
K05: palette 0→.5→1: cyclic chromatic response.
K06: seed 314→91: different field; replay original seed to confirm recovery.

Keep evidence statuses separate: mechanism documented; CPU tests; browser compile/draw; TouchDesigner execution; mobile FPS; gallery integration.