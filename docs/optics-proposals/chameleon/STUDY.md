# Chameleon guanine lattice (not applied)

The guanine-crystal recipe is unchanged. Its presets are feTurbulence frequencies, not nanometre spacings.

## The recipe, recorded and left alone

From `guanine-crystal.json` on seed-loom `330d237`:

| Preset | facet-x | facet-y | surface-scale | specular-exponent | light-x |
| --- | --- | --- | --- | --- | --- |
| relaxed-blue | 0.052 | 0.14 | 5 | 24 | 110 |
| excited-spectrum | 0.095 | 0.24 | 9 | 48 | 230 |
| silver-flash | 0.12 | 0.32 | 11 | 62 | 175 |

`facet-x` and `facet-y` are frequency inputs to feTurbulence. They have no nanometre unit. Mapping them onto a lattice constant would be a guess. This proposal does not do that.

## The paper, beside the recipe

Teyssier, Saenko, van der Marel and Milinkovitch, Nature Communications 6, 6368 (2015):

| Symbol | Value | Unit |
| --- | --- | --- |
| n_guanine | 1.83 | 1 |
| n_cytoplasm | 1.33 | 1 |
| crystal diameter | 127.4 ± 17.8 | nm |
| nearest-neighbour distance, stained and unstained sections | 180.3 ± 26.9 and 179.9 ± 30.2 | nm |
| lattice parameter a = s √2 | simulation sweep 480 down to 233 | nm |
| resting versus excited spacing | about 30% smaller when resting | 1 |

They model an FCC lattice because, for a/λ < 1, the first Fourier component dominates and the close-packed symmetries share it. The shader does not solve the Brillouin zone. It uses the first-order gap they say that component sets:

```
φ = 4 (π/6) (d / a)³
n_eff² = φ n_g² + (1-φ) n_c²
λ_111 = 2 n_eff a / √3
```

Fixed endpoints, checked before the shader was written: a = 233 nm gives φ = 0.342, n_eff = 1.520, λ = 409 nm. a = 480 nm gives φ = 0.039, n_eff = 1.353, λ = 750 nm. The frame sweeps `a` from 233 to 480 across x. Angle shortens the gap by `cos θ`, with `cos θ` clamped at 0.15.

The wavelength map is the same three gaussians as the other notes. 750 nm is at the edge of that map and comes out dark red. That is the map failing, and it matches the paper's point that the excited lattice moves into the red and near infrared.

## BOTTLENECKS

One Bragg evaluation per pixel. A band-structure solve on a meshed Brillouin zone, which is what the paper did, is not a fragment-shader cost worth paying here.

## FAILURE MODES

The volume average of n² is not Maxwell-Garnett and not their plane-wave solver. The 111 direction is a stand-in for the orientation average they actually computed. The gaussian map clips the 750 nm end, so the excited state looks darker than a real reflectance curve. Grazing `cos θ` is clamped. mediump is enough for this arithmetic; the other proposals need highp. SwiftShader versus a GPU does not matter for a smooth gradient and would matter if this were a crystal shader with noise. The page is one static frame. WebGL failure leaves black.

## Verdict

The sweep follows the published tuning, from blue toward red/infrared. It does not look like the guanine-crystal filter, and it should not replace it. The filter is a turbulence facet. The paper is a lattice. Putting the paper's numbers into `facet-x` would not be the paper.
