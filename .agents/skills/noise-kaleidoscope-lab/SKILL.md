---
name: noise-kaleidoscope-lab
description: Reconstruct, implement, test, and document noise-driven polar reflection kaleidoscopes in WebGL2 and TouchDesigner using bounded and deterministic control.
---

# Noise Kaleidoscope Lab

Invoke for radial symmetry, noise-to-motion, dihedral folding, procedural transition experiments, shader control contracts, or cross-adapter comparisons. Start by reading docs/experiments/noise-kaleidoscope-v0.md and experiments/noise-kaleidoscope-v0/contract.mjs. This experiment is an original implementation inspired by bnsh_av's tutorial; it is not the source project's exact node graph.

## Mandatory protocol

1. Confirm repository remote, clean state, branch and HEAD before editing; do not change open optical-studies or Material Validation Lab branches.
2. Preserve attribution and separate verified video facts from mathematical inference and original implementation.
3. Use contract.mjs as the authority for parameter bounds. Reject unknown, nonfinite, fractional sectors/seed, or out-of-range values. Never apply free-form LLM shader text as a preset.
4. Preserve the invariant: folding must occur before procedural sampling. Angular/world-space distortion before folding risks visible mirror seams. Do not mix seed and wall-clock time.
5. Run Node tests, then serve the browser route over HTTP. Check actual WebGL2 compile/link/draw, controls, reduced-motion freeze, and render differences. Record browser/GPU/resolution/time; never infer compile pass from unit tests.
6. For TouchDesigner, follow touchdesigner/README.md and inspect the GLSL TOP Info DAT. Its Noise TOP source is not pixel-identical to browser fBm. Never claim cross-runtime byte parity.
7. Sweep sectors 3/6/12/24, warp 0/0.45/1.5, scale 2/9, seed and frozen time independently. Maintain screenshot + state receipt, known limitations and issue/PR link.
8. Promote to gallery manifest only with proven visual QA, accessible controls and target-device performance. Keep unverified 60 FPS targets explicitly marked.

Stop on dirty branch, missing provenance, failed shader compile, unbounded controls, ambiguous parameter units, context loss, or TouchDesigner graph overwrite. Report the failure and the smallest repair, without silently retuning other controls.

## Required handoff

Provide base SHA, head SHA, experiment slug, source URL, validated parameters, test commands and outputs, real render evidence or NOT_VERIFIED, regression notes, and next bounded trial. This skill must remain portable and must not imply that a copied tutorial or licensed Patreon project has been imported.