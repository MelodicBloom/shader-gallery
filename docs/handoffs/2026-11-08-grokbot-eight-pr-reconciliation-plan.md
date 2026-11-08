# Shader Gallery Eight-PR Reconciliation Implementation Plan

> **For agentic workers:** Use the host's available task-by-task implementation workflow. Steps use checkbox (- [ ]) syntax for tracking. This document is an **authorized handoff proposal**, not a claim that changes, tests, merges or deployed QA have been performed.

**Goal:** Resolve known review defects in eight existing experimental PRs, reconcile their source authority and branch dependencies, and return independently reviewable, truthfully evidenced drafts without collapsing distinct material, optical or motion experiments.

**Architecture:** Shader Grammar is the semantics authority; Shader Gallery owns optically illustrated and interactive implementations; Material Validation Lab owns provenance-bound experiment receipts. Keep discrete 2D, 3D, glTF/Three.js, Canvas2D, WebGL2 and TouchDesigner reference lanes separate. Reuse validated operators/contracts by explicit versioned adapters only, never by silently copying GLSL or translating similarly named controls.

**Tech Stack:** Git/GitHub, Node 22+, WebGL2/GLSL ES 3.00, JavaScript, Python 3, Mesa/EGL/GLES for native smoke checks, Chromium/Playwright where available, isolated Three.js 0.186.1 Khronos lane, HTML/Canvas2D, optional TouchDesigner with truthful unavailability labels.

## Global Constraints

1. **Read live status first.** Observations below are dated 2026-11-08, not permission to assume heads stay fixed. For every task record current PR head/base/merge-base SHA, Git status, changed files, review comments, CI, and deployment/auth policy. Stop on meaningful unexpected drift.
2. **Bounded writes:** One original PR/branch per agent, or a separately proposed fix-up branch when the original branch has conflicting ownership; don't overwrite another worker. Existing PR numbers stay as primary review destinations. If there are unrelated changes, stop and reconcile before editing. Never force-push/reset or discard historical branches. Keep all deliverables draft for human review.
3. **No release or scientific promotion:** No merge, release, public deployment, canonical schema change, reference-license substitution, device performance assertion, physical calibration or conformance claim without explicit owner approval. Do not mark CodeRabbit/Codex threads resolved until a test, changed commit and reviewer response support the resolution.
4. **No hidden provenance change:** Preserve failed runs, rejected hypotheses, negative controls, original source/GLSL hashes, third-party attribution, image receipts, and named GPU metadata. A new observation can supersede an interpretation but cannot rewrite what a historical run measured.
5. **Repo authority:** qt314wink/shader-grammar = canonical optical-material semantics. MelodicBloom/shader-gallery = consumer/renderer and evidence. MelodicBloom/.github PR #22 is **open draft**, not merged enforcement. Shader Gallery #8 is a snapshot/import candidate, not a competing canonical ontology.
6. **Environment:** The older Codex Cloud proxy failure is historical, not the default active blocker. Fetch all required refs fresh from the task's *actual* Git working shell. On Cloud activate /workspace/.shader-env/activate.sh if verified present. In WSL use verified installed dependencies. Don't run npm ci at shader-gallery root (no root package manifest). If network is unavailable, stop with exact stderr. Do not edit proxy or bypass policy.
7. **Dated evidence categories:** SOURCE = pinned/hash verified; CONTRACT = tests; RUNTIME = browser/GPU draw; VISUAL = reviewer-reviewed imagery; PERFORMANCE = named-device metrics; PHYSICAL = calibrated comparison. One category's PASS never auto-promotes the next.
8. **No auto-closing:** Review threads, issues and PRs remain open until owner or delegated reviewer authorizes closure. New draft evidence is not a merge directive.

## Current inventory / dependency map (observed 2026-11-08)

