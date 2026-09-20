# Frontier Geometry Protocol v0.1 — Design Specification

**Repository:** MelodicBloom/shader-gallery  
**Design branch:** `docs/frontier-geometry-protocol-v0-1`  
**Base SHA:** `e28557bfd44076f4c06baae8cab620f96574ab3c`  
**Status:** Design approved in conversation; written-spec review pending  
**Date:** 2026-09-20

## 1. Purpose

The Relational Lightfield Material Lab is a governed shader and geometry research instrument. It treats geometry, material, light, projection, sound, observation, and perception as related but independently testable layers.

The project is not a generic node editor, a sacred-geometry ornament pack, or a speculative WebGPU rewrite. It extends the existing WebGL2 shader-library architecture through evidence-gated experiments.

The core principle is:

> Projection is not ontology. An observed pattern is the consequence of relationships among intrinsic structure, embedding, fields/material, illumination, cast projection/occlusion, receiver, and observer.

A second principle follows:

> Form may be treated as a visible consequence of relationships rather than as the primitive.

## 2. Current repository authority

The current source package remains `packages/shader-library-v1/source/`.

Existing integration rules remain authoritative:
- keep root `aurora/`, `abalone/`, and `docs/` unchanged unless a later reviewed integration PR explicitly changes them;
- do not replace the root gallery wholesale;
- keep package-scoped validation and preview generation;
- root-gallery integration is a later reviewed step.

The current package is `@melodicbloom/shader-gallery@0.1.0`, ESM, Node >=20, with WebGL2 compile validation and deterministic preview tooling.

The current runtime baseline remains zero-dependency WebGL2 via `src/core/ShaderPlayer.js` and fullscreen-quad support. This design does **not** make Three.js or WebGPU baseline dependencies.

## 3. Architecture evolution

The project follows an evidence-gated A -> B -> C progression.

### A — governed laboratory
One distributable system; strong contracts, provenance, deterministic snapshots, experiments, QA, and measurement. Physical package extraction is delayed until real consumers prove the need.

### B — extracted platform boundaries
Extract independently reusable contracts/library/runtime only after multi-consumer pressure and independent release cadence are observed.

### C — developer platform
Renderer-neutral APIs, external SDK commitments, and alternate backends only after demonstrated demand.

This explicitly chooses against premature package multiplication and speculative renderer abstraction.

## 4. Causal model

The canonical causal chain is:

1. Origin / relation / construction
2. Intrinsic geometry
3. Embedding
4. Field / material
5. Illumination
6. Cast projection / occlusion
7. Receiver
8. Observation
9. Perceived pattern
10. Measurement / evidence / optional sonification

`castProjection` and `viewProjection` are distinct concepts.

Observed state must never silently overwrite intrinsic state.

## 5. Epistemic classes

Every non-trivial claim or mapping must be typed as one of:

- EXACT_MATH
- DERIVED_MATH
- PHYSICAL_MODEL
- EMPIRICAL
- HISTORICAL
- PROJECT_INTERPRETATION
- SONIFICATION_MAPPING
- HYPOTHESIS

A project interpretation or sonification mapping must not be described as material physics or historical fact.

## 6. Geometry grammar

Candidate foundational operators:

- ORIGIN
- RELATE
- RADIATE
- INTERSECT
- CONNECT
- CLOSE
- ORBIT
- REFLECT
- REPEAT
- LIFT
- SECTION
- DUALIZE
- STELLATE
- SUBDIVIDE
- EMBED
- EXCITE
- SUPERPOSE
- BIFURCATE
- ILLUMINATE
- CAST
- OCCLUDE
- RECEIVE
- OBSERVE

Sacred geometry is treated as a generative construction grammar and historical/symbolic research layer, not as an unsourced frequency table.

Separate genealogies must remain distinct:
- simplex/dimensional: point -> segment -> triangle -> tetrahedron -> n-simplex;
- radial/relational: point -> circle -> equal-circle intersection -> vesica/mandorla -> triangle -> rosette/lattice;
- regular-solid/duality: tetra self-dual; cube <-> octahedron; dodecahedron <-> icosahedron;
- wave/spectral: domain -> operator -> modes -> nodes/antinodes -> pattern.

## 7. Candidate experimental corpus

The new corpus is additive and provisionally named `mandala-system-v1`. It must not overwrite the existing library-v1 collection.

1. Symmetry Fold — structural invariants
2. Woodgrain — intrinsic coordinates
3. Abalone Nacre — angle-dependent optics
4. Marble Vein — coherent scalar fields
5. Cork Granule — local statistical structure
6. Turquoise Matrix — network structure
7. Opal Fire — distributed optical domains
8. Labradorite Schiller — anisotropic directional response
9. Silver Specular — calibration/control material
10. Granite Aggregate — deterministic heterogeneous composition
11. Stone Relief — geometry/depth/shadow truth
12. Quilled Paper — shader/geometry-composite boundary
13. Metallic Gold Foil — multi-scale normal/orientation behavior
14. Bloom / Flare Burst — downstream observation/postprocess
15. Master Kaleidoscope — reproducible causal compositor

