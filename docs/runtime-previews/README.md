# Independent branch runtime previews

This directory records isolated Shader Gallery demos as of 2026-11-06. The registry pins each source commit, app entry, deployment ID and build recipe. Opening a preview currently requires Vercel authentication. The default public GitHub Pages site remains a separate publication.

## What is established

Vercel builds and authenticated HTTP page probes are recorded per entry. Representative JS, GLSL, generated map and Three.js files also returned HTTP 200 with appropriate content types. GEO-TILE's deployed generation receipt and map hashes equal the local stdlib generator output. Kaleidoscopic Field's build generates the missing 720-frame / 576044-byte WAV fixture. The Abalone reference build downloads its pinned GLB with SHA-256 verification and stages local Three.js files outside excluded node_modules.

Browser interaction checks encountered Vercel authentication even with an expiring share link. Successful shader draws, controls, audio playback, mobile layout and device behavior remain pending. No calibration, fidelity, performance, material certification or production approval is inferred from READY or HTTP 200.

## Refresh one demo

```sh
node tools/deploy-branch-preview.mjs optical-studio
```

The default prints a request for the pinned source. Pass that request to the authenticated Vercel `create_deployment` operation. To intentionally resolve the current branch head, add `--latest`. A caller with an existing Vercel token may use `--deploy`; the token is never recorded in the registry or output. Verify the returned deployment ID reaches READY, then check the exact entry and its assets. The known project/team are explicit; the tool never promotes production.

Automatic redeployment on Git pushes has **not** been configured by this work. For continuous previews, connect a dedicated demo project to the Git repository and adopt a branch-aware build recipe from this registry; do not assume one fixed monorepo root builds every app. Static demos need repository-root assets, Vite demos need their own package lock and dist output, and the reference lane additionally stages Three.js and the pinned model.

## Production procedure

1. Choose the particular source SHA and intended public audience.
2. Confirm root/deep-link reloads, CSS/JS/GLSL/model/audio delivery, visible draw, one meaningful control, and the existing study-specific acceptance gates in a GPU-capable browser. Keep fallback and non-claim labels.
3. Publish that reviewed version to a dedicated stable production domain. A public demo may remain labeled experimental; publishing it does not complete material validation.
4. Retain the previous deployment ID and source ref for rollback. Refresh the registry with the new evidence and source SHA.

## Branch classification

- Runtime families get their own preview: optical studies/studio, material atlas, Abalone portfolio/nacre/reverse orbit, Benthic OS/R3F, noise/field/mandala experiments, the original/context-recycling library, and the root landing.
- The new GEO-TILE and Shader Grammar consumer hosts are additive branches stacked on their original implementation branches. Their original generator/function are unchanged.
- `feat/dispersion-instrument-0.1` and `feat/radial-field-bloom-webgl2` have runtime subtrees identical to current main. `fix/pr15-reconciliation` and `feat/optical-studies-02` share current main's optical-studies HTML. They do not require a new renderer.
- Documentation, provenance, lineage, research and CI branches inherit an existing runtime. PRs #41/#42/#43/#44 are plans or maps; these previews do not imply their proposed shader changes or SVG ports have been implemented.
- The federated evidence workbench is already a main route under `docs/ecosystem/`. A graph backend is not fabricated for static UI previews.

Rollback of this publication support consists of removing this directory and `tools/deploy-branch-preview.mjs`. Preview deployments are independent of main and of one another.

Source review: [GEO-TILE browser host, PR #45](https://github.com/MelodicBloom/shader-gallery/pull/45); [Shader Grammar example host, PR #46](https://github.com/MelodicBloom/shader-gallery/pull/46). The [full branch inventory](branch-inventory.json) records inherited and plan-only branches without calling them separate completed implementations.
