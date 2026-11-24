# Optical gems — lineage C additive synthesis map
Status: **ledger only; dual-home default; aliases OPEN.**

- **A** = PR #13 Optical Studio v1.2 seven-material set (`optical-studio/shaders/*`, on `feat/optical-studio-v1.2-abalone-lab`)
- **B** = PR #15 Optical Studies 02 (opal / labradorite / spectral prism in library-v1, on `main`)
- **C** = this map. A map, not a sink.

| Specimen | A path | B path | Relation | Decision |
|---|---|---|---|---|
| Opal | optical-studio/shaders/opal-fire | library-v1 opal study | parallel | dual-home |
| Labradorite | optical-studio/shaders/labradorite-schiller | library-v1 labradorite study | parallel | dual-home |
| Spectral prism | optical-studio/shaders/spectral-prism | library-v1 spectral prism | parallel | dual-home |
| Crystal Gem alias | — | — | **OPEN** | deferred |
| Cosmic alias | — | — | **OPEN** | deferred |
| Abalone Inner Fire | optical-studio/shaders/abalone-inner-fire | — (portfolio-runtime abalone is separate) | distinct | keep separate |

## Rules
- Absorb is **not** default; requires explicit owner yes + revert plan, and even then A and B trees remain.
- Aliases are rows here, not renames on disk.
- Chosen against: silent absorb of B into A; renaming without ledger; irreversible consolidation.

## Revert
`git revert -m 1 <merge sha>` or delete this file. A and B specimens untouched.
