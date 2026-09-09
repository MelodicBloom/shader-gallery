# 🌌 Shader Gallery

Shader Grammar's canonical ontology prototype is maintained in [`packages/shader-grammar`](packages/shader-grammar/INTAKE.md). See its intake record for version boundaries, provenance, and validation; the package does not alter the live gallery.

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
git clone https://github.com/qt314wink/shader-gallery
cd shader-gallery
# Open any shader's index.html directly in browser
# or:
npx serve .
```

Each shader lives in its own folder with a self-contained `index.html` and `shader.glsl`.

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
