# ADR-001: Keep Shader Library v1 on npm in this integration branch

**Status:** Accepted for `feature/federated-evidence-graph`  
**Date:** 22 September 2026

## Context

The repository has no root `package.json` and is not currently a pnpm workspace. The executable package is isolated under `packages/shader-library-v1/source/`, where its scripts and GitHub Actions use npm. The evidence-graph integration adds Python standard-library tooling, schemas, documentation, and static HTML; it does not require JavaScript dependencies.

Running `/pnpm-upgrade` now would be a **package-manager migration**, not an upgrade. It would require a root workspace contract, lockfile migration, CI changes, cache policy, release verification, and a decision about the open shader-grammar pull request. Mixing that change with the evidence-graph integration would reduce reviewability and make rollback harder.

## Decision

Keep the existing npm commands and workflows unchanged in this branch. Prepare pnpm adoption as a separate `chore/pnpm-workspace` branch after the evidence-graph change lands or is reviewed.

The follow-up branch must:

1. Define the intended workspace members.
2. Run the pnpm release and `pnpm/action-setup` preflight.
3. Add an exact `packageManager` integrity string.
4. Generate and review `pnpm-lock.yaml`.
5. Pin `pnpm/action-setup` to an immutable commit SHA.
6. Re-run metadata, native-validator, shader, live-preview, and docs checks.
7. Demonstrate no change to package publication contents.

## Consequences

- This branch remains small and does not alter runtime dependency resolution.
- `/pnpm-upgrade` is intentionally **not applicable yet** because no pnpm toolchain exists in the canonical repository.
- The next package-manager change has a clear, separately reviewable scope.