| PR | Branch / head | GitHub state | Dependency and key review gate |
| --- | --- | --- | --- |
| [#31 Khronos Abalone](https://github.com/MelodicBloom/shader-gallery/pull/31) | feat/mvt-abalone-001 @ b21f2972b7c1e8662a21aa925082974c8a272a42 | draft, base is already-merged feat/material-validation-lab-v0; 104 changed files; CI success | G0 [#30](https://github.com/MelodicBloom/shader-gallery/pull/30) is separate unmerged draft. Two unresolved trial-runner review threads, historical run 3 failure, pending human GPU review. |
| [#13 Optical Studio v1.2](https://github.com/MelodicBloom/shader-gallery/pull/13) | feat/optical-studio-v1.2-abalone-lab @ bc84ebc6b13d2d5d1d1dacdfdef5c526ac8597d7 | draft, 26 files | Three unresolved findings: paused resize, bfcache restoration, Crystal Lens studio projection. #38/#41/#42 stack on this lineage. |
| [#12 Opal Atlas](https://github.com/MelodicBloom/shader-gallery/pull/12) | feat/material-atlas-opal-v0-1 @ 04e933418c07b586fec41b4e91fb431b596fd330 | draft, 12 files; isolated CI success | Three unresolved findings: pinch zoom, paused resize, missing non-slider uniform defaults. Distinct from #13 opal-fire and original 2D opal. |
| [#8 Shader Grammar import](https://github.com/MelodicBloom/shader-gallery/pull/8) | codex/shader-grammar-intake @ ffb1a47948f28df54f71fb580865a1605c5839a6 | draft, GitHub mergeable=false, 41 files; grammar QA success | One unresolved URL-path issue; canonical external semantics; #46 thin-film host stacked here. |
| [#19 GEO-TILE](https://github.com/MelodicBloom/shader-gallery/pull/19) | experiment/geotile-001-instamat-reconstruction @ 79d5459825d3c7c23d203e6eab3c40ecef5eb90e | draft, GitHub mergeable=false, 20 files | Three unresolved findings, two of which involve inherited Lab validator/registry code already repaired in current main; #45 browser inspector stacked on original branch. |
| [#21 Wireframe Mandala](https://github.com/MelodicBloom/shader-gallery/pull/21) | experiment/wireframe-mandala-001 @ e6ffbfe416239087a149bcea68753b3b562ba58e | draft, 11 files; contract CI success | Three previous review threads resolved; device visual review and TouchDesigner topology parity not yet claimed. |
| [#23 Noise Kaleidoscope](https://github.com/MelodicBloom/shader-gallery/pull/23) | experiment/noise-kaleidoscope-v0 @ f4f77e997d7eb37ac0f6f265c41b6c306e399e39 | draft, 14 files; contract CI success | Two previous threads resolved; hardware WebGL2/pixel replay, sector seams, TD adapter smoke missing. |
| [#24 Audio Kaleidoscope](https://github.com/MelodicBloom/shader-gallery/pull/24) | experiment/kaleidoscopic-field-001 @ b2dd178db6198a89b41e32d6be7ac0a8302915fb | draft, 28 files; contract CI success | Five previous threads resolved; hosted SwiftShader smoke exists but hardware, deterministic pixel replay, named-device performance and TD parity missing. |

Related, **do not silently merge with**: #40 portfolio-runtime reverse-side iridescence (open non-draft), #44 SVG↔GLSL grain draft, #47 independent demo directory draft, #48 Optical Studies fallback draft, and #49 continuity/handoff docs draft. PR #18 merged; #30 G0 research still draft. PR #39 Dispersion Instrument merged. A route returning HTTP 200 is not browser/GPU acceptance.

## Shared preflight and work protocol

- [ ] Fetch refs into independent worktrees. Capture git status, git remote, full SHA, merge-base, diff stats, CI URL and review-thread URL before any edits.
- [ ] Compare each reported defect against its actual PR branch and *current main* to distinguish still-broken code from inherited problems that main already fixed.
- [ ] Make a red regression test that fails for the exact observed failure; record exit/stderr. Apply the smallest branch-local correction. Make the test pass; run existing adjacent tests plus native shader/source archive/manifest QA when the paths it covers change.
- [ ] Where a PR branch has an obsolete merged base or merge conflict, **do not use GitHub's mergeable=true as scientific sign-off**. Record merge-base conflict list; prefer preserving its branch and integrating main by a normal merge only after the relevant file owner approves the conflict plan. For an old snapshot branch, consider a new *repair-only* draft PR with content-limited cherry-picks instead of forwarding obsolete registry/ZIP files.
- [ ] When a PR changes generated package source, regenerate ZIP/FILELIST through its checked-in tool and validate exact source parity. Never hand-edit the archive or claim its old hash still applies.
- [ ] When a GUI check cannot run, mark BLOCKED, include screenshot/recording plan, environment/GPU identification, and a direct viewer route; do not invent device/visual passes.
- [ ] Commit only files within assigned ownership; push to the intended branch only after checking its remote SHA/lease. Update PR body with "before -> after" issue matrix, command/exit/test/CI links and non-claims. Post review-thread replies referencing the fixed commit and test; keep threads unresolved until verified/reviewer disposition.

### Executable Git inspection (checkout-independent)

~~~bash
set -euo pipefail
git status --short --branch
git remote -v
git fetch --no-tags origin main \
  feat/material-validation-lab-v0 feat/mvt-abalone-001 \
  feat/optical-studio-v1.2-abalone-lab \
  feat/material-atlas-opal-v0-1 codex/shader-grammar-intake \
  experiment/geotile-001-instamat-reconstruction \
  experiment/wireframe-mandala-001 \
  experiment/noise-kaleidoscope-v0 experiment/kaleidoscopic-field-001
git rev-parse origin/main
git merge-base origin/main HEAD
git diff --check
~~~

The multi-ref fetch above is an **inspection starting point**; if an individual remote branch no longer exists, stop and map its renamed/merged ref from GitHub rather than skipping it. Use per-PR isolated worktrees from freshly fetched commits, not eight agents sharing one checkout.

---

## Task 1 — #31 Abalone: repair evidence-integrity defects and reconcile G1

**Files (observed):**
- Modify only after reproducing: material-validation-lab/reference/abalone/tools/run-trial.mjs.
- Read and preserve: material-validation-lab/reference/abalone/receipts/receipt.json; material-validation-lab/receipts/BUILD_HANDOFF-MVT-ABALONE-001-*.md; corresponding BUILD_RECEIPT; material-validation-lab/CONFLICT_LEDGER.md.
- Proposed focused test file: material-validation-lab/reference/abalone/tools/test-run-trial-receipts.mjs (confirm no existing suitable test before adding).
- Existing packaged record: packages/shader-library-v1/source/material-validation-lab/materials/abalone-baseline.record.json. Editing it changes source-archive parity and must be separately justified.

**Interfaces:** Consumes page boot state, 3-fixture × R/G measurement tensors, previous immutable receipt/UV diagnostic data; produces a schema-valid run receipt with explicit failure reason and preserved historical evidence.

- [ ] Reproduce [PR review: unsuccessful boot](https://github.com/MelodicBloom/shader-gallery/pull/31#discussion_r4439243446). Force WebGL2 unavailable / initialization error *in a scratch test run*, assert runner does **not** dereference missing synth measurements, exits with nonzero or an explicit BLOCKED contract consistent with existing tool semantics, and writes an inspectable blocked-attempt receipt. Never overwrite the last successful measurement when boot fails. Decide/record whether blocked attempts are separate immutable files or supported receipt history; don't invent a new schema silently.
- [ ] Reproduce [PR review: erased UV diagnostics](https://github.com/MelodicBloom/shader-gallery/pull/31#discussion_r4439243450). On a temporary copy with diagnostics present, rerun receipt generation and assert diagnostics/history survive byte-for-byte or through a schema-equivalent immutable reference. The committed receipt currently lacks the diagnostics block although earlier BUILD_RECEIPT-UVDIAG documents measurements: recover that data only from pinned source/run evidence, with a new recovery receipt; never fabricate unchanged history.
- [ ] Verify run count/history, source asset pin Khronos 4995a638c96dbc94376d3d6164e70fee3ac7f7a2; GLB SHA-256 d15ab000d3b04f177e101b2a36aacbf1c99490fc9bfe3868d481d75736946bab; Three.js 0.186.1 lock; CC BY 4.0 attribution; browser SwiftShader identity. Distinguish actual acquired pins from older *discovery* pins in issue #35; record pin drift in conflict ledger before status change.
- [ ] Preserve run-3 authored-shell synthetic **FAIL**. Runs 4–7 demonstrate sensitivity variants passing narrower criteria under SwiftShader; they do not overturn run 3. Current reference receipt label is **inconclusive** with named human review pending, while packaged record is **fail** and old resultSummary says synthetic studies outstanding. Treat status synchronization as a governance/schema decision: propose append-only "historical fail vs latest inconclusive" wording and obtain owner review before editing canonical record/status. No PASS without named reviewer.
- [ ] First read #30's nine-file G0 packet and today's main; then prepare a conflict-safe, explicitly approved retarget/merge-main proposal for #31 (currently based on already-merged Lab branch). Do not retarget, force-push, merge or delete the original experiment history in this tranche.
- [ ] Tests in isolated scratch checkout: node --check tools/run-trial.mjs; focused receipt regression tests; existing npm scripts per material-validation-lab/reference/abalone/package.json; node packages/shader-library-v1/source/tools/validate-material-lab.mjs, test-validate-material-lab.mjs and verify-source-archive.mjs from repo root if the packaged contract changes; git diff --check. Actual trial may overwrite captures: run only in scratch using pinned assets, never on historical evidence working tree.
- [ ] Provide hardware visual review packet: neutral/treatment, grazing, light-sweep, R-only/G-only with identical camera/light/exposure states; SHA hashes, original captures, browser/device/GPU, screenshot/recording and named human acceptance. Until then, status remains inconclusive / failed historical tests retained.

**Accept:** regression for both unresolved review threads passes; existing seven-run evidence recoverable; record/receipt discrepancy documented; clean archival parity; no synthetic test threshold shift; review-ready draft with owner decisions called out.

## Task 2 — #13 Optical Studio v1.2: restore lifecycle and actual Crystal Lens illumination

**Files (observed):** optical-studio/index.html; optical-studio/shaders/crystal-lens/shader.glsl; optical-studio/shader-manifest.json; optical-studio/QUALITY_GATES.md. Proposed browser tests under optical-studio/tests/ (do not claim these already exist); consider standalone-shader/embedded-shader sync check.

- [ ] [Paused resize finding](https://github.com/MelodicBloom/shader-gallery/pull/13#discussion_r4439244774): add failing browser test: reduced-motion/paused, resize from desktop to phone or rotate; require drawing-buffer dimensions, u_resolution, and a newly drawn nonblank frame to update without touching sliders. Implement dimension invalidation *before* play/dirty early-return or a resize observer that schedules exactly one redraw while paused.
- [ ] [bfcache finding](https://github.com/MelodicBloom/shader-gallery/pull/13#discussion_r4439244776): test navigation away/back with persisted pageshow. Implement idempotent render-loop resumption without duplicate RAF loops or lost listeners; preserve selected study, control values, pause preference and renderer state. Test context loss/restoration separately.
- [ ] [Crystal Lens finding](https://github.com/MelodicBloom/shader-gallery/pull/13#discussion_r4439244779): introduce a light-aligned orthonormal tangent basis to evaluate studio panel support; the previous dot-projection made panel contributions identically zero. Assert a controlled positive light contribution at specified rays in actual draw, and verify changes with light direction. Update both canonical GLSL and any matching shader embedded in index.html. Reject accidental duplicated/broken uniforms or array changes. Recompute hashes/manifest with canonical generator if present; otherwise document exact independently computed hashes and source compatibility.
- [ ] Preserve the seven specimens, original lineage, CC BY/source attribution, separate Abalone authored proxy, and bounded spectral/HDR roadmap. Review the independent #38/#41/#42 stacked *plans* and coordinate which fixes affect them; do not quietly absorb those branches. Run static route at optical-studio/index.html, browser interaction, keyboard/reduced-motion/mobile, and seven-shader compile/link/draw on a declared GLES/WebGL2 environment. Keep physical accuracy and spatial HDR unclaimed.

**Accept:** all three review-thread regression cases have measured before/after evidence, paused resize and bfcache work on screenshots/browser, Crystal Lens light-panel nonzero pixel witness, no changes to unrelated gallery runtime. Draft stays open for art review.

## Task 3 — #12 Material Atlas / Precious Opal: preserve 2D defaults and real touch interaction

**Files:** packages/shader-library-v1/source/material-atlas/app.js; core.js; tests/core.test.mjs; tests/shader.test.mjs; materials/precious-opal.json; docs/material-atlas/HANDOFF.md.

- [ ] [Pinch zoom](https://github.com/MelodicBloom/shader-gallery/pull/12#discussion_r4439243927): maintain pointer-id map for two active touches; pinch scale from nonzero initial distance, clamp zoom to existing allowed bounds, handle pointercancel/up and transitions 1↔2 pointers, don't allow simultaneous orbit and pinch to fight. Red test must demonstrate wheel-independent two-touch zoom on touch emulation; preserve mouse/keyboard orbit.
- [ ] [Frozen resize](https://github.com/MelodicBloom/shader-gallery/pull/12#discussion_r4439243931): on canvas backing-size change while paused/reduced-motion, schedule exactly one draw at frozen time. Test landscape→portrait without play/resume and assert visible nonblank frame.
- [ ] [Non-slider uniform defaults](https://github.com/MelodicBloom/shader-gallery/pull/12#discussion_r4439243936): initialize authored baseColor/tint/orientation defaults even when not present as sliders, using a typed defaults application like the original gallery. Red test selects Pearl Sheen, Celestial Veil and Liquid Crystal; shader uniforms must equal metadata defaults rather than zero initialization.
- [ ] Verify legacy manifest count against **current main**, not the original PR's 15-specimen historical snapshot; keep Precious Opal separate from older flat Opal Core and Optical Studio opal-fire. Maintain event replay and renderer-independent state contracts; avoid claiming Unreal graph export or measured opal.
- [ ] Run from material-atlas in its actual source directory: node --test tests/core.test.mjs; node tests/shader.test.mjs (requires native EGL/GLES); browser touch/resize/keyboard QA; capture sphere/cabochon/crystal under fixed lights/poses; negative uniform tests and git diff --check. If archive/manifest changes, run package parity checks.

**Accept:** three repaired review findings with failing-then-passing tests; explicit historical-to-current manifest reconciliation; visible six-view witness plus source/pixel hashes; independent 3D pilot remains review-only.

## Task 4 — #8 Shader Grammar v0.1 import: fix path defect, resolve authority and merge conflict

**Files:** packages/shader-grammar/scripts/validate.mjs, packages/shader-grammar/qa/test.mjs, packages/shader-grammar/HANDOFF.md, provenance/v0.1-manifest.json; do not modify qt314wink/shader-grammar automatically.

- [ ] [Validator path finding](https://github.com/MelodicBloom/shader-gallery/pull/8#discussion_r4439243306): replace URL.pathname file-path derivation with Node fileURLToPath(import.meta.url). Add failing test from a checkout/work directory containing spaces and Unicode, expecting same 12-specimen validation result as ordinary path; ensure Windows/WSL path semantics are not assumed interchangeable.
- [ ] Compare exact hash of its 28 preserved prototype files and schema/validator corpus to canonical qt314wink/shader-grammar. Record intentionally immutable snapshot vs drift; don't declare the gallery copy an independent semantic authority.
- [ ] Reconcile MelodicBloom/.github [registry attestation #22](https://github.com/MelodicBloom/.github/pull/22), currently draft; and Shader Gallery [#46](https://github.com/MelodicBloom/shader-gallery/pull/46), stacked on #8. Proposed owner choice: (A) maintain a versioned historical imported snapshot as read-only dependency; or (B) replace vendored governance with reference/consumer adapter while preserving the 28-file audit as provenance. Do not choose or delete the import silently.
- [ ] Isolate the GitHub merge-conflict list and identify whether main's existing library paths/README conflict; preserve both source identities. Run (cd packages/shader-grammar && npm run validate && npm test); (cd packages/shader-grammar/qa && npm ci && npm test && npm run check); source hash diff and CI matrix. All commands are on PR branch, not repository root.
- [ ] Open a review note/decision, or a narrowly scoped repair draft if the original PR cannot be updated safely; no ownership attestation merge.

**Accept:** path-with-spaces regression passes, existing strict corpus/negative fixtures survive, conflict resolution proposal keeps a single canonical semantic authority and an immutable lineage receipt.

## Task 5 — #19 GEO-TILE-001: extract original generator and fix normal-gradient scale

**Files:** material-validation-lab/experiments/GEO-TILE-001/generate_maps.py, test_generate_maps.py, README.md, INSTAMAT_RECIPE.md, TRIAL_TEMPLATE.json; relevant .agents/skill. Historical Lab/ZIP files are in its old diff: handle as upstream conflict, **not** automatically replay.

- [ ] Review [registry packaging thread](https://github.com/MelodicBloom/shader-gallery/pull/19#discussion_r4439244674) and [bounds checking thread](https://github.com/MelodicBloom/shader-gallery/pull/19#discussion_r4439244682). Current main's package-local Lab validator uses root/material-validation-lab and includes scalar/array finite bounds. Re-run the original negative extracted-archive/default-mutant cases on main; if green, respond "fixed upstream in merged PR #18" with exact tests and **remove stale Lab files from the proposed GEO-TILE content diff** rather than copying older versions over main. If not green, raise a separate canonical Lab fix; no local duplicate validators.
- [ ] [Normal gradient thread](https://github.com/MelodicBloom/shader-gallery/pull/19#discussion_r4439244677): current finite differences shrink when --size increases. Introduce proper UV texel-spacing normalization for height derivatives and a resolution-independent strength parameter. Red test compares same UV coordinates at sizes 256/512/1024 with same tiles/seed/wear and asserts normals within documented quantization tolerance instead of systematically flattening. Verify normal-Y convention and explicit orientation.
- [ ] Reproducibility: same seed/params/size yields byte-identical PNGs and SHA-256 receipt; changing seed changes output; invalid size/bounds fail predictably; 16-bit height metadata preserved.
- [ ] Compare existing [#45 GEO-TILE browser host](https://github.com/MelodicBloom/shader-gallery/pull/45), stacked on #19. When normal generation changes, regenerate each preview plus its source-bound hashes, update #45 only after coordinating owner and branch; never claim prior deployment hashes still describe new maps. Native InstaMAT graph and material fidelity remain unverified.
- [ ] CLI from material-validation-lab/experiments/GEO-TILE-001: python3 -m unittest discover -s . -p 'test_*.py' -v; python3 generate_maps.py --size 256 --tiles 6 --seed 42 --output <verified scratch directory>; generate 512/1024 scratch outputs with same parameters; inspect normal-map consistency; validate material-lab package and source archive on rebased candidate; git diff --check.
- [ ] Because the old PR is mergeable=false and brings 20 files including merged-Lab snapshots, propose a *content-limited repair branch* that imports GEO-TILE generator/tests/docs/skill only, with provenance to original PR and clean current-main base; obtain owner approval before retargeting/cherry-picking or abandoning original branch.

**Accept:** constant-scale normals across sizes, deterministic receipts and re-generated map proofs; upstream Lab regressions remain intact; reviewable diff without reintroducing stale material records.

## Task 6 — #21 Wireframe Mandala: close visual and topology review without forced WebGL migration

**Files:** experiments/wireframe-mandala/core.mjs, index.html, tests/core.test.mjs, tests/browser-smoke.py, tools/run-evidence.mjs; docs/experiments/wireframe-mandala.md; .agents/skills/procedural-mandala-lab/SKILL.md.

- [ ] Review three already-resolved automated threads and verify their fixed behavior still exists. Run node --test experiments/wireframe-mandala/tests/*.test.mjs and node experiments/wireframe-mandala/tools/run-evidence.mjs --time 0 from repo root. Match archived seed 31415 and time-zero fingerprint when comparing the original head; do not claim same fingerprint after an intentional algorithm update without a versioned change receipt.
- [ ] Browser check: bounded controls, radial/nested geometry switching, pause/resume, seed/reset, invalid-input rejection, accessible labels, reduced motion, JSON and PNG exports. Named actual device/desktop/phone viewport captures and hashes.
- [ ] Review TouchDesigner tutorial source to check whether assumed operator topology is documented or only approximate. Record node chain differences and attribution; preserve the original Canvas2D algorithm as a valid independent specimen and do not force it to GLSL.
- [ ] Only promote generalized fold/geometry operators to Shader Grammar through a **separate** schema/owner decision and independent tests.

**Accept:** screenshots, deterministic receipt, source-fidelity limitations, keyboard/touch checks, a concise reviewer approval question. If device QA unavailable, mark unverified rather than promoting.

## Task 7 — #23 Noise Kaleidoscope: GPU, wedge seam and adapter acceptance

**Files:** experiments/noise-kaleidoscope-v0/contract.mjs, shader.frag.glsl, index.html, test.mjs, test-browser.py, touchdesigner/build_network.py and kaleidoscope_pixel.glsl; docs/evidence/noise-kaleidoscope-v0-evidence.md.

- [ ] Confirm prior two resolved review threads remain addressed. Run node --test experiments/noise-kaleidoscope-v0/test.mjs (5-case checked-in contract), then browser WebGL2 compilation, link and draw. Test symmetry invariance and seam continuity for N=3 through N=24 at fixed seed/time/palette; also test 2D aspect correction and source/viewport dimensions.
- [ ] Save two repeated screenshots + state receipts of identical fixed-time parameter vector; require matching pixel hashes **on the same declared renderer**. Compare neighboring wedge boundaries using a predeclared tolerance, not post-hoc adjustment.
- [ ] Exercise keyboard, invalid controls, reduced-motion, context loss/restoration, phone viewport and exported receipt. Keep browser software GPU vs named hardware evidence distinct.
- [ ] TouchDesigner: if available, build adapter via its documented script and verify GLSL TOP Info DAT and actual network state; else clearly mark TD unverified with exact missing environment. Do not claim cross-backend pixel parity just from contract similarity. Source attribution remains intact.
- [ ] Scope integration to standalone experiment route; do not alter stable shader library manifest or root Pages without separate acceptance.

**Accept:** independently replayable GLSL frame and route-level browser test, seam metrics, TD status, bounded visual critique. Keep draft until named human review.

## Task 8 — #24 Audio Kaleidoscopic Field: deterministic timeline and two-lane GPU proof

**Files:** experiments/kaleidoscopic-field-001/package.json, src/{app,audio,control,gl,shaders}.js, tests/*, fixtures/envelope-60fps.json, docs/EXPERIMENT-PROTOCOL.md, docs/parameter-schedule.json and existing evidence templates.

- [ ] Run from experiments/kaleidoscopic-field-001: npm run fixture; npm test; npm run check. Record deterministic WAV/envelope source hash (12 sec, 24 kHz and 720 frames expected on original head), and source SHA. Do not commit an automatically regenerated WAV into Git if .gitignore excludes it.
- [ ] On browser WebGL2, verify both flat field and point-cloud/3D-displacement views under identical input state. Capture frames 0,120,240,360,480,600,719 and metadata. Compare frame 360 after reset/replay on same hardware/browser; assert pixel hashes or documented tolerance and visible differences at three planned mode transitions.
- [ ] Playback behavior: original audio vs silent fallback is visibly labeled and receipt records the chosen transport; test play/pause, refused play, revoked permission, seeking, input replacement, untrusted file and 12-sec boundary. A recorded 720-frame authored envelope is not evidence of actual live audio reactivity until live import events update the rendering.
- [ ] Measure p50/p95 frame times, dropped-frame fraction and view-specific counts on a **named** device. Never say "60fps" because the timeline has 60 fps worth of samples. No headset, XR, GPU or TD parity claim without corresponding hardware/test.
- [ ] TouchDesigner: inspect documented operator mapping and create a parity matrix with explicit deviations; optional actual .toe smoke requires TouchDesigner availability and declared version. The separate #23 noise kaleidoscope is an independent mechanism; reuse only explicitly versioned symmetry operators, not scene state or shaders by assumption.

**Accept:** 720-frame schedule and two-lane snapshots demonstrably repeatable under named environment, actual GPU draw checks, honest audio/TD limitations, review-ready draft with metrics if available.

---

## Integration, compatibility and owner decision ledger

| Relationship | Proposed default | What could authorize change |
| --- | --- | --- |
| #8 Shader Grammar ↔ canonical qt314wink/shader-grammar | Read-only versioned consumer or frozen historical snapshot; never a new authority | Owner approves registry attestation and exact version/schema compatibility |
| #31 Khronos Abalone ↔ #13 Optical Studio / #40 portfolio runtime | Separate reference/PBR vs authored WebGL2 proxy lanes | Controlled validation and explicit adapter mapping of actual units/functions; never same-name-only controls |
| #12 Precious Opal ↔ #13 opal-fire / original Opal Core | Keep three specimens and label model differences | Named visual comparisons and source contracts; no forced dedup |
| #19 GEO-TILE ↔ #45 browser maps / Material Validation Lab | Content-limited original generator; derive browser map previews with SHA pins | Current-main validator re-test, map regeneration and reference provenance |
| #21 Canvas mandala ↔ #23 noise ↔ #24 audio field | Three independent motion mechanisms with optional operator reuse | Replayable shared operator, tests, typed adapter and owner-specified integration |
| #31 / #19 generated assets ↔ #28 preview provenance issue | Bound every generated PNG to source digest, tool version, order and artifact SHA | Deterministic rebuild and manifest/receipt parity, not aesthetic resemblance |
| PR #49 handoff ↔ research PRs | Documentation-only continuity, no hidden behavior or merge implication | Each PR retains its own evidence and owner gate |

## Execution order / concurrency

**Wave A — review-comment repair, no shared-base mutation:** #31, #13, #12. Assign separate agents/worktrees; tests and review replies per original PR.

**Wave B — branch-source reconciliation:** #8 and #19. These are **mergeable=false**; first produce conflict inventories and propose only content-scoped repairs. Avoid parallel edits to main Lab registry, source ZIP, shared shader manifest or canonical ontology.

**Wave C — standalone visual acceptance:** #21, #23, #24, in this order for increasing mechanism complexity (2D deterministic geometry → WebGL symmetry field → audio/timeline and dual-view). Can run concurrently for source-only QA, but reserve named hardware and TouchDesigner sessions so controls/receipts remain comparable.

**Wave D — human portfolio/release review:** PRs #30, #31, #13, #12 and #44/#47/#48 are separate approval decisions. Only after a named owner approves each set of scope, evidence, license, regression, visual behavior and deployment audience may Grokbot ask for merge/deploy instructions.

## Universal next-agent receipt (one per PR)

1. Task ID, PR #, source branch, exact initial/final SHA, main SHA, merge-base and source drift.
2. Reviewer comment URL(s), original reproducible symptom, failing test command/exit, repaired commit, passing test command/exit, and comment response URL.
3. File inventory and generator input/output hashes. If generated, include source commit, parameters, processing version and ordering.
4. CI/workflow run URL with status, plus explicit not-run/blocked tests and reason. Render URL and access restriction, never assume 200 means GPU proof.
5. For visual work: renderer/GPU, browser/device, viewport/DPR, reduced-motion/context-loss/pause, control preset, screenshot/recording SHA and named reviewer observations.
6. Evidence claims and non-claims, unresolved uncertainty and owner decisions; rollback method and independent-specimen preservation.
7. Distinguish APPROVED FOR REVIEW from READY TO MERGE and from DEPLOYED/ACCEPTED. Do not conflate them.

## Copy/paste Grokbot orchestration instruction

> Read this entire plan and the existing PR #49 continuity document. Start with a read-only eight-PR review-thread, CI and branch reconciliation at their current GitHub heads. Build an issue matrix with exact URLs and avoid replaying upstream-fixed findings. Then advance one bounded task at a time: #31 receipt integrity, #13 Optical Studio lifecycle/illumination, #12 Opal interaction/defaults, #8 canonical grammar/path conflict, #19 GEO-TILE scale/upstream-Lab conflict, #21 mandala visual proof, #23 noise GPU/replay, #24 audio/timeline GPU proof. You may make tightly scoped, independently tested corrections on each owned working branch and prepare/update draft review PRs, but no merges, public deployments, claim promotion, history rewrite, force pushes, schema authority changes or production shader edits. Keep one output receipt per PR. If a test or access gate is blocked, record it and continue only on an independent, unblocked workstream. Return a prioritized human review queue, exact evidence links, and approval requests.

## Unresolved user-facing decisions

- #8: historical immutable import retained vs reference-only adapter to canonical Shader Grammar. No automatic choice.
- #31: governance rule for packaged record's historical fail vs latest receipt inconclusive, and whether/when the owner wants G0 #30 merged before G1 retarget. No silent promotion.
- #13: whether standalone Optical Studio may later link from the public gallery; external attribution and separate shader lineage remain intact.
- #19: permission for a new content-limited repair branch replacing the conflict-heavy stale original PR, while preserving original branch history.
- #21/#23/#24: whether actual TouchDesigner parity is a release requirement or explicitly excluded from an initial independent-browser demo release.
- All: named devices/browser/GPUs for acceptance, exact public vs authenticated preview audience, and owner merge/deploy authorization.

**This plan does not assert a test or repair has been completed. Its dated observations must be refreshed at task start.**
