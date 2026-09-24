# 🌌 Shader Gallery

> An interactive collection of GLSL fragment shaders — live WebGL art you can explore, fork, and remix.

![GLSL](https://img.shields.io/badge/GLSL-WebGL-orange?style=flat-square)
![Status](https://img.shields.io/badge/status-in%20development-yellow?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)

---

## ✨ Concept

Each shader in this gallery is a standalone visual piece with its own name, aesthetic, and emotional register. They run entirely in the browser via WebGL — no dependencies, no frameworks, just pure GPU math made visible.

---

## 🎨 Shader Series (Planned)

| Shader | Aesthetic | Technique |
|---|---|---|
| `aurora` | Northern lights · soft ribbons of light | Domain warping + fbm noise |
| `stained-glass` | Cathedral light · jewel tones | Voronoi + edge glow |
| `fluid-psychedelic` | Lava lamp · melting color | SDF blobs + palette cycling |
| `mandala` | Sacred geometry · radial symmetry | Polar coordinates + mirroring |
| `textile-weave` | Fabric grain · woven structure | Periodic functions + anisotropy |
| `crystal-growth` | Frost · mineral formation | Reaction-diffusion |

---

## 🚀 Running Locally

```bash
git clone https://github.com/MelodicBloom/shader-gallery
cd shader-gallery
# Open any shader's index.html directly in browser
# or:
npx serve .
```

Each shader lives in its own folder with a self-contained `index.html` and `shader.glsl`.

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
