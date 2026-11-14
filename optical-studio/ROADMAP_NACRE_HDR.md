# Abalone Inner Fire — nacre metrology, spectral interference, HDR spatial bloom

Status: **implementation roadmap, not a claim of physical calibration**.
Scope: `optical-studio/` additive laboratory. Keep existing `abalone/` unchanged until promoted under review.

## 0. Proven starting state

Optical Studio v1.2 is seven WebGL2/GLSL ES 3.00 appearance studies. The abalone specimen uses six artistic wavelength bands, three depth contributions, growth-aligned domains, local glints and 0–4 isolation passes. These are **not** measured refractive-index spectra, transfer-matrix reflection, calibrated spectrophotometry, or spatial bloom. See `QUALITY_GATES.md`. The reference images are Mesa OpenGL ES captures; live hardware/WebGL2 verification remains open.

## 1. Build the measurement/provenance contract *before* changing the shader

For every physical parameter record units, wavelength range, sample identity, instrument/calibration, source citation, acquisition date, measurement geometry, uncertainty and measured/inferred/authored status. Record independently:

- Aragonite layer thickness distribution, orientation/texture, local thickness correlation, platelet footprint, and layer count/stack variability.
- Organic interlayer thickness distribution; `n(λ)`, absorption coefficient or `k(λ)`, substrate and cover medium; account for aragonite birefringence and polarization rather than pretending it is an isotropic scalar.
- Measured angle-resolved reflectance `R(λ, θ_i, θ_o, polarization)`, plus specular/diffuse channels, measured illumination spectrum/white point, incident/observation angles and BRDF sampling geometry.
- Macro shell growth bands/topography and spatial maps, with uncertainty and scope. Do not reinterpret local contrast as uniquely identifying layer thickness; multiple structures can produce similar color.

**Literature-informed priors, not measurements of our specific sample:** aragonite platelets near 0.5 µm, organic interlayers of roughly 20–50 nm, tablet lateral dimension around 5–10 µm. Ranges vary by species, site, section and method. Replace these priors as soon as paired optical/morphological measurements exist.

Data files to add (proposed): `data/nacre/sources.json`, `data/nacre/optical-constants.csv`, `data/nacre/measurements/*.csv`, `data/nacre/calibrations/*.json`, and `data/nacre/provenance.json`. Each dataset must be immutable/versioned and carry explicit calibration scope.

## 2. Implement a physically grounded multilayer reflectance solver

Start in CPU/Python as a reference solver — **not** inside the per-fragment shader. For each wavelength, incidence angle and polarization, propagate Snell angles (including complex indices/absorption if available) through aragonite/organic stacks. Use the thin-film characteristic matrix per layer:

`δ_j = 2π n_j d_j cos(θ_j) / λ`

`M_j = [[cos δ_j, i sin δ_j / η_j], [i η_j sin δ_j, cos δ_j]]`

where `η_j` depends on s vs p polarization and on the adopted normalized admittance convention. Multiply matrices in physical layer order; calculate complex amplitude reflectance and `R = |r|²` with correct incident/substrate boundary conditions. Unit-test normal incidence, quarter-wave stacks, continuity and energy accounting (including absorption).

For anisotropic aragonite, use documented ordinary/extraordinary optical constants and orientation-dependent effective response **only under an explicitly stated approximation**. For serious off-axis birefringence, graduate from isotropic 2x2 TMM to an anisotropic 4x4 transfer/scattering method. Do not claim that a scalar model captures it.

Use 400–700 nm wavelength sampling at e.g. 10 nm as an **initial numerical resolution**, then convergence-test against 5 nm or a more appropriate adaptive grid. Monte Carlo over thickness variability and platelet orientations; model coherent reflection within locally correlated stacks and incoherent aggregation where appropriate. Preserve separate mirror/structural, diffuse and clearcoat terms.

## 3. Make the response view- and light-dependent *without moving painted color*

The shader consumes a tabulated `R(λ, θ, thickness, disorder, polarization)` or a validated compact surrogate (e.g. PCA coefficients/LUT). A local object-space thickness/platelet-normal field varies only with the surface point, not with `u_time`. For each visible point, form the microfacet half-vector from normalized view and light directions; evaluate layer incidence relative to that oriented facet, then weight by physically justified Fresnel/microfacet distribution, masking-shadowing and lighting geometry.

