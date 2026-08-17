---
name: investigating-projected-geometry
description: Investigate a shader, image, shadow, curved surface, map, projection, reflection, or observed pattern when its visible form may differ from the geometry or field that generated it. Use to separate source geometry, illumination, cast projection, receiver, observer, and measured appearance before recommending shader architecture or controls.
---

# Investigating Projected Geometry

## Apply the causal chain

Do not infer intrinsic geometry directly from a final image. Model the phenomenon as:

```text
intrinsic domain
→ embedding
→ field
→ emitter
→ cast projection
→ occlusion
→ receiver
→ observer
→ observed pattern
```

Treat cast projection and view projection as independent unless the apparatus explicitly makes them identical. Do not reduce structural causes to generic `distortion` or decorative UV manipulation.

## Classify each statement

Label every important claim as exactly one of:

```text
EXACT_MATH
DERIVED_MATH
PHYSICAL_MODEL
EMPIRICAL
HISTORICAL
PROJECT_INTERPRETATION
SONIFICATION_MAPPING
HYPOTHESIS
```

Do not present a historical association, project interpretation, or sonification mapping as a physical material mechanism. Separate what is known, derived, assumed, and proposed.

## Return the investigation in this order

For each phenomenon, provide:

1. **Observation** — State only what is visibly or instrumentally observed.
2. **Intrinsic-source hypotheses** — Identify possible source domains, geometry, and field structure.
3. **Projection hypotheses** — Identify candidate emitter and cast-projection models.
4. **Receiver hypotheses** — Identify the surface or domain on which the pattern is registered.
5. **Observer hypotheses** — Identify the camera or viewing transform and any view-dependent effects.
6. **Invariants** — State properties expected to survive the transformation.
7. **Competing explanations** — Include at least one simpler alternative.
8. **Controlled experiment** — Change one variable at a time.
9. **Measurement** — Define a quantitative metric and acceptance rule.
10. **Falsification** — State what result would reject the preferred explanation.
11. **Shader-system implication** — Assign the behavior to geometry, embedding, field, material, emitter, projection, receiver, observer, or post-processing.
12. **Web and mobile implication** — State performance cost, fallback, and quality reduction strategy.
13. **Provenance classification** — Apply the classes above to each important conclusion.

## Use the minimum projection experiment

When source geometry may cause a visible pattern, compare at least:

| Condition | Change from prior condition | Purpose |
|---|---|---|
| A | Planar source and planar receiver | Establish a control. |
| B | Curved source; same receiver | Isolate source curvature. |
| C | Same curved source; changed emitter | Isolate cast projection. |
| D | Same source and emitter; changed receiver | Isolate receiver geometry. |
| E | Same physical scene; changed observer | Isolate observation. |

Hold all non-listed variables fixed. Use three or more mathematically distinct arrangements if the task requires an architectural recommendation.

## Measure rather than eyeball

Prefer measured invariants over visual judgment. Use the least complex metric that addresses the claim:

```text
projected line-fit error
angular distortion
local scale
area scale
anisotropy
orientation change
symmetry error
topology preservation
temporal continuity
```

For a projected-linearity claim, retain source and projected sample points. State the reference resolution and distinguish analytic/domain error from raster error.

## Select the least costly causal implementation

Before proposing a shader parameter, decide where the variable belongs. Do not hide a structural variable inside a generic `distortion` control.

Begin with the simplest causal implementation:

1. Prefer an analytic projection when geometry permits it.
2. Use a minimal WebGL2 mesh/depth apparatus for arbitrary geometry.
3. Reserve raster, depth, multi-pass, or reference-only methods for cases that require them.
4. Offer a mobile degradation ladder that preserves the experiment’s meaning before visual extravagance.

Do not introduce Three.js merely to obtain a sphere or WebGPU as a prerequisite. Do not recommend a general scene engine unless measured multi-consumer pressure demonstrates the need.

## Reject common shortcuts

Do not assume that:

- visible straightness proves a straight source;
- visible symmetry proves intrinsic symmetry;
- an observed color change proves a material-state change;
- a changed shadow proves a source-geometry change;
- a visually compelling mapping is a physical explanation.

End every recommendation with the minimum apparatus, an alternate apparatus, a rejected approach, the expected failure mode, and the promotion criterion from frontier to applied research.
