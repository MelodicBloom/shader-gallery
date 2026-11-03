# Optical Studio / Dispersion Instrument 0.1

Independent educational analytical instrument, not GPU shader and not a calibration.

## Runtime needs

| Need | Why | Install |
|---|---|---|
| Browser with ES modules (Chromium / Firefox / WebKit) | UI | phone/desktop browser |
| Local HTTP static server | `file://` blocks ES module imports | see launch below |
| Node.js ≥ 18 | unit tests + adapter CLI only | Termux: `pkg install nodejs-lts`; desktop: node 18+ |
| Python 3 (optional) | convenient static server | Termux: `pkg install python` |

**npm packages: none.** Native `node:test` / `node:assert`. No bundler.

## Run (desktop / Termux)

Serve the **repository root** (the folder that contains `optical-studio/`), not this lab folder:

```sh
# Termux once:
pkg install python nodejs-lts

cd /path/to/shader-gallery   # repo root

# Preferred — from repo root:
python3 -m http.server 8000 --bind 127.0.0.1

# Or from this package (serves repo root via --directory ../../..):
npm run serve --prefix optical-studio/instruments/dispersion-lab

# If `python` / `python3 -m` fails on Termux, use either:
python -m http.server 8000 --bind 127.0.0.1
# or (no Python):
npx --yes serve -l tcp://127.0.0.1:8000 .
```

Then open: `http://127.0.0.1:8000/optical-studio/instruments/dispersion-lab/`

Do **not** open `file://…/index.html` — ES modules will be blocked.

Tests:

```sh
node --test optical-studio/instruments/dispersion-lab/test-cauchy.mjs
node --test optical-studio/instruments/dispersion-lab/test-crystal-lens-adapter.mjs
# or from this folder:
npm test
```

The five material choices are pedagogical approximate `n_d/V_d` pairs described by the reference; these are not certified catalog fits or measurements. Our own Cauchy implementation follows ratified Khronos `KHR_materials_dispersion` math. No oavivo code or assets used; only conceptual attribution. No license has been inferred from public source visibility.

The chart shows seven numerical Cauchy samples, not seven WebGL ray paths. The current Crystal Lens is three-proxy-channel Snell GLSL and its controls are not bound to this instrument. Export is candidate-only JSON; do not import to production shader without a material/control-adapter test and a new image/source receipt.

UI bounds for refractive index (`1.01`–`2.55`) and Abbe (`9`–`95`) match the sliders. Incomplete or out-of-range typed values remain editable and disable export until corrected; valid values update the chart and slider.

## Crystal Lens adapter 0.1

```sh
node --test optical-studio/instruments/dispersion-lab/test-crystal-lens-adapter.mjs
node -e "import('./optical-studio/instruments/dispersion-lab/crystal-lens-adapter.mjs').then(m=>console.log(JSON.stringify(m.adaptPreset('crown'),null,2)))"
```

Maps Instrument export → proposed `paletteShift` / `spectral` / `dispersionUI` only.
- `nd` outside 1.40–1.70 clamps and sets `outOfRange`.
- Invalid `displayExaggeration` / `preferSpectral` throw before uniforms are computed.
- Physical `nF−nC` × display exaggeration maps into the shader’s authored channel span; when the target exceeds the max representable span, `appearanceSpreadAchieved` + a saturation warning are reported.
- `grain` / `roughness` / lighting uniforms stay `null` (adapter does not invent them).
- `connectedToLiveShader: false` until an image/source receipt and QUALITY_GATES entry exist.

## Next tests

Browser: Chromium/Firefox/WebKit at 375/768/1440px, pointer, keyboard, zoom, offline, contrast, focus, reduced motion (static chart), invalid input and export/download. On a real GPU, separately verify WebGL2 v1.2 studio and new adapter when introduced. Calculate GPU-vs-reference and target-vs-rendered deltas under fixed camera/light/geometry. Record renderer and artifact hashes; never invent FPS.
