# Shader Grammar: canonical package

The project owner designated `MelodicBloom/shader-gallery`, at `packages/shader-grammar/`, as the canonical home on 2026-09-09 in the Shader Grammar governance task. This is the authority decision for the grammar. AETHER remains a downstream consumer; it does not own these normative schemas.

## Baseline

The 28 original v0.1 files were imported unchanged from the preserved handoff. `provenance/v0.1-manifest.json` lists their original SHA-256 values and byte sizes. The original source archive hash is `c9ce9719372f3bf8c63b4e974ccf15df7989cc1aa3dce51ee628239b0cfd4742`.

The local preservation repository commit was `7c4f535359aefbfe80261c262ed789d2936cf387`. Source build task: `01a05854-dcb5-7f70-be60-a3fc998d3349`. Conversation reference: `6a94f770-e384-83ea-9918-1154a910b842`.

`HANDOFF.md` and the original validation matrix are historical snapshots. Their statements about unresolved repository ownership describe the state before this designation. This document supersedes those statements only for repository ownership and package location.

## Maturity and release policy

The baseline tag `shader-grammar-v0.1.0-prototype` identifies the unchanged ontology prototype. It is not a production renderer release. The first commit imports the baseline; a separate commit adds QA tooling and package-scoped CI. New semantics, type corrections and corpus changes belong to a subsequent version, with migration and conformance evidence.

There is no reference renderer or compiled GLSL/WGSL backend in this package. A passing structural validator is not evidence of visual fidelity, correct physical modeling, or GPU performance. The historical reuse count measures catalog occurrence, not executable graph semantics.

The owning repository is MelodicBloom/shader-gallery; human reviewer assignment remains with the repository maintainer. No individual or team has been assigned by implication. Package-specific licensing has not been resolved: the original package has no LICENSE file. The gallery README's MIT statement and the sibling shader-library license do not establish a separate provenance review for this imported material. No new license is assigned by this intake.

## Verification

Run `node scripts/validate.mjs --strict` from this directory. Verify imported file hashes against `provenance/v0.1-manifest.json`. The separate QA commit supplies a reproducible independent gate, fixtures and benchmark comparison.
