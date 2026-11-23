# Beetle reflectors (not applied)

The live studies are unchanged. The render uses the Abalone warp as a carrier and a different stack. It does not draw a beetle.

## What is actually computed

A quarter-wave chitin/air stack, the mechanism Seago, Brady, Vigneron and Schultz review for jewel beetles and scarabs in J. R. Soc. Interface 6, 165–184 (2009). Hue is the design wavelength. Layer count sets the peak strength. Fixed demonstration values, not a measured species thickness:

| Symbol | Value | Unit | Role |
| --- | --- | --- | --- |
| n_c | 1.56 | 1 | chitin |
| λ_0 | 560 | nm | green/gold design wavelength |
| d_c | λ_0 / (4 n_c) = 89.74 | nm | quarter-wave cuticle |
| d_a | λ_0 / 4 = 140 | nm | quarter-wave air |
| N | 8 | 1 | cuticle layers; 3 is weak, 12 saturates |
| n_s | 1.70 | 1 | melanin underlayer, real part only |

The transfer matrix is the same recurrence as the Morpho note. At the design wavelength every layer has δ = π/2, so the peak is the stack peak rather than a sideband. No 0.75 scale is applied here, because that measurement was for Morpho.

## Named, and not computed

These are in the same review and are not in the shader:

- A 3D photonic crystal (some weevils) is saturated and mostly angle-independent. A band-structure solve is not in this page.
- A surface diffraction grating. The same aliasing warning as the Morpho pitch applies.
- *Chrysina gloriosa* reflects circularly polarized light from a cholesteric helix (Sharma, Crne, Park and Srinivasarao, Science 325, 449–451, 2009). The Bragg law is `λ = n_avg P`. A demonstration pitch of 360 nm at n = 1.56 would sit at 562 nm. The shader does not trace a helix and does not output a Stokes parameter, so it cannot show circular polarization.

## BOTTLENECKS

Eight cuticle layers plus seven air gaps, one wavelength, plus the carrier warp's fBm. A helicoidal stack or a 3D crystal would multiply that cost.

## FAILURE MODES

Quarter-wave δ = π/2 is exact only at λ_0 and at the angle used to shorten the path. Off that wavelength the shader does not integrate sidebands. Grazing angles clamp `cos θ` at 0.05. The wavelength map is not CIE. mediump would be unsafe for the complex divide; the shader requests highp. SwiftShader will not match a beetle's measured spectrum. The page is one static frame. WebGL failure leaves a black canvas.

## Verdict

The stack is a legitimate thin-film beetle model and a poor Abalone model. Layer count does change brightness in the matrix, which is the part of the story this page can show. It does not show circular polarization or a 3D crystal. Leave the live study as it is.