## 8. First implementation wedges

### Wedge A — Projected Linearity

**Question:** Can a curved intrinsic source generate an apparently straight projected structure under a controlled projection arrangement?

Minimum apparatus:
- one curved/grid source;
- analytic point/central or directional projection;
- planar receiver;
- independent observer;
- Silver calibration material;
- measured projected-linearity error.

Tests must distinguish intrinsic geometry from received/observed geometry.

### Wedge B — Observation-Dependent Material

**Question:** Can one canonical scene demonstrate that material state, emitter state, and observer state are independently meaningful?

Specimens:
- Silver Specular as calibration/control;
- Abalone Nacre as broader angle-dependent specimen;
- Labradorite Schiller as directional/anisotropic specimen.

The baseline must exist before any sacred-geometry or sound coupling is introduced.

## 9. Reference and interactive authority

Each experiment may have:

- REFERENCE — highest-fidelity governed state;
- ULTRA;
- STANDARD;
- CONSTRAINED;
- REDUCED;
- STATIC.

Try adaptive quality before creating a separate implementation. If reference and interactive implementations diverge, record:
- why the fork exists;
- structural fidelity;
- perceptual fidelity;
- behavioral fidelity;
- performance delta.

## 10. Semantic controls and state

Stable public controls describe semantic intent. Raw GLSL uniforms remain advanced/non-stable unless deliberately promoted.

Material Preset:
- portable semantic design intent.

Scene Snapshot:
- implementation/version;
- geometry;
- camera/observer;
- emitter/light;
- receiver;
- time/seed;
- render profile;
- colorspace;
- evidence links.

Historical snapshots are immutable. Migration creates a derived artifact with explicit transformation records.

## 11. QA and evidence

Initial candidate thresholds are test targets, not claims of current measured performance.

- C8 intrinsic symmetry error: <=0.005 PASS; 0.005-0.015 REVIEW; >0.015 FAIL.
- Seam edge MAE: <=0.005 target; <=0.015 review; >0.015 fail.
- Analytic projected-linearity domain RMSE: <=1e-4 for exact reference calculations.
- Raster projected-linearity: <=0.5 px at 1024 px reference target, with apparatus recorded.
- Desktop STANDARD target: ~16.7 ms median frame time; report p95 separately.
- Mobile CONSTRAINED target: ~33.3 ms median; measure on named hardware/browser.
- Static fallback must always exist for unsupported/overloaded devices.
- Reduced-motion mode cannot require continuous animation to understand the experiment.
- Resource cleanup must not leak contexts/resources after repeated mount/unmount.
- Every benchmark must record hardware, OS, browser, resolution, DPR, profile, warm-up, and sample window.

Generated concept art and mockups are not QA evidence.

## 12. Web and mobile product shape

### Web/desktop
- causal multi-view laboratory;
- intrinsic <-> observed comparison;
- rich controls;
- side-by-side reference/interactive comparisons;
- evidence/metrics inspection.

### Mobile
- one live experiment at a time;
- touch-first semantic controls;
- large viewport;
- one primary causal relationship per screen;
- graceful degradation: samples -> DPR -> update rate -> one live surface -> frozen material with live explanatory overlay -> static governed reference.

## 13. Non-goals for Stage A

Do not build yet:
- general node editor;
- universal shader IDE;
- WebGPU rewrite;
- Three.js baseline;
- general CAD kernel;
- full finite-element solver;
- arbitrary cyclic visual-programming graph;
- marketplace;
- cloud preset accounts;
- unsourced sacred-frequency table;
- full AETHER integration.

## 14. Corrected visual-model rules

Concept mockups are useful targets but are non-authoritative. Any mockup that shows the following should be corrected in implementation/docs:

- WebGPU as the current primary runtime;
- Three.js as a required baseline dependency;
- a single linear sacred-geometry ladder from tetrahedron through all regular solids;
- `receiver` as camera/viewpoint;
- cast projection and observer/view projection as one operation;
- "15 shaders implemented" before they exist;
- AETHER integration as current rather than future;
- invented benchmark/status values.

The authoritative baseline is existing zero-dependency WebGL2 plus evidence-gated extensions.

## 15. Promotion gates

FRONTIER -> APPLIED requires at least one:
- capability unavailable through a simpler method;
- equivalent effect at measurably lower cost;
- materially better semantic/control model;
- stronger repeatable material identity;
- reusable mechanism across at least two shader families.

APPLIED -> CANONICAL additionally requires:
- stable semantic contract;
- deterministic reference state;
- QA;
- performance class;
- mobile/static fallback;
- accessibility;
- provenance;
- migration story.

## 16. Written-spec review gate

No production implementation should begin from this branch until this written specification is reviewed.

After approval:
1. create the detailed implementation plan using the writing-plans process;
2. use test-first development for behavior changes;
3. implement only the first bounded wedge before widening scope.
