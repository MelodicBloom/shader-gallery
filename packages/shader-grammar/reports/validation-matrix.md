# Shader Grammar v0.1 Validation Matrix

Validation date: 2026-08-31 (America/New_York)

## Result

**PASS.** The strict dependency-free validator accepted all four catalogs/schemas and all 12 recipes. The tested corpus contains 20 parameter definitions, 13 field definitions, 18 operator definitions, and seven material families. Recipes use 48 distinct primitives; every one of those 48 appears in at least two specimens. No primitive identifier contains a specimen name.

## Specimen coverage

| Specimen | Families | Dominant shared mechanisms | Reused structural fields |
|---|---|---|---|
| Oil slick | surface film, dynamic interface | fBm, domain warp, thin film, Fresnel, spectral integration | UV, normal, view, thickness |
| Soap film | surface film, dynamic interface | Voronoi, fBm, thin film, Fresnel, spectral integration | UV, normal, view, thickness |
| Nacre | layered dielectric, periodic microstructure | domain warp, thin film, Fresnel, reflection | orientation, thickness, normal, view |
| Labradorite | layered dielectric, periodic microstructure | domain warp, diffraction, Fresnel, reflection | height, orientation, normal, view |
| Butterfly structural color | periodic microstructure, layered dielectric | fBm, diffraction, Fresnel, spectral integration | orientation, spectral response, normal, view |
| Holographic foil | periodic microstructure, metallic surface | domain warp, diffraction, reflection, spectral integration | orientation, spectral response, normal, view |
| Bismuth oxide | surface film, metallic surface | Voronoi, gradient, derived normal, thin film, reflection | height, thickness, normal, view |
| Molten chrome | metallic surface, dynamic interface | fBm, advection, gradient, derived normal, reflection | world position, height, flow, normal, view |
| Caustic water | refractive volume, dynamic interface | fBm, gradient, derived normal, refraction, caustic convergence, absorption | height, optical depth, light, normal, view |
| Cloud | participating medium | fBm, domain warp, advection, absorption, phase scattering, raymarch | density, flow, time, light, view |
| Nebula | participating medium | fBm, domain warp, advection, phase scattering, raymarch, spectral integration | density, flow, spectrum, time, light, view |
| Opalescent glass | refractive volume, layered dielectric | fBm, thin film, refraction, caustic convergence, absorption, spectral integration | thickness, density, optical depth, light, normal, view |

## What the evidence proves

The recipes vary by graph composition, parameter values, and taxonomy memberships. They do not add material-specific node types such as `oil_slick_noise`, `labradorite_color`, or `nebula_density`. Cross-cutting primitives carry the semantics: `field.thickness` is shared by films, nacre, oxide, and glass; `op.diffraction_grating` serves mineral, biological, and manufactured microstructures; `op.caustic_convergence` serves water and glass; volume transport serves both cloud and nebula.

This establishes syntactic reuse and a promising semantic decomposition. It does **not** prove that the current equations can reproduce every specimen at production fidelity, that every renderer can implement the graphs identically, or that the taxonomy is complete.

## Strengths

- Clean separation among atomic controls, spatial/temporal fields, field-transforming operators, and recipes.
- Units, artistic ranges, physical ranges, normalized mappings, GLSL/WGSL hints, cost tiers, and compatibility metadata live with definitions instead of being duplicated in recipes.
- Material classification is multi-axis and compositional; recipes may belong to more than one family.
- Cross-reference and graph-integrity checks catch dangling ontology references and broken instance wiring.
- Strict reuse auditing makes specimen-specific leakage visible and testable.
- Zero runtime dependencies makes the validation gate easy to run in CI or an offline worktree.

## Weak or deliberately unspecified

- The included validator implements the Draft 2020-12 keywords used by this package, not the entire JSON Schema specification or its official meta-schema.
- GLSL/WGSL entries are representation signatures or compact reference hints, not a complete code generator or renderer backend.
- Spectra are abstract; wavelength grid, observer functions, illuminant conventions, color space, gamut mapping, and spectral up/down-sampling are unspecified.
- Complex conductor IOR, polarization/Jones or Mueller calculus, fluorescence, phosphorescence, diffraction polarization, multiple scattering, and coherent path tracing are not modeled.
- Operator port typing is declared but graph edges are not yet statically type-checked from output port to input port.
- No canonical coordinate-handedness, unit-scale convention, tangent basis, derivative convention, or texture color-management contract exists yet.
- Cost metadata is qualitative and estimated; it is not calibrated per GPU architecture, sample count, resolution, or renderer.
- Parameter ranges are plausible ontology defaults, not laboratory reference data for specific substances.

## Generalizations introduced during implementation

1. `field.optical_depth` generalizes both underwater attenuation and optical path length through glass.
2. `field.orientation` generalizes mineral lamellae, butterfly scales, and embossed holographic gratings.
3. `field.spectral_response` separates wavelength-domain behavior from RGB conversion.
4. `op.caustic_convergence` generalizes refracted-ray focusing across liquid and solid transparent media.
5. `op.layer_mix` provides a shared composition boundary instead of material-specific blend nodes.
6. Taxonomy families separate morphology/transport from specimen names, allowing hybrid membership.

## Recommended system improvements

1. Add a typed graph schema with named ports, edge type inference, cycle policy, and domain compatibility checks.
2. Split implementation hints into renderer profiles (raster, path tracer, WebGPU real-time, offline spectral).
3. Define a spectral contract: wavelength domain, sampling strategy, CIE observer, working RGB space, white point, and tone/gamut policy.
4. Add physical optics modules for complex IOR, polarization, birefringence, fluorescence, and multilayer transfer matrices.
5. Add provenance/confidence fields for measured constants and artist-tuned defaults.
6. Replace qualitative cost tiers with a benchmark profile schema keyed by backend, resolution, sample count, and device class.
7. Add golden-image fixtures and perceptual tolerances after a reference renderer exists.
8. Run the schemas through a standards-complete Draft 2020-12 validator in CI as an independent second gate.

## Reproduction

Run `node scripts/validate.mjs --strict` from the package root. A successful run prints `Shader Grammar validation PASSED` and the exact catalog/reuse counts.
