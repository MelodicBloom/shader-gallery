# Optical Studio v1.2 — experimental WebGL2 optical laboratory

The seven-study viewer is self-contained. Download [index.html](index.html) and open it in a WebGL2-capable browser; no npm, server or external textures are required.

This folder is an **additive laboratory**. It does not replace the root `abalone/` runtime or change the project's existing shader gallery, schema, build or deployment pipeline. The separate `feat/optical-studio-v1.2-abalone-lab` branch intentionally preserves that boundary.

## Contents

- `index.html`: the complete single-file viewer with seven GLSL ES 3.00 studies and embedded GPU-generated previews.
- `shaders/<slug>/shader.glsl`: extracted GLSL sources matching the embedded viewer.
- `shaders/<slug>/meta.json`: derived uniform/slider contracts from the viewer. Their optical model-boundary entries are **supplementary and not a replacement for the original full metadata** from the packaged source archive.
- `shaders/<slug>/preview.png`: embedded GPU fallback preview unpacked from the viewer.
- `shader-manifest.json`: supplied v1.2 source hashes.
- `QUALITY_GATES.md`: supplied QA record and open gates.
- `ROADMAP_NACRE_HDR.md`: bounded evidence → calibrated spectral model → spatial HDR bloom plan.

The companion full source/QA ZIP delivered with this release contains `tools/build_viewer.py`, `tools/verify_render.py`, `tools/verify_interface.py`, original metadata files and the detailed GPU report. Those are not mirrored here in this initial isolated publication; don't assume every command in the QA record is executable from this folder alone.

## Evidence and limitations

The v1.2 release was previously checked with Mesa OpenGL ES 3.2 compilation/draw/readback and controlled browser DOM tests. Full interactive WebGL2 on target devices, actual Android GPU frame-time testing, quantitative nacre sample calibration and multi-pass HDR bloom are **not yet demonstrated**. Existing local glow is not spatial bloom. Current layer colors are authored approximations. Keep experimental status until provenance and acceptance gates pass.

## Next integration

Review this lab independently, then adopt its validated Abalone Inner Fire mechanisms into the existing `abalone/` portfolio implementation through a separate PR. Do not overwrite material shader code or publish physical accuracy claims just because this standalone viewer runs.
