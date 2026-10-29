# Optical Studio / Dispersion Instrument 0.1

Independent educational analytical instrument, not GPU shader and not a calibration.

## Runtime needs

| Need | Why | Install |
|---|---|---|
| Browser with ES modules (Chromium / Firefox / WebKit) | UI | phone/desktop browser |
| Local HTTP static server | `file://` blocks ES module imports | `python3 -m http.server` or any static server |
| Node.js ≥ 18 | unit tests + adapter CLI only | Termux: `pkg install nodejs-lts`; desktop: node 18+ |
| Python 3 (optional) | convenient static server | Termux: `pkg install python` |

**npm packages: none.** Native `node:test` / `node:assert`. No bundler.

## Run (desktop / Termux)

From the repository root (parent of `optical-studio/`):

```sh
# Termux once: pkg install python nodejs-lts
python3 -m http.server 8000
# open http://127.0.0.1:8000/optical-studio/instruments/dispersion-lab/
node --test optical-studio/instruments/dispersion-lab/test-cauchy.mjs
node --test optical-studio/instruments/dispersion-lab/test-crystal-lens-adapter.mjs
# or from this folder:
npm test
```

The five material choices are pedagogical approximate `n_d/V_d` pairs described by the reference; these are not certified catalog fits or measurements. Our own Cauchy implementation follows ratified Khronos `KHR_materials_dispersion` math. No oavivo code or assets used; only conceptual attribution. No license has been inferred from public source visibility.

The chart shows seven numerical Cauchy samples, not seven WebGL ray paths. The current Crystal Lens is three-proxy-channel Snell GLSL and its controls are not bound to this instrument. Export is candidate-only JSON; do not import to production shader without a material/control-adapter test and a new image/source receipt.

## Crystal Lens adapter 0.1

```sh
node --test optical-studio/instruments/dispersion-lab/test-crystal-lens-adapter.mjs
node -e "import('./optical-studio/instruments/dispersion-lab/crystal-lens-adapter.mjs').then(m=>console.log(JSON.stringify(m.adaptPreset('crown'),null,2)))"
```

Maps Instrument export → proposed `paletteShift` / `spectral` / `dispersionUI` only.
- `nd` outside 1.40–1.70 clamps and sets `outOfRange`.
- Physical `nF−nC` is scaled by the instrument’s 3× display exaggeration into the shader’s authored channel span — appearance heuristic, not a calibration.
- `grain` / `roughness` / lighting uniforms stay `null` (adapter does not invent them).
- `connectedToLiveShader: false` until an image/source receipt and QUALITY_GATES entry exist.

## Next tests

Browser: Chromium/Firefox/WebKit at 375/768/1440px, pointer, keyboard, zoom, offline, contrast, focus, reduced motion (static chart), invalid input and export/download. On a real GPU, separately verify WebGL2 v1.2 studio and new adapter when introduced. Calculate GPU-vs-reference and target-vs-rendered deltas under fixed camera/light/geometry. Record renderer and artifact hashes; never invent FPS.
