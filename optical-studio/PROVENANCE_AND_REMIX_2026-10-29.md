# Optical Studio v1.2 — Provenance, Remix, and Executable Dispersion Instrument

Status: research/implementation packet, 2026-10-29. No site deployment, Gallery merge, browser GPU, hardware performance or physical calibration is claimed.

## Preserved source text (verbatim, user-supplied)

**Revised claim (use this):**
> MelodicBloom Optical Studio is a reverse-engineered, abstracted remix of [oavivo Dispersion](https://oavivo.github.io/dispersion/) — pedagogy and control grammar borrowed; renderer, material studies, evidence gates, and Gallery integration are ours.

- **Built:** 7 GLSL studies with hashes; Snell / Schlick / chromatic IOR; QUALITY_GATES + ROADMAP_NACRE_HDR (evidence → TMM/Snell nacre → acceptance).
- **Taken from oavivo (credited):** material strip + n_d/Abbe framing, Make-your-own grammar, Cauchy + 7λ + honest 3× display spread, stripe/shape fixtures, target-vs-rendered readout discipline.
- **Won’t claim:** their UI as ours; calibrated Abbe of a real sample; Pages-published Optical Studio yet; perf/a11y without receipts.

**Teeth next:** Cauchy presets on crystal-lens (or a dedicated study) → link from Gallery after #37/#10 → fold the Oct 8 video QA contract into QUALITY_GATES → keep Nacre HDR as the physics track under measured labels.
Receipt: `/workspace/reports/hiring-pack-2026/lucky-dispersion-claim-card-remix-2026-10-29.md`

Note: the receipt path is user-reported; this environment has not opened that file and does not claim to have created or updated it.

## I. Evidence and custody ledger

| Evidence | Location / source | Observed status | Allowed claim |
|---|---|---|---|
| Optical Studio 1.2 seven sources, metadata, SHA-256 manifest | MelodicBloom/shader-gallery PR #13, `feat/optical-studio-v1.2-abalone-lab/optical-studio/` | Retrieved PR, README, QUALITY_GATES, roadmap, manifest and crystal shader/metadata | Seven-study independent WebGL2 lab; archived Mesa compilation/draw evidence; not browser-device proof |
| Optical Studio QA | `optical-studio/QUALITY_GATES.md` on PR #13 | Prior 7 compile/link/draw PASS recorded; WebGL2 browser NOT TESTED; physical calibration NOT CLAIMED | Archive test results, not re-executed here |
| Crystal Lens shader | `optical-studio/shaders/crystal-lens/shader.glsl` | Three proxy wavelength Snell paths, Schlick, GGX, authored caustic | Optical modeling approximation; Cauchy presets NOT integrated |
| oavivo app | https://oavivo.github.io/dispersion/ | Live explanatory page inspected | Pedagogy and reference implementation credited, not copied |
| oavivo source README | https://github.com/oavivo/dispersion | Independent fragment shader; 7 wavelength samples; material/shape grammar; 3× artist exaggeration explicitly disclosed | Source comparison only; no root LICENSE observed; no code/assets copied |
| Standard dispersion mapping | Khronos KHR_materials_dispersion (ratified) | n_d, Abbe, Cauchy 2-term math and d/F/C wavelengths | Analytical model benchmark; not full physical path tracer |
| Formal Abalone lane | Shader Gallery PR #31 | 7+ controlled experimental runs, some pass/fail and inconclusive trial status, human review open | Component-level channel sensitivity, NOT calibrated nacre |
| Pages repair | Shader Gallery PR #37 | PR open: root landing + corrected `/docs/` link; no `/optical-studio/` publication | Pages navigation is separate pending action |
| Graph ingestion | Shader Gallery PR #10 | Open Neo4j ingestion PR; NOT a Gallery hook | Preserve as independent evidence link path |
| Oct 8 video QA | Prior conversation/archive pointers to Dispersion.mp4, observation-corpus.json, integration-architecture.md, implementation-plan.md, qa-matrix.md | Earlier report: 41 timestamped frames of 4:16.872, but not re-verified here | Treat as historical observation, not currently re-reviewed footage |

## II. Causal mechanism crosswalk

| Reference teaching/interaction grammar | MelodicBloom present capability | Next falsifiable comparison |
|---|---|---|
| Material examples and Make-your-own `n_d/V_d` | Crystal-Lens has independent `paletteShift` and `spectral`/`dispersionUI`; no Abbe mapping | Vary Abbe at fixed `n_d`; predicted physical `n_F-n_C` changes inversely; measured rendered differential does so after renderer adapter |
| 7 wavelength rays from Cauchy | Crystal-Lens 3 proxy channel Snell paths; proposed new instrument has 7 numeric reference samples | Do not call 3-path GLSL spectral integration; compare three-channel proxy to 7-sample reference in fixed geometry |
| Shapes: drop, lens, prism, gem, crystal | Existing crystal, prism, moissanite, ripple and related separate studies | Fixed known geometry plus white stripe chart; compare exit direction, TIR, color spread |
| Explicitly 3× screen-legibility effect | New instrument records 3× separately from physical `n_d,V_d` | Enforce that rendered exaggeration never mutates reference numeric spread |
| Target vs rendered readout | New analytic `nF/nd/nC` readout; no GPU comparison yet | Record target and measured pixel/fringe or ray angle in same fixture and trace setup |
| View/light movement and video scene | v1.2 archival perturbation checks; Oct 8 historical visual observation | Camera fixed/light sweep, light fixed/view sweep, frozen timeline, object tilt/occlusion motion; compare frames by timestamp and source hash |
| Caustics/shadows | Current crystal Gaussian focal proxy, not validated transport | Compare analytic focus and reference ray/path tracer under same scene; reject 'physical caustic' without evidence |
| Materials with multilayer structure | Abalone artistic six bands, three depth contributions | CPU TMM with measured optical constants; reference spectra → angular LUT → GPU → held-out optical measurements |

## III. Distinct model/effect classes

- Mathematical laws already employed in bounded form: Snell refraction, Schlick approximation, Fresnel-like responses, per-channel index dispersion. They are not by themselves proof of full physical realism.
- Optical proxy: three-channel sampled index and screen-space mixing. This is *not* seven-wavelength spectral rendering or 3D Monte Carlo light transport.
- Physically parameterized forward model: Cauchy fit from `n_d` and Abbe, valid approximately over a bounded transparent band; reference values can be computed exactly relative to the chosen model while remaining uncalibrated to a sample.
- Optical reference solver: multilayer spectral TMM with polarization, absorption, incidence, uncertainties and hold-outs, still to be implemented in its authorized track.
- Postprocessing: current local per-pixel halo is not scene-linear spatial HDR bloom; separate multipass implementation and measured support required.

## IV. Configurations and when to choose them

A. **Existing self-contained WebGL2/GLSL ES 3.00** (choose now): keep seven studies stable; add `instruments/dispersion-lab/` numerical reference; later add a shader adapter with small uniform surface. Strengths: source hashes, zero new runtime dependencies, close to existing code. Risks: custom interaction plumbing, hand-built path approximations and device support.

B. **Isolated Three.js MeshPhysicalMaterial reference** (already exists for Abalone in PR #31; do not hijack its approval): use `ior`, `transmission`, `dispersion` for fixed glTF geometry; compare n/Cauchy with standard `KHR_materials_dispersion` translation (`dispersion = 20/V_d`). Strengths: reference PBR controls, glTF portability, comparable captures. Risks: volume/environment/tonemap and simplified channel transport; not a calibrated spectral renderer. No cross-repo migration from this comparison.

C. **Spectral and TMM reference CPU** (second-stage physics): Python/NumPy spectral solver, verified Snell/TMM, polarization, reflectance-vs-angle and wavelength, held-out data, LUT export. Strengths: inspectable invariants, error bounds. Risks: unidentifiability and missing optical constants; do not fit synthetic screenshots and call it measured.

D. **Hybrid physically based geometry + custom optical operators** (later multi-studio consumer): Three/R3F scene host, optional optical GLSL layers, source-field maps, linear-HDR composer. Strengths: reusable scene composition, authored art direction, integration with Motion Oracle, Shader Grammar and Seed Loom. Risks: shader version fragility, double tone mapping, transmission and OIT, mobile memory, maintenance duplication. Gate C/D before promotion.

E. **Path-traced/WebGPU high-fidelity reference** (conditional research only): converged energy/path baseline, measured performance and feature parity. Reject as default unless faster lanes fail falsification or require multi-bounce/caustic accuracy. WebGPU support must be explicitly tested rather than assumed.

## V. Cross-project authority

- `MelodicBloom/shader-gallery`: owns standalone runtime, fixtures, QA, image/GLSL source hash, galleries, local acceptance labels, and experiments.
- `qt314wink/shader-grammar`: owns reusable optical operators, equations, typed parameters and recipes; receives stable mechanism descriptions AFTER isolated tests.
- `qt314wink/seed-loom` or current canonical Seed Loom owner: owns semantic graph, provenance events, evidence qualifiers, source/trial relations, temporal and confidence policies; do not duplicate ontology in Gallery.
- `MelodicBloom/design-standards-2026-2027`: owns UI, motion, accessibility and performance design specifications; tests remain runtime-local.
- `MelodicBloom/.github`: canonical repository registry and cross-repo governance.
- `MelodicBloom/melodyfire`: downstream recruiter-facing case-study consumer, not shader code authority.
- Material Validation Lab: formal trial receipts and promotion decisions; Abalone G1/cross-channel tests stay independent from this Cauchy instrument.

## VI. Gallery publication gate

1. Existing PR #37's root/docs route and deep links should deploy and pass real URL smoke tests; PR #10 is a graph-ingestion PR, not a UI prerequisite.
2. Reconcile open PR #13 and previously separate optical branch work. The seven v1.2 hashes are source locks: changing shader.glsl requires new hashes/previews and regression receipts; no silent mutation.
3. Add the instrument only as an **Analytic · Experimental** label in `/optical-studio/`, not as a physically calibrated shader specimen. The instrument's seven spectral points are numeric, not GLSL ray samples.
4. Add Gallery link to `/optical-studio/` only after a checked Pages deployment and route fallback; maintain no broken root cards. A future link to the dedicated instrument can target `optical-studio/instruments/dispersion-lab/`.
5. Gallery card: **Optical Studio · seven WebGL2 studies, provenance-cited, experimental**. Supporting badge: **Cauchy analytic reference (not shader-integrated)**. Evidence metadata connects to PR #13 hashes and PR #31 independent abalone trials.

## VII. Video QA contract supplement (historical source not in hand)

Keep the October 8 work as a *reconstruction contract*, not an observed pass in this session:

- For each video reference: source URL/file hash, fps, duration, codec, transfer/colorspace, frames selected/timestamps and extraction method; explicitly distinguish recorded frame from generated reconstruction.
- Historical report says 41 timestamped frames over 4:16.872; do not mark freshly verified until source is reacquired and re-decoded. Previous black extraction frames were an extraction issue, not proof of blank content.
- Segment view/shape deformation, second-object motion, distortion, TIR facet darkness, spectral fringes, specular highlight, shadow/bright-core, floor/reflection and underglow. Each segment has two competing causal hypotheses.
- For every appearance hypothesis, design a falsifier: hold light and camera fixed independently, show neutral/no-dispersion control, test frozen time, vary IOR and Abbe separately, restore baseline; sample 3-5 equally-identified reference frames at fixed poses.
- Every comparative capture records source hash, fixture ID, renderer/version, GPU vs software identity, viewport and DPR, exposure, tone mapping, illumination, frame time method, image hash, target-vs-rendered error metric, and observer/reviewer outcome.
- Distinguish motion smoothness and visual continuity from physical optics accuracy. Reduced-motion should preserve information, not merely stop pointer reactions.
- Status states: NOT_REVIEWED / REFERENCE_OBSERVED / SOURCE_RECONSTRUCTED / NUMERIC_TESTED / GPU_TESTED / HARDWARE_REVIEWED; no automatic physical PASS from likeness.

## VIII. Definition of done for next bounded sprint

- New original Cauchy model module with derived coefficients, nF/nd/nC, numerical seven-wavelength index table, 3x display-only spread and exported candidate JSON.
- Unit tests cover normalization, monotonic dispersion, Abbe inverse spread, input failure, and exaggeration separation; run with Node 22.
- Standalone original material strip and chart; keyboard interactions and labels coded, but not yet browser-tested.
- Source provenance explicit and license/copy scope bounded.
- No mutation to v1.2 shader source, source hashes, production gallery, root Pages, or calibrated nacre claim.
- Follow-up needs browser and actual GPU tests, plus a separate integration PR after #13 reconciliation.

## IX. External bibliography

- oavivo live: https://oavivo.github.io/dispersion/
- oavivo source/README: https://github.com/oavivo/dispersion
- Khronos dispersion: https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_materials_dispersion/README.md
- Khronos iridescence: https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_materials_iridescence/README.md
- Three.js MeshPhysicalMaterial: https://threejs.org/docs/pages/MeshPhysicalMaterial.html
- Nacre TMM literature starting point: https://pmc.ncbi.nlm.nih.gov/articles/PMC8053970/
- Optical Studio original PR #13: https://github.com/MelodicBloom/shader-gallery/pull/13
- Abalone controlled trial PR #31: https://github.com/MelodicBloom/shader-gallery/pull/31
- Pages PR #37: https://github.com/MelodicBloom/shader-gallery/pull/37
- GitHub PR #10 graph-ingestion contract: https://github.com/MelodicBloom/shader-gallery/pull/10