# VMA-001 | GitHub continuity, review order, and next-agent handoff
**Observed:** 2026-11-08 (America/New_York)  
**Scope:** status reconstruction, review planning and evidence-bound handoff; **documentation only**.  
**Status of this document:** proposed for review. No runtime behavior, material claim, deployment, merge, or testing is performed by writing it.

## Executive decision

Do **not** relaunch G0 or acquire a duplicate G1 Khronos reference. The material-lab infrastructure is already merged, the G0 authority reconciliation has a completed execution receipt, and G1's bounded Three.js reference experiment already exists. The next work is a review-and-integration gate: review #30, reconcile #31 against current main, and collect named hardware-GPU visual acceptance without rewriting any prior measured failures.

This document is a continuity index, not a second source of material truth. The authoritative validation contracts remain in the existing Material Validation Lab; Shader Grammar owns canonical optical semantics.

## Live GitHub observations (verify again when executing)

| Object | Observation on 2026-11-08 | Decision boundary |
| --- | --- | --- |
| Repository main | Current comparison base observed at 8b73c4e3e89abedcc33fde82902eafc8f1d7e553 | This is an observation, **not** a frozen future ref. |
| [PR #18](https://github.com/MelodicBloom/shader-gallery/pull/18) | Material Validation Lab **merged** 2026-10-24; packaged records and validators live on main | Do not restart Lab scaffolding. |
| [Issue #25](https://github.com/MelodicBloom/shader-gallery/issues/25) | Still open; [G0 completion receipt](https://github.com/MelodicBloom/shader-gallery/issues/25#issuecomment-6390872890) exists | Separate task completion from issue closure and PR merge. |
| [PR #30](https://github.com/MelodicBloom/shader-gallery/pull/30) | Open **draft**; head 8615744466e8682af97ae2d9166c05e9803df4f6; compare against main: **1 ahead / 35 behind**, 9 files | Review G0 research/catalog, registry, source ZIP; hosted Shader Library v1 CI reports success, no submitted human reviews found. |
| [PR #31](https://github.com/MelodicBloom/shader-gallery/pull/31) | Open **draft**; head b21f2972b7c1e8662a21aa925082974c8a272a42; targets already-merged feat/material-validation-lab-v0; compare against main: **20 ahead / 37 behind**, 104 changed files | Preserve evidence history; target/base and artifact handling need review. Hosted Shader Library CI reports success, not equivalent to human GPU acceptance. |
| [Issue #35](https://github.com/MelodicBloom/shader-gallery/issues/35) | Open; original G1 instructions describe acquisition as future work, while #31 already acquired and ran it | Reconcile issue with existing #31 evidence, not another trial branch. |
| [PR #13](https://github.com/MelodicBloom/shader-gallery/pull/13) | Standalone Optical Studio remains open draft | Its authored Abalone appearance proxy is not the Khronos reference lane. |
| [PR #40](https://github.com/MelodicBloom/shader-gallery/pull/40) | Portfolio-runtime integration open | Separate reverse-orbit, N·L and device visual gates; no implicit merge. |
| [PR #44](https://github.com/MelodicBloom/shader-gallery/pull/44) | SVG↔GLSL grain draft; reported hosted grain acceptance, native regression, gallery preview jobs pass on exact PR evidence revision | Human visual review pending; do not extend lighting/glass without a separate decision. |
| [PR #47](https://github.com/MelodicBloom/shader-gallery/pull/47) | Draft demo index, 17 preview URLs returned authenticated HTTP 200 | URLs loading ≠ GPU interaction or unprotected public production. |
| [PR #48](https://github.com/MelodicBloom/shader-gallery/pull/48) | Draft static-fallback correction; targeted hosted CI/browser fallback checks reported passing | Public deployment and hardware browser recheck remain separate. |

## G0 and G1 evidence are different outcomes

- **G0 engineering work:** execution receipt completed, then G0 docs/catalog delivered in **unmerged** draft #30. Archive validation, Lab validation and mutation checks were reported passing in the G0 receipt; isolated portfolio runtime npm install, TypeScript check and build passed; tsx runtime test was **blocked** by host IPC EPERM. No G0 merge is implied by the receipt.
- **G1 reference lane:** Khronos IridescenceAbalone commit 4995a638c96dbc94376d3d6164e70fee3ac7f7a2, GLB SHA-256 d15ab000d3b04f177e101b2a36aacbf1c99490fc9bfe3868d481d75736946bab, Three.js 0.186.1, with CC BY 4.0 attribution requirements and isolated assets/captures in #31.
- **Recorded historical failure must remain visible:** run 3 authored-shell synthetic R/G criterion **failed** under SwiftShader. Subsequent flat-plane and shell sensitivity/metalness variant checks passed their pre-registered thresholds, supporting hypotheses about fixture/material compression, **not** erasing run 3.
- **Current label discrepancy is a review item, not an invitation to promote:** #31's reference/abalone/receipts/receipt.json reports label **inconclusive** and human review **pending**, while its packaged abalone-baseline.record.json has status **fail** and an older resultSummary that still describes synthetic experiments as outstanding. Preserve the historically measured failure and audit the status contract before changing either record.
- **Unresolved:** C-07 thickness default vs asset-authored 600–800 nm, C-09 fixture/material sensitivity interpretation, pin-drift between issue #35's discovery revisions and #31's actual acquisition, named physical-GPU visual review, image/artifact policy and current-main integration.
- **Not claimed:** calibrated nacre/abalone optics, Khronos conformance, real-device FPS, mobile optimization, source-asset originality, shader production promotion, or production deployment.

## Smallest safe advancement tranche

**A. Read-only review now (no code edits):**
1. Refresh main, #30, #31, and PR #13/#40 refs; record full SHAs, merge bases, exact diffs and CI/reviews. Compare #30's nine files with today's main, especially README-related source-registry references and the generated source ZIP. Review that its research catalogue is usable and accurately attributes sources.
2. Review the #31 evidence chain: source commit, actual GLB hash, license, Three.js lockfile, all seven historical run entries, capture integrity, current record status vs receipt label, and changed-image inventory. Do **not** reinterpret shell fail as a pass.
3. Reconcile issue #35 to the existing G1 PR and pin-drift ledger. There must be only one accepted reference-lane source of evidence.
4. Present two owner decisions separately: **(1) may G0 doc packet #30 merge? (2) may #31 undergo integration/retarget and named hardware review?** No inferred authorization for either.

**B. After explicit owner approval of #30:**
5. Prefer a reversible, non-force workflow. Confirm #30 merge conflicts/CI against fresh main, then merge only with approval. If the source ZIP or registry conflicts with changes since its base, repair and rerun archive equality/material-lab mutation checks. Do not force-reset a branch to make it green.
6. Once G0 docs actually reach main, prepare #31 for review against main: inspect and record merge-base; merge current main **into** its branch if needed, resolve conflicts with the file owner, retarget its PR to main when appropriate. Do not force-push or erase prior run history. Human review must approve the reconciled diff before merge.

**C. Separate visual acceptance slice (not an automated promotion):**
7. On a named actual GPU/browser/device, run neutral/control, grazing, and light-sweep fixture views with explicit camera, light, exposure, renderer, browser and device identifiers. Compare treatment/control and isolated R/G behavior, keeping pre-registered thresholds unchanged. Capture screenshots or recordings and SHA-256 receipts, keyboard/reduced-motion/fallback observations, and a named reviewer decision.
8. Return **pass / fail / inconclusive / blocked** for each criterion with contrary evidence preserved. Do not certify material accuracy or device performance from the visual result.

## CLI preflight for a Codex or WSL handoff

Run in a real checkout with network access. On Codex Cloud, source the validated /workspace/.shader-env/activate.sh in each task shell **if it exists and has been verified**; on WSL use its own installed toolchain. Neither environment inherits another task's state.

~~~bash
set -euo pipefail
git status --short --branch
git remote -v

# This fetch is mandatory, not replaced by ls-remote or cached connector data.
git fetch --no-tags origin \
  refs/heads/main:refs/remotes/origin/main \
  refs/heads/codex/vma001-g0-abalone:refs/remotes/origin/codex/vma001-g0-abalone \
  refs/heads/feat/mvt-abalone-001:refs/remotes/origin/feat/mvt-abalone-001 \
  refs/heads/feat/material-validation-lab-v0:refs/remotes/origin/feat/material-validation-lab-v0

git rev-parse origin/main origin/codex/vma001-g0-abalone origin/feat/mvt-abalone-001
git merge-base origin/main origin/codex/vma001-g0-abalone
git merge-base origin/main origin/feat/mvt-abalone-001
git diff --stat origin/main...origin/codex/vma001-g0-abalone
git diff --stat origin/main...origin/feat/mvt-abalone-001
git diff --check
~~~

If Git fetch fails with the managed proxy: stop and record stderr, exact task/environment, sanitized proxy endpoint and exit code. Do not bypass the proxy, substitute cached refs, change credentials or pretend to have run current tests. Use a fresh WSL task if the environment remains inaccessible.

For a checked-out branch containing the relevant tools, run from repository root (command availability must be verified first):

~~~bash
node packages/shader-library-v1/source/tools/verify-source-archive.mjs
node packages/shader-library-v1/source/tools/validate-material-lab.mjs
node packages/shader-library-v1/source/tools/test-validate-material-lab.mjs
(cd packages/shader-library-v1/source && npm test)
git diff --check
~~~

For the **isolated** reference lane on #31 only:

~~~bash
cd material-validation-lab/reference/abalone
npm ci --include=dev
# Run only the documented, approved trial/diagnostic command.
# Do not overwrite historical receipts or perform new acquisition by default.
~~~

Do not run npm ci at the shader-gallery root; it has no root-level package manifest. Do not copy source into a different repository as a substitute for the live authority.

## Copyable agent handoff

> Task: VMA-001-REVIEW-2026-11-08. READ-ONLY first. Inspect this handoff, issues #25 and #35, PRs #18/#30/#31 and their current source/capture receipts. Refresh Git refs and record exact SHAs. Review #30 nine-file doc/ZIP/registry diff against current main, then inspect #31 104-file evidence/asset history, pin drift, old fail vs current inconclusive label, and missing human GPU review. Produce a reconciliation matrix with PASS/FAIL/BLOCKED/UNVERIFIED, a proposed conflict-safe sequence, exact commands/exits and one bounded next action. DO NOT merge, force-push, retarget, alter materials, overwrite receipts, deploy, or conduct a new trial. Surface decisions required of the owner separately. If Cloud proxy is unavailable, stop and return the receipts rather than guessing.

## Required completion receipt for next agent

- Date/time (with time zone), executor/host/OS/Node/browser/GPU; actual network status.
- Starting repository branch, clean/dirty state, main SHA, #30/#31 full head/base/merge-base SHAs, exact commands and exit codes.
- Files reviewed, license/pin/capture hashes actually checked, test outcomes or why not run.
- G0 owner decision pending/granted/declined; #31 integration and human visual decisions pending/granted/declined.
- Historical run-3 fail explicitly preserved; current inconclusive label and pending reviewer explicitly preserved.
- Proposal, actual changes if authorized, rollback path, GitHub links, and precise non-claims.

**No branch, material, issue, or PR state is changed by this document alone.** Update this handoff when newer evidence supersedes the observations above; never overwrite the original dated baselines.