The interference changes as **view OR light** moves. It does not arbitrarily cycle with time, and the opposite/independent motion tests must not produce identical image deltas. The color response is integrated against a specified illuminant SPD and CIE observer functions into XYZ, then converted to scene-linear RGB. Do not equate a single RGB hue function with a spectral measurement.

Budget options:
- Desktop high quality: precomputed angle/thickness/spectral LUT plus 16–31 wavelength quadrature or validated low-rank reconstruction.
- Mobile: sparse-angle compressed LUT/3-band fitted surrogate, with a measured error envelope against the reference integrator.
- Debug: side-by-side legacy six-band appearance model, physical LUT, residual map and isolate views.

**Acceptance gate:** measured-versus-simulated peak wavelength and peak-shift curves vs incidence angle, chromaticity difference (e.g. ΔE00 with stated conversion and illuminant), image-region error under held-out lights/views, stationary frame repeatability and source traceability. Set numerical thresholds after inspecting the measurement noise/variability; do not invent pass percentages now.

## 4. Real HDR spatial bloom is a multipass renderer change

Current `bloom` is per-pixel halo/lift; it cannot spread light to neighboring pixels. A real optical postprocess requires:

1. Geometry/material shader writes **scene-linear radiance** to an `RGBA16F` offscreen framebuffer; no display encoding/tone map in this pass. Probe WebGL2 `EXT_color_buffer_float` and framebuffer completeness, with explicit fallback if unsupported.
2. Bright-pass extraction from linear luminance using an exposure-aware threshold/soft knee. Save a separate emission/glint contribution to avoid blooming every neutral white reflection.
3. Multi-resolution downsample and separable Gaussian blur (or another measured kernel) across neighboring texels; additive upsample reconstructs large and tight glint halos.
4. Composite bloom in linear HDR, *then* apply the chosen exposure and tone mapper, *then exactly one* linear-to-sRGB output conversion.
5. Retain original energy/tonal relationships: compare bloom-on/off frames and monitor clipped high-luminance percentage, chroma shift and edge bleeding. Distinguish artistic lens flare/glare from surface scattering and from physical energy transport.

Direct standalone WebGL2 route: render to FBO + ping-pong blur buffers. In a Three.js/R3F integration use EffectComposer/RenderPass/UnrealBloomPass/OutputPass with explicit linear color handling; check renderer/postprocessing version semantics and avoid double tone mapping. Fallback to LDR no-bloom or explicitly marked approximated bloom rather than silently pretending to have HDR.

## 5. Delivery order and promotion gates

- **A — Evidence registry:** units, measurements, optical constants, citations, uncertainty, metadata schema. Stop if no usable angle-resolved data; continue as literature-prior artistic baseline and label it.
- **B — Reference solver:** CPU TMM + polarizations and absorption + disorder; generate spectra/angle heatmaps and unit tests independently of GLSL.
- **C — GPU integration:** LUT/low-rank solver, object-space morphology, view/light interaction, A/B toggles, recorded camera/light poses. Compare GPU vs CPU spectra across angle sweep.
- **D — HDR:** explicit linear buffer, multi-pass spatial bloom, single output transfer; reference captures with bloom separately masked.
- **E — Calibration:** fit constrained thickness/disorder parameters on part of measured dataset, validate hold-out data and report identifiability and residuals; prohibit fitting arbitrary authored color to all images then claiming physics.
- **F — Production:** test representative Android/desktop GPUs for precision, memory, frame time, dropped frames, reduced-motion and context loss; merge into existing Abalone runtime only after visual, quantitative, and device gates are documented.

## Research baseline (external, not specimen-specific measurements)

- Hyperspectral interference tomography of nacre (PNAS 2021): https://pmc.ncbi.nlm.nih.gov/articles/PMC8053970/
- Nacre structure and structural color (Scientific Reports 2021): https://www.nature.com/articles/s41598-021-99327-4
- Abalone tablet/organic layer dimensions (Acta Biomaterialia 2007): https://www.sciencedirect.com/science/article/pii/S1751616107000021
- Three.js color management (linear color, half-float targets, OutputPass): https://threejs.org/manual/pages/color-management.html
- EffectComposer + UnrealBloomPass: https://threejs.org/docs/pages/EffectComposer.html and https://threejs.org/docs/pages/UnrealBloomPass.html

Do not promote evidence class from HYPOTHESIS to MEASURED without a data source, calibration provenance and held-out error check.
