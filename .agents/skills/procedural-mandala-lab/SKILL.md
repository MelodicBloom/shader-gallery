---
name: procedural-mandala-lab
description: Reconstruct, test, and govern deterministic procedural mandala and wireframe motion experiments from TouchDesigner tutorials. Use for line-to-noise CHOP/SOP networks, radial and template-copy geometry, portable parameter mapping, controlled audio-reactive extensions, screenshot/receipt QA, and artist-to-code transfer with source attribution.
---

# Procedural Mandala Lab

Follow the smallest verifiable source-to-control experiment. **Do not claim recreation fidelity or validated 60 fps without footage comparison and measured runs.**

## Inputs

- Source video or transcript with title/author/link; note retrieval method and any ASR uncertainty.
- Target runtime: TouchDesigner, browser reference, or an approved adapter.
- Seed, point count, radial copies, template count, noise amplitude/frequency, frame timestamp, optional reference screenshots.
- Repository revision and any existing branch/PR; check for stale or unmerged work before mutation.

## Procedure

1. Read [`docs/experiments/wireframe-mandala.md`](../../../docs/experiments/wireframe-mandala.md) and [`experiments/wireframe-mandala/README.md`](../../../experiments/wireframe-mandala/README.md). These links are relative to the repository root; if resolving relative to this skill directory use `../../../docs/...` and `../../../experiments/...`.
2. Keep four categories separate: source-observed actions, independently verified product documentation, interpretation/translation, and untested hypotheses. Always cite creator and Derivative references. Do not copy the video's third-party assets or transcript into code.
3. Inspect `core.mjs`, `presets/starting-preset.json`, and the JSON Schema contract. To produce a new preset, validate numeric bounds **and** cross-field segment complexity through `normalize()`. Reject over-budget suggestions; do not silently rewrite intent.
4. Run `node --test experiments/wireframe-mandala/tests/*.test.mjs` from repo root. Generate baseline via `node experiments/wireframe-mandala/tools/run-evidence.mjs --time 0 --out /tmp/mandala-baseline.json` and record `git rev-parse HEAD`. Keep receipts as artifacts outside the source tree unless explicitly reviewed.
5. Serve repo root using `python -m http.server 8000`, open `/experiments/wireframe-mandala/`; inspect at least `radial` and `nested`, verify reset, pause, rejected controls, PNG and JSON receipt. Compare three equal-time states; keep display/canvas pixel observations separate from geometry fingerprints.
6. For TouchDesigner, use the documented manual SOP/CHOP recipe; before scripting undocumented parameter names verify them in a local installed version. Record actual node topology and both Copy SOP inputs. Treat changes in normal orientation, point counts, and axis as disqualifying differences until explained.
7. If porting to WebGL2/GLSL, add as a separate adapter consuming the same bounded parameters; retain CPU reference and its tests. If audio reactive, apply a permission-aware, smoothed, clipped control envelope and validate silent/missing-input behavior.
8. Write an evidence ledger: command, runtime/version, commit SHA, seed, time, params, expected/actual segment count, geometry fingerprint, screenshot path, observed discrepancies, next smallest change. Update issues/PRs with verified outcomes only.

## Acceptance gates

- `normalize` rejects invalid requests; geometry stays finite; sample counts match formula.
- Replaying exact seed/parameters/time yields identical geometry fingerprint.
- No unexpected browser exceptions, all interactive controls perform their indicated behavior, exports contain reproducible metadata.
- Visual fidelity to source and FPS claims are **separate gates**. In their absence mark *untested*, not *passed*.
- Stop at draft PR; never auto-merge, push third-party assets, or change existing optical/material manifests without owner approval.

## Deliverable shape

Return: source ledger; edited paths; commands; named tests with pass/fail/block; receipts and visual evidence; human review question; specific next bounded experiment. Cite source: https://www.youtube.com/watch?v=sFY78EmBZvY
