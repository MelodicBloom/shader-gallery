# Shader Library v1 — Review and Integration Gates

## Current state

The package is isolated under `packages/shader-library-v1/`. Existing root-level gallery files, shader folders, documentation, and GitHub Pages deployment remain unchanged.

## Reconciliation gate — Keep the distributable package truthful

The extracted source and package-scoped CI are already active. Before this branch can merge, the distributable archive must contain exactly the same source files and all 18 manifest shaders. The package CI enforces that parity before native compilation.

## Gate 1 — Merge the isolated package only

Merging this pull request adds or updates the package directory without changing the live gallery or deployment behavior.

## Gate 2 — Preview before integration

Publish the package gallery to a branch preview or artifact. Compare all shader previews against the validation contact sheet before connecting it to the existing root gallery.

## Gate 3 — Root integration requires a separate pull request

Only after package CI and visual review pass should the existing gallery consume the new manifest or runtime. Root files must not be replaced wholesale.
