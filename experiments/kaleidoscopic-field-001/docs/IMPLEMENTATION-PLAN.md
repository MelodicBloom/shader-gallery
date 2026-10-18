# KF-001 Kaleidoscopic Field Implementation Plan

> **For agentic workers:** Use the host's available task-by-task implementation workflow. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reconstruct and compare one audio-driven temporal field as flat symmetry versus displaced point geometry, with portable evidence and explicit parity boundaries.

**Architecture:** Standalone zero-dependency WebGL2 module with ping-pong RGBA8 field pass and two same-context panel draws. A fixed 720-frame authored WAV/envelope/schedule controls both views. Offline Node tests verify independent numerical contracts; browser and TouchDesigner trials are tracked separately.

**Tech Stack:** HTML/CSS, JavaScript ES modules, GLSL ES 3.00, Node.js 20+, TouchDesigner as an external reference implementation.

## Global Constraints

- Preserve existing `main` and unrelated PRs; keep experiment under `experiments/kaleidoscopic-field-001`.
- Never promote tutorial values as numerical facts without source re-verification.
- No copying GPL-licensed TouchDesigner component into MIT browser code.
- Fix parameters and authored WAV in reference trial; include failure receipts.
- Treat UI FPS and fixed 60Hz simulation as distinct; no 60fps performance guarantee until profiled.

---

### Task 1: Baseline field and audio reproducibility

**Files:** `src/control.js`, `src/audio.js`, `tools/build-fixture.mjs`, `fixtures/*`, `docs/parameter-schedule.json`, `tests/control.test.mjs`.
**Interfaces:** 720 frames at 60Hz; `sanitizeParams`, `audioAt`, `derivedAudio`, `scheduleAt`; authored WAV+event annotations.

- [x] **Step 1:** Add tests for 720 samples, symmetry invariants, range limits and phase transitions.
- [x] **Step 2:** Verify failure before implementation where baseline was absent (not independently recorded for this initial draft; red-stage evidence is not claimed).
- [x] **Step 3:** Implement deterministic control, WAV generator and event envelope.
- [x] **Step 4:** Run `npm test` and observe 8 passing tests.
- [x] **Step 5:** Run `npm run fixture`, then `npm test` again to verify regenerated sample count.
- [ ] **Step 6:** Commit scoped, passing deliverables in repository branch; obtain resulting SHA.

### Task 2: GPU visual comparator

**Files:** `src/shaders.js`, `src/gl.js`, `index.html`, `style.css`, `src/app.js`.
**Interfaces:** same `H_t` feedback source sampled by flat full-screen pass and NxN vertex displacement pass.

- [x] **Step 1:** Include structural assertions for feedback, fold and displacement in Node tests.
- [x] **Step 2:** Record shader visual failure if headless browser cannot initialize GPU (environment blocked; actual render not verified).
- [x] **Step 3:** Implement WebGL2 ping-pong feedback, radial fold, point rendering and controls.
- [ ] **Step 4:** On a working WebGL2 browser, capture matched PNGs at frames 120/240/360/480/600 and inspect symmetry/depth.
- [ ] **Step 5:** Repeat reset/seek frame 360 and compare render evidence; measure p50/p95 frame time using browser profiler.
- [ ] **Step 6:** Commit any fixes only after hardware/browser QA; maintain draft PR until G1/G2.

### Task 3: Documentation and TouchDesigner transfer

**Files:** `docs/ARCHITECTURE.md`, `docs/TOUCHDESIGNER.md`, `docs/EXPERIMENT-PROTOCOL.md`, `README.md`.
**Interfaces:** explicit equations, paths, operator mapping, source boundaries and gates G0–G4.

- [x] **Step 1:** Define expected states and what would falsify parity.
- [x] **Step 2:** Record that exact TouchDesigner `.toe` reproduction is presently missing.
- [x] **Step 3:** Author local TD operator network and evidence matrix.
- [x] **Step 4:** Check documentation references against actual source paths.
- [ ] **Step 5:** Perform TouchDesigner trial on installed software and capture `.toe` plus matched frames.
- [ ] **Step 6:** Commit trial evidence separately from the speculative operator design.

### Task 4: Agent capability, handoff and promotion

**Files:** `.agents/skills/kaleidoscopic-field-lab/SKILL.md`, `references/*`, `docs/evidence/*` after trials.
**Interfaces:** skill inputs: source SHA, hypothesis, control traces; outputs: tested artifact, receipt, failure taxonomy and next smallest experiment.

- [x] **Step 1:** Include gates for explicit source/license attribution, deterministic evidence, and bounded claims.
- [x] **Step 2:** Check that skill does not require nonexistent tooling or unverified commands.
- [x] **Step 3:** Author the skill and portable evidence/contract references.
- [ ] **Step 4:** Package `.skill` archive and verify it opens and contains all required skill files.
- [ ] **Step 5:** Open a draft PR with known QA blockers and link concrete implementation files.
- [ ] **Step 6:** After G1/G2 verified, propose minimal schema/field operators to `shader-grammar` as a separate change.

## Decisions still open

- Texture precision migration (RGBA8 vs RGBA16F) depends on observed color banding.
- Cross-engine equality tolerance depends on TouchDesigner output buffer configuration and recorded camera parity.
- Device-specific 60fps feasibility depends on measured targets; defaults are proposals, not performance certifications.
