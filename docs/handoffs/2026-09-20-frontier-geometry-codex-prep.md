# Codex Preparation Handoff — Frontier Geometry Protocol v0.1

**Repository:** MelodicBloom/shader-gallery  
**Expected base SHA:** `e28557bfd44076f4c06baae8cab620f96574ab3c`  
**Design branch:** `docs/frontier-geometry-protocol-v0-1`  
**Current gate:** preparation/spec review only; do not implement production behavior yet.

## Mission

Prepare the repository to implement two narrow research wedges after the written design is approved:

A. Projected Linearity  
B. Observation-Dependent Material

The goal is not to build the full platform. The goal is to establish the smallest testable architecture that can falsify or support the core design assumptions.

## First action: verify receipt

Before doing any work:

1. fetch `main`;
2. report current main HEAD;
3. compare it with the expected base SHA above;
4. if it differs, list commits and affected paths;
5. if changes touch `packages/shader-library-v1/**`, stop and report whether the design assumptions need reconciliation.

Never silently continue from a different base.

## Repository constraints

Preserve:
- `packages/shader-library-v1/source/` as current source-package authority;
- zero-dependency WebGL2 baseline;
- current root gallery, aurora, abalone, docs, and Pages behavior;
- package-scoped validation.

Do not:
- write to main;
- force-push;
- overwrite `library-v1`;
- make Three.js mandatory;
- make WebGPU mandatory;
- create multiple packages;
- add AETHER coupling;
- add all 15 shaders at once;
- treat generated concept art as measured evidence.

## Environment

Primary implementation environment:
- Node.js >=20;
- npm, matching the existing source package;
- Git;
- WebGL2-capable Chromium/Chrome;
- existing native EGL/GLES validation dependencies used by package CI;
- optional Playwright only if added through a reviewed plan and justified by existing project patterns.

Do not introduce pnpm merely for preference: the current package scripts use npm.

## Pre-implementation validation commands

Run from `packages/shader-library-v1/source/`:

- `npm test`
- `npm run generate:previews`
- `npm run build:docs`

Record the exact outputs and current commit SHA.

## Provisional build order after spec approval

### BO-00 — Baseline receipt
Goal: prove the existing package is green before changes.

Done:
- exact base SHA recorded;
- existing tests pass;
- generated previews complete;
- docs build completes;
- no unrelated diff.

### BO-01 — Contract fixtures, no renderer expansion
Goal: encode the smallest state needed for Wedge A/B without changing public runtime behavior.

Candidate concepts:
- geometry identity;
- emitter state;
- receiver state;
- observer state;
- projection kind;
- experiment id;
- evidence/provenance class;
- deterministic scene snapshot.

Write tests first.

Stop if these contracts require a generic scene graph.

### BO-02 — Projected Linearity reference math
Goal: test analytic source -> receiver projection independently of WebGL rendering.

Start with a point/central or directional projection onto a plane.

Must prove:
- source geometry is preserved separately;
- receiver points are reproducible;
- known reference curves meet declared straightness expectations.

Stop if the test requires post-processing or arbitrary mesh shadowing; that is outside the wedge.

### BO-03 — Minimal rendered Wedge A
Goal: render one curved grid, one emitter/projection, one planar receiver, one independent observer.

Use Silver only as a calibration material.

Prefer extending the current runtime minimally. If a fullscreen-only runtime cannot represent the apparatus without mixing geometry, scene, and UI responsibilities, report that boundary as evidence before introducing a larger renderer.

### BO-04 — Observation-dependent control scene
Goal: isolate material, emitter, and observer changes.

Sequence:
1. Silver baseline.
2. Nacre candidate.
3. Labradorite candidate.

Do not add geometry sonification or sacred-geometry coupling yet.

### BO-05 — Measurement and evidence
Goal: record deterministic snapshots, metrics, and apparatus.

Required:
- hardware/browser metadata;
- frame timing;
- projection metric;
- visual reference captures;
- provenance class for every claim.

### BO-06 — Mobile degradation proof
Goal: preserve experiment meaning under constrained rendering.

Test:
- lower DPR;
- lower update cadence;
- one live specimen;
- static fallback.

### BO-07 — Review
Goal: decide whether the geometry/scene/runtime boundary has been earned.

Output:
- keep current runtime;
- extract internal geometry/scene module;
- or reject/revise the proposed boundary.

No package extraction at this gate.

## Subagent operating contract

Use subagents only for separable, read-only or branch-local work. The coordinating agent owns integration.

IF repository state differs from the expected SHA:
- subagent A compares commits;
- subagent B checks affected tests/contracts;
- coordinator reconciles before any edits.

IF Wedge A math is uncertain:
- subagent A derives analytic projection independently;
- subagent B designs falsification fixtures;
- coordinator compares derivations and chooses the smallest testable model.

IF runtime changes appear necessary:
- subagent A inspects current ShaderPlayer responsibilities;
- subagent B prototypes the minimal interface on a scratch branch or throwaway note;
- coordinator must justify why the current runtime cannot satisfy the test before approving new architecture.

IF performance regresses:
- subagent A profiles CPU/GPU/frame timing;
- subagent B compares reference vs constrained fidelity;
- coordinator chooses the smallest degradation that preserves the experiment.

IF a speculative material/geometry coupling is proposed:
- classify it as PROJECT_INTERPRETATION or HYPOTHESIS;
- keep it out of canonical code until a controlled experiment supports promotion.

## QA / Definition of Done for the first implementation plan

The first implementation milestone is done only when:

- existing package validation remains green;
- Wedge A has a deterministic analytic/reference test;
- source, receiver, and observer state serialize independently;
- cast projection and view projection are not conflated;
- one rendered Wedge A scene exists or a documented runtime-boundary failure proves why it cannot yet;
- Silver calibration behaves reproducibly;
- Nacre/Labradorite work is still scoped behind explicit hypotheses;
- mobile fallback exists for any new live scene;
- all performance claims include apparatus;
- no generated mockup numbers are cited as evidence;
- final handoff includes base SHA, head SHA, files changed, tests, generated artifacts, failures, and next gate.

## Stop conditions

Stop and ask for review if:
- implementation requires root-gallery replacement;
- implementation requires making Three.js/WebGPU mandatory;
- proposed changes touch more than the first wedge plus minimum shared contracts;
- a public API must break;
- benchmark thresholds cannot be measured with the available apparatus;
- current main diverges materially from this handoff.

## Decisions still needing human confirmation

1. Should Wedge A's first physical scene use a spherical great-circle grid or a simpler curved ruled surface?
2. Should first mobile validation target Android Chrome as the named constrained device/browser?
3. Should sonification remain entirely out of the first implementation milestone? Recommended: yes.
4. Should the first material wedge stop at Silver + Nacre, keeping Labradorite as the next experiment if the rig is proven? Recommended: yes.
