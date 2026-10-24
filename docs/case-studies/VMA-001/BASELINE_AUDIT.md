# VMA-001 — G0 Abalone Authority Reconciliation

**Task:** `VMA-001-G0-01`  
**Observed:** 2026-10-24 UTC  
**Decision state:** reconciliation complete; the reference-material trial remains **planned**.

## Decision summary

The Material Validation Lab on `main` is the canonical evidence contract for a future Khronos Abalone trial. It does not yet contain the Khronos GLB, a pinned external revision, a Three.js adapter, or visual-pass evidence. The existing Optical Studio and portfolio-runtime Abalone work are useful, separate appearance studies; neither can supply the missing reference-asset evidence or be silently treated as the Lab baseline.

This G0 change deliberately chooses a source-and-contract audit over an implementation jump. It preserves three distinct rendering contexts, makes their incompatible control meanings visible, and leaves asset acquisition, trial execution, and runtime adoption for a separately authorized G1.

## Evidence-bound identity

| Field | Verified value | Evidence |
|---|---|---|
| Repository | `MelodicBloom/shader-gallery` | local checkout and GitHub repository |
| Dispatch | [Issue #25](https://github.com/MelodicBloom/shader-gallery/issues/25) | live issue, read 2026-10-24 |
| Canonical Lab baseline | `main` at `f9bebc950864d83e6748f97cd4b2319f0a965c98` | merged [PR #18](https://github.com/MelodicBloom/shader-gallery/pull/18) |
| G0 branch | `codex/vma001-g0-abalone` from that `main` SHA | local branch creation receipt |
| Lab record | `MVT-ABALONE-001`, status `planned` | `packages/shader-library-v1/source/material-validation-lab/materials/abalone-baseline.record.json` |
| Optical Studio candidate | [PR #13](https://github.com/MelodicBloom/shader-gallery/pull/13), open draft, head `bc84ebc6b13d2d5d1d1dacdfdef5c526ac8597d7` | GitHub PR metadata; it does not descend from current `main` |
| Portfolio runtime candidate | `feature/issue-11-abalone-runtime` at `089326c`; [PR #14](https://github.com/MelodicBloom/shader-gallery/pull/14) merged into this branch at `bf694970248a2e4d9a21e8e6cd55ac10d96b2afe` | Git history and GitHub PR metadata; it is not in `main` |
| External source | Khronos `IridescenceAbalone` at a **revision to pin** | registry and record intentionally retain `TO_PIN`; no external binary was downloaded in G0 |

## Authority and precedence

1. `main` and the packaged Lab record/validator define the current repository contract.
2. The Khronos asset plus its license and a pinned revision define external reference-asset facts once G1 acquires and hashes them.
3. The glTF iridescence specification defines interchange semantics; it does not make a fullscreen proxy conformant.
4. A version-pinned Three.js reference adapter may evaluate the GLB. It is not an approved gallery dependency or migration.
5. Optical Studio and the portfolio runtime are separate experimental implementations. Their control contracts are evidence of design intent, not a compatibility layer.

## What changed since the dispatch was written

| Dispatch premise (2026-10-21) | Current observation | Consequence |
|---|---|---|
| PR #18 was open at `a330d21…` and proposed work should stack on it. | PR #18 merged on 2026-10-24 as `f9bebc…`. | G0 branches from `main`; no stacked-PR base is required. |
| `main` was `eaf122…`. | `main` is `f9bebc…`; it contains PR #18 and the existing Optical Studies/recovery work. | Historic SHA is preserved as context, not used as the base. |
| PR #15/#17 archive and bfcache work needed reconciliation. | PR #18's review repair documents these as complete; archive verification now reports 80 source files/19 manifest shaders. | No remediation task is reopened. Existing checks remain required. |
| PR #14 merge could be mistaken for a `main` merge. | It merged into `feature/issue-11-abalone-runtime`, whose current tip is `089326c`; its merge base with `main` is `7718a006…`. | Runtime evidence may be inspected but is not part of the deployed/main contract. |

## Architecture findings

### Observed facts

- The Lab packages source provenance, bounded controls, fixtures, negative controls, pass receipts, and a mutation-tested Node validator. A `pass` requires one-to-one pins and verified capture artifacts; the Abalone record is still `planned`.
- Shader Library v1 is a fullscreen GLSL ES 3.00/WebGL2 study library. It can provide compile/fallback conventions but cannot load a glTF PBR material unchanged.
- Optical Studio is a self-contained, seven-study WebGL2 laboratory on an open draft branch. Its checked-in folder explicitly says the original build/QA utilities remain in a separate release archive; G0 therefore cannot repeat those historical tests from the branch alone.
- The portfolio runtime is raw WebGL2 plus a Zustand vanilla store, not React/Three.js/R3F. Its six semantic material controls and its 3 × 3 paused camera/light matrix are independently bounded.

### Inferences, kept separate from facts

- A pinned Three.js lane is the lowest-risk way to inspect the Khronos GLB without changing the gallery stack. This is a recommendation, not an adopted dependency decision.
- The runtime's capture matrix is a potentially useful fixture vocabulary, but it is not evidence of Khronos map semantics or a substitute for Lab neutral/grazing/light-sweep receipts.
- The two authored proxies could later inform artistic controls only after G1 separates measured/reference facts from their visual approximations.

## Conflicts and non-transfers

| Conflict | Why it matters | G0 disposition |
|---|---|---|
| GLB PBR material versus fullscreen GLSL proxy | glTF texture channels, BRDF and scene/IBL assumptions do not map mechanically to a ray-marched/fullscreen appearance shader. | Maintain two lanes; do not copy parameters between them. |
| Optical Studio's `spectral` range `[0, 2]` versus runtime `[0, 1]` | Same name does not establish same response curve or energy meaning. | No numeric translation. |
| `layerDepth` versus `layerSpacing` | Both sound lamellar but one is an authored buried-layer separation and the other is runtime layer frequency/spacing. | Treat as different controls. |
| “Historical QA” versus G0 execution | Archived/branch documentation describes prior tests; it is not a fresh result. | Record it as historical only; do not promote it. |
| CC BY 4.0 asset reference | Attribution and exact asset identity remain required even if only map semantics are used. | Preserve attribution; no asset is incorporated in G0. |

## Validation receipt

From this G0 branch against `main@f9bebc…`:

| Command | Result | Scope |
|---|---|---|
| `node packages/shader-library-v1/source/tools/verify-source-archive.mjs` | pass — 80 source files / 19 shaders | archive parity |
| `node packages/shader-library-v1/source/tools/validate-material-lab.mjs` | pass — 3 records valid | Lab schema/provenance |
| `node packages/shader-library-v1/source/tools/test-validate-material-lab.mjs` | pass | mutation gates, including extracted package |
| `git diff --check` before G0 edits | pass | baseline whitespace |
| `npm ci` in isolated runtime worktree at `089326c` | pass | dependency installation only |
| `npm run check` in isolated runtime worktree | pass | TypeScript |
| `npm run build` in isolated runtime worktree | pass | Vite production build |
| `npm run test` in isolated runtime worktree | **blocked** | host forbids tsx's Unix-socket IPC: `EPERM … /tmp/tsx-0/17.pipe`; no code diagnosis or pass claim made |

No WebGL2 browser, GPU, mobile FPS, pixel comparison, external-asset download, shader compile, or visual material claim was performed in G0.

## G1 entry gate (not executed)

G1 may begin only after a reviewer accepts this audit and authorizes source acquisition. Its minimum input receipt is: exact Khronos source commit; GLB URL and SHA-256; license/attribution text; pinned Three.js package version and lockfile; browser/renderer/GPU; neutral, grazing, and light-sweep artifact paths/hashes; explicit human review outcome. A failed license, hash, map-channel, or controlled-view check stops the trial rather than converting a proxy into a “pass.”
