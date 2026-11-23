# Aurora optics proposal (not applied)

The live `aurora/index.html` shader is the owner's original full-frame domain warp. This note does not change it.

## What the light is

Auroral color is emission, not reflected paint. The lines used here are the ones a viewer can actually name:

| Species | Transition | Wavelength | Typical altitude |
| --- | --- | --- | --- |
| N₂⁺ | first negative, (0,1) | 427.8 nm | about 90–150 km, lower border |
| OI | ¹S → ¹D | 557.7 nm | about 100–150 km |
| OI | ¹D → ³P | 630.0 nm | above about 200 km |

Source: Vallance Jones, A. *Aurora*. D. Reidel, 1974. Wavelengths are the laboratory air values used in auroral photometry.

## Equation used by the unapplied proposal

Height fraction `h` is the original shader's vertical coordinate, clamped to 0–1. It is not a kilometer altitude. The mix is a stand-in for the altitude layering above, not a transport solution.

```
L(h) = w427 * E(427.8) + w557 * E(557.7) + w630 * E(630.0)
w427 = smoothstep(0.55, 0.05, h)
w557 = smoothstep(0.05, 0.35, h) * smoothstep(0.85, 0.45, h)
w630 = smoothstep(0.35, 0.90, h)
```

`E(λ)` is a unit-peak Gaussian in sRGB channel space, not a CIE observer:

```
E_c(λ) = exp(-0.5 * ((λ_c - λ) / σ_c)^2)
λ_R, λ_G, λ_B = 620, 535, 455 nm
σ_R, σ_G, σ_B = 42, 34, 32 nm
```

Fixed parameters: those six numbers. No free fit. Valid range for `h` is [0, 1]. Wavelengths are fixed. The original noise field `f` still gates brightness. No treeline, no new geometry.

## BOTTLENECKS

The live shader and the proposal both run 6-iteration fBm three times per pixel, in mediump. That is the cost. The proposal adds only the three Gaussians.

## FAILURE MODES

- mediump fBm bands on large screens.
- The sin-hash noise is not a spectrum. It cannot reproduce a real curtain.
- Wavelength-to-RGB here clips and is not linear light. 630 nm red and 557.7 nm green will not match a camera.
- SwiftShader and a phone GPU will not match.
- Reduced motion draws the first frame only (`t = 0.016`). The field is then static.
- Byte-exact original code on Chrome 157 / SwiftShader does not reset the viewport when `canvas.width` is set, so the unpatched file paints 300×150. The restore adds `gl.viewport` and does not change the shader. That is a driver failure mode, not a new composition.
