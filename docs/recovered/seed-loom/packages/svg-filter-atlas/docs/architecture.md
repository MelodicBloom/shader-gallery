# Architecture

The package is source-first. Recipe JSON is authoritative; generated SVG, CSS, registry data, and framework adapters are derivatives.

```text
recipes/*.json
  → structural validation
  → generated TypeScript catalog
  → compiler
  → definitions.svg / registry.json / presets.css
  → React and Astro consumption
```

## Invariants

1. Every adjustable value is declared once as a parameter.
2. Every parameter binds to an existing primitive attribute.
3. Presets only override declared parameters.
4. Static IDs are deterministic: `mb--{recipe}--{preset}`.
5. Dynamic instances must receive a caller-owned unique ID.
6. Generated artifacts are reproducible and should be committed.
