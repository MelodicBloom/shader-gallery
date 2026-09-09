# Shader Grammar v0.1

A typed, implementation-neutral shader ontology. Materials are graphs assembled from four first-class concepts: parameters, fields, operators, and recipes. Specimen names are labels, never primitives.

## Contents

- `schemas/`: four JSON Schemas (Draft 2020-12)
- `ontology/`: reusable parameter, field, and operator catalogs
- `material-taxonomy.yaml`: orthogonal morphology/transport families
- `recipes/`: 12 deliberately different validation specimens
- `examples/`: a minimal recipe plus illustrative GLSL and WGSL
- `scripts/validate.mjs`: dependency-free schema and ontology checks
- `reports/validation-matrix.md`: coverage and generalization evidence

## Validate

Node.js 18 or newer is the only requirement.

```sh
npm test
# or
node scripts/validate.mjs --strict
```

The validator checks the package against the included schema subset actually used, validates catalog and recipe structure, resolves all primitive and taxonomy references, verifies graph endpoints, rejects duplicate IDs, rejects specimen names in primitive IDs, and fails strict mode when a recipe-used primitive appears in fewer than two specimens. For independent full Draft 2020-12 conformance, use any standards-complete JSON Schema validator against the same files.

## Recipe model

A recipe binds normalized artistic controls to shared parameter definitions, instantiates shared fields/operators, connects instances in a graph, and maps graph nodes to renderer outputs. Physical units stay in the ontology; renderer-specific storage stays in the GLSL/WGSL representation hints.

## Version boundary

v0.1 deliberately does not standardize polarization, fluorescence, multiple scattering, conductor complex IOR, or explicit spectral sampling grids. These are documented as gaps rather than hidden inside specimen-specific nodes.
