# Atelier v2 migration notes

Eight signature materials were migrated from the visual atelier into canonical recipe JSON:

- Nacre Laminate
- Washi Fiber Field
- Lithographic Grain
- Stained-Glass Light
- Brass Inlay Edge
- Guanine Crystal Facets
- Mycelial Bloom Network
- Carved Marble Vein

The migration replaces custom one-off JavaScript bindings with generic parameter bindings. Vector values and matrix coefficients use indexed component bindings, allowing the same compiler to edit anisotropic frequencies and alpha thresholds without recipe-specific code.
