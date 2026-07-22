# Shader Library v1 — Review and Integration Gates

## Current state

The package is isolated under `packages/shader-library-v1/`. Existing root-level gallery files, shader folders, documentation, and GitHub Pages deployment remain unchanged.

## Gate 1 — Review this pull request

Confirm that the package archive and documentation are acceptable as an additive repository asset.

## Gate 2 — Merge the isolated package only

Merging this pull request adds the package directory without changing the live gallery or deployment behavior.

## Gate 3 — Extract source in a separate pull request

After the isolated package is merged, create a second branch that extracts the source archive into `packages/shader-library-v1/source/`. Do not move files to the repository root during that step.

## Gate 4 — Activate package-scoped CI

Add a dedicated workflow that runs only when `packages/shader-library-v1/**` changes. It should:

1. use Node.js 20;
2. install EGL/GLES compiler dependencies;
3. run metadata validation;
4. compile, link, and render all 15 WebGL2 shaders;
5. build the deterministic gallery;
6. upload the generated gallery as a workflow artifact.

## Gate 5 — Preview before integration

Publish the package gallery to a branch preview or artifact. Compare all shader previews against the validation contact sheet before connecting it to the existing root gallery.

## Gate 6 — Root integration requires a third pull request

Only after package CI and visual review pass should the existing gallery consume the new manifest or runtime. Root files must not be replaced wholesale.
