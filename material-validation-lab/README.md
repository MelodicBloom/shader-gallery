# Material Validation Lab v0

**Purpose:** turn visual references and reusable rendering sources into bounded, inspectable material trials. The Lab does not certify physical accuracy, device performance, or production readiness from a successful compile alone.

## Authority and boundary

The Lab is an evidence and validation layer for `shader-gallery`. It does not replace:

- `shader-grammar` for the semantic material vocabulary;
- Shader Library v1 for fullscreen-WebGL2 runtime studies;
- `docs/optical-studies-02.html` for the existing standalone Optical Studies surface.

It owns source provenance, compatibility decisions, controlled material records, and pass/fail trial receipts. New production shaders are promoted only after a record has passed its declared trial.

## Baseline stack and wiring

| Layer | Selected baseline | Why | Boundary |
|---|---|---|---|
| Display runtime | Existing Shader Library v1, WebGL2, GLSL ES 3.00 | Already has manifest, metadata, static fallback, compile smoke and browser QA conventions | It can host a shader study, not a glTF PBR reference material unchanged |
| PBR reference lane | Three.js `MeshPhysicalMaterial` + GLTFLoader | Direct support for glTF-style iridescence, anisotropy, transmission and dispersion | Reference comparison only until a named Three.js version and assets are pinned |
| Optical adaptation | Small, attributed GLSL modules | Preserves mathematical provenance and makes per-material differences explicit | No unreviewed shader bundle or whole-repository import |
| Reference fixtures | Khronos glTF sample assets | Interoperable, documented test assets | A sample asset is not an original Jennipher material or a performance benchmark |
| Evidence / validation | JSON material records + Node verifier + screenshots / state receipts | Separates “compiled”, “looks plausible”, and “matches a declared behavior” | Visual acceptance remains a human review gate |

## Three pilot records

1. **Khronos Abalone Baseline** — load the licensed reference asset; inspect map semantics and reproduce its declared channels with controlled lighting.
2. **Soap Bubble Spectral Adaptation** — preserve only the MIT-licensed, two-beam spectral/Fresnel mechanism; author a new thickness field, geometry, controls and integration.
3. **Gold Foil Field Study** — use original deterministic folded-height/roughness fields with standard metallic reflection; do not reuse an unverified source asset.

## Design conventions

- One material record owns claims, controls, source use, camera/light fixture, fallbacks, tests and non-claims.
- Parameters are semantic (`filmThicknessNm`, `roughness`, `foldAmplitude`), unit-bearing where applicable, bounded, and never named `magic`, `strength`, or `rainbow`.
- **Physics controls** and **art-direction controls** are separate groups. Art controls may alter a proxy but may not inherit a physical claim.
- All non-colour maps use `NoColorSpace`. Channel packing is declared explicitly.
- A reference needs at least three controlled views: neutral, grazing, and light sweep. A static hero match cannot pass a view-dependent material.
- Reduced motion freezes time and leaves manual camera/light controls functional. WebGL failure exposes a labeled static fallback and record metadata.
- No material is called spectral, measured, mobile-optimized, or PBR-portable without a separate executed trial proving that claim.

## Definitions of done

### Record complete

- Validates with `node packages/shader-library-v1/source/tools/validate-material-lab.mjs`.
- Has a named source, license disposition, freshness date, purpose, exact permitted use and rejection reason for excluded source elements.
- Has at least one falsifiable trial, controls, fallback behavior and non-claims.

### Pilot pass

- Record-complete check passes and deliberately mutated record fails.
- Its shader or reference loader compiles in the declared environment.
- Neutral, grazing and light-sweep captures are saved with camera, light, exposure, material state and renderer receipt.
- Human review confirms the behavior criterion and no declared failure condition occurs.
- The result stays labeled `pass`, `fail`, `blocked` or `inconclusive`; it is never silently promoted by a screenshot.

## Execution order

1. Resolve exact commit / asset hash for each external source.
2. Run the Abalone acquisition and map-channel trial before authoring a procedural nacre map.
3. Port the Bubble mechanism in isolation; compare it against a non-spectral RGB proxy control.
4. Build Gold Foil from original fields; evaluate lighting response rather than an image match.
5. Only then choose whether a Three.js/R3F presentation adapter earns implementation. The current Shader Library has no R3F dependency, so adding one now would be architecture by enthusiasm.

## Pilot #1 status — MVT-ABALONE-001

Executed 2026-10-26 in `reference/abalone/` (isolated Three.js lane). Label **`inconclusive`**: automated checks measured, synthetic R/G test maps and human review outstanding. Receipt: `reference/abalone/receipts/receipt.json`; build docs: `receipts/BUILD_HANDOFF-MVT-ABALONE-001.md`, `receipts/BUILD_RECEIPT-MVT-ABALONE-001.md`.
