# MelodicBloom Shader Library v1

A compile-validated WebGL2 shader library containing 15 semantic shader families, deterministic previews, metadata-driven controls, and a framework-agnostic runtime.

## Included

- 15 repaired WebGL2 fragment shaders
- normalized `u_time`, `u_resolution`, and `u_mouse` uniforms
- `ShaderPlayer` with resize, pointer, uniform, replacement, capture, and deterministic-render APIs
- per-shader `meta.json`
- deterministic `preview.png`
- browser compile/render smoke tests
- static gallery page
- GitHub Actions and Netlify configuration

## Validate

```bash
npm test
```

The test builds a small native EGL/GLES3 validator, compiles and links every shader with SwiftShader or Mesa software rendering, renders a deterministic frame, and verifies visible pixel output.

## Generate previews

```bash
npm run generate:previews
```

## Core usage

```js
import { ShaderPlayer } from "./src/index.js";

const canvas = document.querySelector("canvas");
const player = new ShaderPlayer(
  canvas,
  "./shaders/aurora/abalone/shader.glsl",
  { autoStart: true }
);

await player.init();
player.setUniform("grain", 0.35);
player.setUniform("paletteShift", 0.45);
```

## Deterministic rendering

```js
player.setFixedTime(1.2345);
player.renderOnce({ time: 1.2345 });
const png = await player.captureFrame();
```

## Repository placement

This package is intentionally extracted under `packages/shader-library-v1/source/`. The existing root-level Aurora, Abalone, documentation, and GitHub Pages deployment remain unchanged until a separate integration decision is reviewed.
