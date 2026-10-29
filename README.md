# 🌌 Shader Gallery

**▶ Live demo:** [https://melodicbloom.github.io/shader-gallery](https://melodicbloom.github.io/shader-gallery)

> Evidence-led WebGL2 shader and material research: experimental optical studies, reproducible previews, and licensed-source attribution.

![GLSL](https://img.shields.io/badge/GLSL-WebGL-orange?style=flat-square)
![Status](https://img.shields.io/badge/status-in%20development-yellow?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)

---

## Current status

Shader Gallery is an active portfolio laboratory for interactive GLSL material studies. It combines standalone browser studies with a manifest-driven WebGL2 shader library, deterministic preview generation, native compile/link/render validation, browser QA, and provenance-aware evidence records.

The work is deliberately experimental: a shader can be compile-validated without being a measured or physically calibrated material. Material claims, performance tiers, and cross-device behavior remain bounded until a named trial records them.

## What this demonstrates

- WebGL2 / GLSL 300 ES implementation, packaging, and native validation.
- View- and light-responsive optical appearance studies with accessible controls, reduced-motion behavior, and static fallbacks.
- Deterministic preview and archive-integrity workflows rather than screenshot-only presentation.
- Research-to-implementation discipline: source license, attribution, transfer boundary, and evidence status are recorded before reuse.

## Active research directions

The current studies explore thin-film color, opal-like internal domains, labradorite-like oriented plates, dispersion, nacre, refraction, and controlled lighting. They are visual hypotheses and authorial approximations—not claims of mineral simulation, spectral calibration, or measured material performance.

The Material Validation Lab is the next bounded layer: it will test a Khronos abalone baseline, a thin-film bubble treatment against an RGB-proxy control, and an original procedural gold-foil field before choosing a broader runtime adapter.

## Kaleidoscopic Field / 001 — motion experiment

A [self-contained field and 3D point-displacement comparator](experiments/kaleidoscopic-field-001/README.md) explores temporal feedback, radial symmetry and audio-driven geometry with reproducible 12-second fixtures, a [TouchDesigner reconstruction protocol](experiments/kaleidoscopic-field-001/docs/TOUCHDESIGNER.md) and a [reusable agent skill](experiments/kaleidoscopic-field-001/.agents/skills/kaleidoscopic-field-lab/SKILL.md). This is an **unverified visual experiment** until browser/TouchDesigner receipts establish parity and device performance.

## Research and attribution

The project studies and may validate mechanisms from the following sources; source availability does **not** imply copied code or assets.

- [Khronos glTF Sample Assets — Iridescence Abalone](https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/IridescenceAbalone) — CC BY 4.0 reference asset; any incorporated asset requires attribution.
- [Three.js `MeshPhysicalMaterial`](https://threejs.org/docs/#api/en/materials/MeshPhysicalMaterial) — MIT reference for standard PBR capabilities such as iridescence, transmission, anisotropy, and dispersion.
- [Soap Bubble Iridescence Simulator](https://github.com/SantiagoGR11/pompa-iridiscencia) — MIT research candidate for thin-film optical mathematics.
- [OpenPBR Viewer](https://github.com/portsmouth/OpenPBR-viewer) — MIT comparison/reference renderer; not a gallery dependency.

Exact revisions, licenses, permitted transfers, exclusions, and trial outcomes belong in the Material Validation Lab source registry. Do not use an experimental study as evidence of calibrated optical accuracy.

## Branch map

| Branch | Role | Merge / decision boundary |
|---|---|---|
| `main` | Stable repository and public gallery baseline | Receives reviewed, independently validated work only |
| `feat/optical-studies-02` | PR #15: three experimental studies and an interactive optical-studies surface | Must resolve archive truthfulness and bfcache behavior before merge |
| `fix/pr15-reconciliation` | PR #17: archive/source parity, bfcache recovery, and stale-document repair | Stacked on PR #15; merge here first, then resolve PR #15 review threads |
| `feat/material-validation-lab-v0` | Evidence contracts, source registry, bounded material trial records | Remains separate until three pilot receipts inform an integration decision |

---

## Shader families

| Shader | Aesthetic | Technique |
|---|---|---|
| `aurora` | Northern lights · soft ribbons of light | Domain warping + fbm noise |
| `stained-glass` | Cathedral light · jewel tones | Voronoi + edge glow |
| `fluid-psychedelic` | Lava lamp · melting color | SDF blobs + palette cycling |
| `mandala` | Sacred geometry · radial symmetry | Polar coordinates + mirroring |
| `textile-weave` | Fabric grain · woven structure | Periodic functions + anisotropy |
| `crystal-growth` | Frost · mineral formation | Reaction-diffusion |

The manifest-driven package currently contains 18 experimental shaders across material, optical, atmospheric, aurora, flow, and glow families. The table above is a conceptual vocabulary, not a claim that every listed study has the same implementation or evidence status.

---

## 🚀 Running Locally

```bash
git clone https://github.com/MelodicBloom/shader-gallery
cd shader-gallery
# Open any shader's index.html directly in browser
# or:
npx serve .
```

Legacy standalone shaders may live in their own folders. The active package lives under `packages/shader-library-v1/source/`; run its own validation commands from that directory.

---

## Evidence graph architecture

The repository now includes an additive, read-only-first architecture for connecting shader validation receipts to a provenance-aware Neo4j/MCP graph:

- [`docs/architecture/federated-shader-neo4j-plan.md`](docs/architecture/federated-shader-neo4j-plan.md) — bounded-product design, G0–G9 mapping, MCP surface, and milestones.
- [`schemas/ecosystem-graph-record.schema.json`](schemas/ecosystem-graph-record.schema.json) — shared artifact, claim, snapshot, receipt, and relation contract.
- [`schemas/shader-evidence-receipt.schema.json`](schemas/shader-evidence-receipt.schema.json) — shader-specific apparatus, temporal, metric, and output receipt.
- [`tools/workspace_ingestion_dry_run.py`](tools/workspace_ingestion_dry_run.py) — non-mutating inventory, deduplication, archive-safety, schema, and credential-policy scanner.
- [`docs/ecosystem/index.html`](docs/ecosystem/index.html) — interactive ecosystem, ingestion, and shader-gate workbench.

The graph catalogs and connects receipts; it does not replace the shader validator or promote unsupported claims.

---

## 📁 Structure

```
shader-gallery/
├── aurora/
│   ├── index.html
│   └── shader.glsl
├── stained-glass/
├── fluid-psychedelic/
├── mandala/
└── docs/          ← GitHub Pages gallery index
    └── index.html
```

---

## 🔗 Related Projects

- [Melodyfire](https://github.com/qt314wink/melodyfire) — Full portfolio with integrated WebGL
- [Jewelmorphism](https://github.com/qt314wink/neumorphism-soft-ui-design-system) — Crystal-inspired UI system

---

## 📄 License

MIT © [Jennipher Troup](https://github.com/qt314wink)
