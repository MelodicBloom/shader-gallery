# Optical Studies 02 — models not applied

`docs/optical-studies-02.html` is byte-identical to `ccceaea`. These notes are not wired into it.

## Opal

Play-of-color is diffraction from a lattice of silica spheres, not a paint mosaic. For a Bragg reflection:

```
λ = 2 n_eff d_hkl sin φ
```

`d_hkl` is the sphere spacing, typically 150–350 nm. `n_eff` is about 1.45. Source: Sanders, J. V. "Diffraction of light by opals." *Acta Crystallographica A* 24, 1968.

## Labradorite

Schiller comes from interference at exsolution lamellae a few tens to a few hundreds of nanometres thick, oriented through the feldspar. The same thin-film condition as nacre applies, with a smaller `d` (about 80–250 nm) and a dark host. Source: Ribbe, P. H. (ed.). *Feldspar Mineralogy*. Mineralogical Society of America, 1983, Bøggild intergrowth.

## Prism

Sellmeier, wavelength in micrometres:

```
n²(λ) = 1 + Σ_i B_i λ² / (λ² - C_i)
```

Cauchy, cheaper and worse in the blue:

```
n(λ) = A + B / λ² + C / λ⁴
```

Schott BK7 at 20 °C (published catalog): B1 = 1.03961212, C1 = 0.00600069867 µm², and the two further terms in the Schott data sheet. The live prism shader already refracts three proxy indices. It was not modified.

## BOTTLENECKS

The live file ray-marches an ellipsoid or a five-plane prism and loops cells in the fragment shader. That is the cost. The notes add no loops.

## FAILURE MODES

The wavelength proxy is three Gaussians, not a CIE integral. Fresnel at μ = 0 saturates. A preserved drawing buffer plus a static preview hides a compile failure. SwiftShader will not match a phone. Reduced motion sets `playing` false, which changes the button label. On this 1440×900 capture that grew the canvas from 1148×925 to 1148×947, so the same time and the same light rasterize differently. Time stayed 0 and the light stayed (−0.55, 0.65, 1.1).
