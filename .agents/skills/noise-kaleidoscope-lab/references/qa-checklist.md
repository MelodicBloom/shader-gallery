# Reproducibility and visual QA gate

- [ ] Input URL, license provenance, exact code SHA recorded.
- [ ] Browser source has no third-party assets and no unbounded dynamic shader injection.
- [ ] Geometry Node tests green on branch HEAD; retain console output.
- [ ] Real WebGL2 compile + link + draw checked in named GPU/browser.
- [ ] Captured nonblank 512×512 frame and control-change image on the SAME viewport.
- [ ] Frozen seed 314, time 1.2345 and full controls included in receipt.
- [ ] Reflection + rotation/seam sweeps for N=3/6/12/24.
- [ ] Pause/reset/step/copy/capture, keyboard focus, mobile and reduced-motion tested.
- [ ] TouchDesigner Textport builder or manual network verified; Info DAT checked.
- [ ] Cross-adapter procedural-noise differences acknowledged; no pixel parity claim.
- [ ] Median/p95 target-hardware timing measured before any 60 FPS claim.
- [ ] Record failure signatures and the smallest isolated remediation.
- [ ] Do not merge/promote to stable manifest until review evidence sufficient.

Receipt fields: experiment, source SHA, browser/GPU/OS or TouchDesigner build, dimensions/DPR, control vector, time/seed, screenshot/checksum, Node test output, shader compile log, performance summary if measured, issues, next trial. Unverified fields must be labeled UNVERIFIED rather than guessed.