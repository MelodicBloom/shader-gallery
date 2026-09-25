# Feature ownership and next work

Repository owner: **MelodicBloom/shader-gallery**. Package: **packages/shader-grammar/**. The owner's 2026-09-09 designation resolves intake authority; AETHER consumes this package downstream. Individual reviewer identities and package licensing remain maintainer decisions.

| Workstream | Status | Responsible role | Acceptance evidence |
|---|---|---|---|
| Canonical intake | Implemented on intake branch | Repository maintainer | Unchanged 28-file manifest, separate baseline commit/tag |
| Structural guardrails | Implemented; port typing pending | Grammar maintainer | Baseline pass and ten diagnostic-specific negative fixtures |
| Backend profiles | Planned | Renderer maintainer | GLSL/WebGL and WGSL/WebGPU contracts with compilation fixtures |
| Spectral conventions | Planned before optics backends | Optics maintainer | Wavelength grid, observer, illuminant, working space and conversion fixtures |
| Reference renderer | Planned after contracts | Renderer maintainer | Deterministic thin-film and volume samples with golden images |
| Benchmarking | Validator comparison implemented; GPU pending | Performance maintainer | Alternating validator measurements; later device/render profiles |
| Corpus cleanup | Deferred to next version | Corpus maintainer | Distinct minimal example, explained unused parameters, real equations and port signatures |
| Repository governance | Ownership recorded; human review/license pending | Repository maintainer | Reviewed PR, release policy, explicit package license and reviewer assignment |

Review baseline intake before QA additions. Keep original file hashes fixed for the prototype tag. Add corrected semantics in a new version; publish migration notes and backend conformance evidence before describing that version as production-ready. CI is scoped to this package and does not deploy the gallery.
