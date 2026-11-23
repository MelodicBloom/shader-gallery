# Morpho structural blue (not applied)

The live Abalone shader and the nacre-laminate recipe are unchanged. This page borrows the Abalone warp only as a carrier so the color model can be compared in the same field. It does not draw a butterfly.

## Equations

Ground-scale numbers for *Morpho didius*, fixed, from Kinoshita, Yoshioka, Fujii and Okamoto, Forma 17, 103–121 (2002):

| Symbol | Meaning | Value | Unit | Range in that paper |
| --- | --- | --- | --- | --- |
| n_c | cuticle index | 1.56 | 1 | chitin, about 1.56 |
| d_c | cuticle lamella | 55 | nm | about 0.055 µm |
| n_a | air gap | 1.00 | 1 | 1 |
| d_a | air gap | 150 | nm | about 0.15 µm |
| N | cuticle layers | 7 | 1 | 6–8 on *M. didius*, 8–10 on *M. rhetenor* |
| Λ | ridge pitch | 700 | nm | 0.6–0.7 µm on the ground scale |
| n_s | melanin base, real part only | 1.70 | 1 | absorbing; k is not in this model |

Bragg peak of one cuticle/air pair, angle inside each layer:

```
λ(θ) = 2 (n_c d_c cos θ_c + n_a d_a cos θ_a)
θ_c = asin(clamp(sin θ / n_c, -1, 1))
```

At θ = 0 that is 471.6 nm. A lossless stack peaks near 475 nm.

Reflectance is a normal-incidence transfer matrix. Admittance starts at the substrate and walks back through the layers:

```
η_0 = n_s
δ = 2π n d cosθ / λ
η' = n (η cos δ + i n sin δ) / (n cos δ + i η sin δ)
r = (1 - η) / (1 + η)
R_model = |r|²
```

`R_model` at 475 nm is 0.978. Focused-laser measurements of Morpho scales reach about 75% of incident blue light over a wide angle (Vukusic, Sambles, Lawrence and Wootton, Proc. R. Soc. Lond. B 266, 1403–1411, 1999). The render multiplies by the recorded ratio `0.75 / 0.978`. That factor is the measurement, not a hidden fit.

Ridge diffraction is an angle, not a drawn line. A 700 nm pitch cannot be resolved as stripes in this viewport:

```
sin φ = λ / Λ
```

At 470 nm, φ is about 42°. Disorder in ridge height, which Kinoshita and Yoshioka, Proc. R. Soc. Lond. B 269, 1417–1421 (2002), show is what widens the viewing angle, is a fixed gaussian on θ with σ = 0.40 rad. That width is a stand-in. It is not their correlation function.

Color is the same three-gaussian wavelength map used in the earlier unapplied notes (centers 620, 535, 455 nm; widths 42, 34, 32 nm). Melanin keeps the unreflected light: linear `(0.04, 0.02, 0.01)`.

## BOTTLENECKS

Thirteen complex admittance steps per pixel, on top of the Abalone warp's three 6-octave fBm loops. A real spectrum would repeat the matrix across wavelengths. This shader evaluates one wavelength, the Bragg peak.

## FAILURE MODES

The lossless matrix is brighter than a real scale before the 0.75 scale is applied. Melanin `k` is missing, so the base does not actually absorb inside the matrix. `cos θ` is clamped at 0.05 so grazing angles do not divide by zero; the hue then collapses. mediump complex division can NaN, so the shader asks for highp. The gaussian wavelength map is not CIE XYZ and clips at the ends. A drawn 700 nm grating aliases into moiré, which is why the pitch is only an angle. SwiftShader and a phone GPU will not match this matrix. Reduced motion does not apply: the page draws one frame and stops. If WebGL fails the canvas stays black. There is no bitmap fallback.

## Verdict

The pinned frame is a blue wash of the Abalone warp. The peak sits near 470 nm, and the carrier normal keeps `n.z` close to 1, so the angle term barely moves the hue. The gaussian map then paints that wavelength as pure blue. This is a Morpho peak on the wrong field. It is not a better nacre or Abalone model. Nacre tablets are hundreds of nanometres thick and shift across the visible spectrum. Do not replace the live study with it.
