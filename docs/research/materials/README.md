# Material Research Ledger

This directory is the durable research entry point for `shader-gallery` material work. It exists so a future contributor can recover **what was found, what it may be used for, what was rejected, and what still must be proven** without reconstructing a chat history.

## Read in this order

1. [`SOURCE_CATALOG.json`](SOURCE_CATALOG.json) — machine-readable source identity, license disposition, freshness, evidence grade, and permitted scope.
2. [`PATTERN_CARDS.md`](PATTERN_CARDS.md) — reusable decisions that survived cross-checking.
3. [`../../case-studies/VMA-001/BASELINE_AUDIT.md`](../../case-studies/VMA-001/BASELINE_AUDIT.md) — the Abalone authority boundary and branch reconciliation.
4. [`../../case-studies/VMA-001/CONTROL_CROSSWALK.md`](../../case-studies/VMA-001/CONTROL_CROSSWALK.md) — why similarly named Abalone controls are not interchangeable.
5. `packages/shader-library-v1/source/material-validation-lab/` — canonical trial records and validators.

## Evidence vocabulary

| Grade | Meaning here |
|---|---|
| E0 | Local reproducible artifact with a receipt. |
| E1 | Executed implementation or measurement with raw receipt. |
| E2 | Direct, dated primary source retrieved at the recorded locator. |
| E3 | Named prior research or derivative summary; preserve it, but do not treat it as independent proof. |
| E4 | Design proposal or untested mechanism. |
| E5 | Contradicted, unsupported, or deliberately excluded. |

A candidate's license or public visibility does **not** grant permission to import it without an exact revision, license check, and trial-specific attribution. Floating `main` URLs are discovery locators only. A trial must pin a commit plus any downloaded-file SHA-256 before it can claim reuse.

## Current decision

The gallery retains its existing fullscreen WebGL2/GLSL ES 3.00 runtime. An isolated, version-pinned Three.js reference lane is the proposed method for the Khronos Abalone comparison; it is not an approved migration to React Three Fiber, Drei, a path tracer, or a global dependency change.

The first registered pilots remain:

1. `MVT-ABALONE-001` — reference asset / map semantics.
2. `MVT-BUBBLE-001` — bounded thin-film mechanism adaptation.
3. `MVT-GOLD-001` — original deterministic procedural field.

## Maintenance rule

When a source is used, update the relevant material record with its resolved commit, file hash, attribution, and receipt. When a source is merely researched, update this catalog instead. Do not put an unexecuted source into an implementation record just because it is aesthetically promising; that is how a reference list becomes a very elegant rumor.
