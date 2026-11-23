# Abalone nacre optics proposal (not applied)

The live `abalone/index.html` shader is the owner's original full-frame warp and cosine palette. This note does not change it. The oval, the holes, and the dark shell mask are removed.

## Model

Nacre tablets are aragonite layers about 0.3–0.5 µm thick. A stack reflects when the round trip matches an integer number of wavelengths (Bragg / thin-film condition for normal-to-grazing view):

```
λ_m(θ) = (2 n d cos θ) / m
```

| Symbol | Meaning | Value used in the proposal | Unit | Range |
| --- | --- | --- | --- | --- |
| n | refractive index of aragonite, ordinary ray, visible | 1.53 | 1 | 1.53–1.68 |
| d | tablet thickness | 400 | nm | 300–500 |
| m | interference order | 1 | 1 | 1–2 in the visible for this d |
| θ | angle inside the layer | from the existing normal | rad | 0 to just under π/2 |

Source: Snow, M. R., Pring, A., Self, A., Losic, D., Shapter, J. "The origin of the color of pearls in iridescence from nano-composite structures of the nacre." *American Mineralogist* 89, 2004, tablet thicknesses of a few hundred nanometres. Index: Bragg, W. L. "The refractive indices of calcite and aragonite." *Proc. R. Soc. A* 105, 1924, nω ≈ 1.530.

Fresnel reflectance at an air boundary, unpolarized estimate:

```
F(μ) = F0 + (1 - F0) (1 - μ)^5
F0 = ((n - 1) / (n + 1))^2
μ = clamp(dot(normal, view), 0, 1)
```

At μ = 0, F = 1. At μ = 1, F = F0 ≈ 0.044 for n = 1.53. The Schlick form is an approximation (Schlick, 1994), not a measured shell.

The proposal keeps the original `uv` warp and full-frame domain. It does not draw a shell outline. Hue comes only from `λ_1(θ)` passed through the same Gaussian wavelength-to-RGB map as the aurora note. `d` is fixed at 400 nm. Nothing is fitted.

## Bottlenecks

Six-octave fBm, three times, per pixel, mediump. The Bragg term is a few arithmetic ops.

## Failure modes

- cos θ → 0 at grazing view sends λ → 0 and the Gaussian map returns black. The proposal clamps θ so cos θ ≥ 0.15 (λ ≥ 184 nm is still outside the map, so the hue collapses toward blue before it hits NaN).
- mediump `cos` of a noisy normal bands into stripes. That can be mistaken for growth lines. It is aliasing.
- sRGB encoding of a linear interference weight is wrong. The live cosine palette is also not spectral.
- SwiftShader versus a real GPU will move the noise, not the Bragg formula.
- Reduced motion holds the first frame.
- A 390 px wide viewport undersamples the warp. The original shader has this limit too.
