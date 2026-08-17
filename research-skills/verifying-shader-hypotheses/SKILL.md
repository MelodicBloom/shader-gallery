---
name: verifying-shader-hypotheses
description: Propose, test, compare, promote, or reject behavior for a canonical shader, material, optical effect, geometry-material composite, or compositor. Use when an experiment must distinguish physical model, approximation, project interpretation, and frontier speculation while preserving reproducibility, performance, and mobile fallbacks.
---

# Verifying Shader Hypotheses

## Treat every shader as an instrument

Novelty does not earn promotion; evidence does. Define baseline behavior before adding frontier behavior. Do not promote a plausible-looking effect without an owned phenomenon, reproducible state, meaningful control model, and rejection criterion.

## Establish shader identity first

Before proposing an experiment, state:

```text
SHADER
CANONICAL ROLE
OWNED PHENOMENON
INPUTS
OUTPUTS
INVARIANTS
KNOWN APPROXIMATIONS
REFERENCE STATE
INTERACTIVE STATE
```

State which information is source-backed intended behavior, physical model, approximation, project mapping, or frontier speculation. Do not introduce a cross-system mechanism until the baseline behavior is clear.

## Use the hypothesis contract

Every experiment must include all of the following:

| Field | Required content |
|---|---|
| ID | Stable experiment identifier. |
| Question | The narrow behavior being tested. |
| Supposition | The causal claim under test. |
| Provenance class | `EXACT_MATH`, `DERIVED_MATH`, `PHYSICAL_MODEL`, `EMPIRICAL`, `HISTORICAL`, `PROJECT_INTERPRETATION`, `SONIFICATION_MAPPING`, or `HYPOTHESIS`. |
| Reasoning | Why the supposition is plausible. |
| Alternative explanation | At least one simpler competing account. |
| Independent variable | The single variable intentionally changed. |
| Controlled variables | Conditions that remain fixed. |
| Apparatus | Geometry, material, emitter, receiver, observer, reference state, and measurement method. |
| Expected behavior | Observable result if the supposition holds. |
| Failure behavior | Result that rejects or weakens it. |
| Metric | Quantitative measurement, threshold, or explicit comparison rule. |
| Performance cost | Expected rendering cost and measurement context. |
| Mobile consequence | Quality ladder and static fallback. |
| Promotion rule | Required evidence for its research-ring transition. |

Do not omit a field because the subject is artistic or exploratory.

## Classify cross-system coupling

Assign every intervention a coupling level and begin with the weakest level capable of testing the claim:

```text
LEVEL 0 — observational only
LEVEL 1 — geometry or field modulates shader
LEVEL 2 — geometry seeds material structure
LEVEL 3 — geometry becomes actual surface or depth
LEVEL 4 — shader participates in causal feedback
```

Explain why a lower level is insufficient before proposing a higher one. Do not treat a decorative overlay as evidence of causal coupling.

## Maintain epistemic boundaries

Sacred or historical geometry may enter as an exact construction, symmetry group, distance field, topology, seed, or project interpretation. It is not a physical material mechanism without physical evidence.

Do not map shape to absolute frequency without a declared sonification rule or a measured apparatus. Do not call symbolic correspondences mineral physics.

## Compare reference and interactive authority

Attempt adaptive quality before forking an implementation. If a reference and interactive implementation must diverge, report:

```text
CONSTRAINT CAUSING FORK
REFERENCE BEHAVIOR
INTERACTIVE APPROXIMATION
STRUCTURAL FIDELITY
PERCEPTUAL FIDELITY
BEHAVIORAL FIDELITY
PERFORMANCE DELTA
MOBILE FALLBACK
```

Keep semantic controls public and stable. Treat raw implementation uniforms as advanced/non-portable unless explicitly promoted. Distinguish portable Material Presets from immutable Scene Snapshots.

## Falsify and promote

Reject the proposal if one or more of the following is true:

- the new mechanism is visually indistinguishable from a simpler method;
- material identity collapses under controlled emitter or observer change;
- projection coupling creates temporal instability;
- performance cost exceeds demonstrated value;
- semantic controls become less understandable;
- a Scene Snapshot cannot reproduce the behavior;
- provenance is conflated or unsupported.

Promote **FRONTIER → APPLIED** only when evidence shows a new capability unavailable by simpler means, equivalent behavior at lower measured cost, a better semantic/control model, a stronger repeatable material identity, or a reusable mechanism across multiple shader families.

Promote **APPLIED → CANONICAL** only after the above and a stable semantic contract, reference and deterministic state, QA, performance class, mobile fallback, accessibility, provenance, and migration policy are all declared.

## End every recommendation with a decision

Provide the recommended minimum implementation wedge, one alternate, one rejected approach, the performance and mobile implication, known unknowns, and a promotion or rejection recommendation. Do not write repository code unless explicitly authorized after the research gate.
