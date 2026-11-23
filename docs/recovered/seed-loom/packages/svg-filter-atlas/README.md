# @melodicbloom/svg-filter-atlas

A source-first SVG material registry and compiler for MelodicBloom projects.

Version **0.1.0** migrates eight signature materials and 24 named presets from the SVG Filter Atelier into validated, reusable recipe files.

## Included

- Canonical JSON recipe schema.
- Eight approved signature recipes.
- Twenty-four named presets.
- Deterministic SVG compiler.
- Runtime registry and filter URL helpers.
- React definitions and dynamic filter components.
- Astro definitions component.
- Generated SVG definition bundle, CSS preset classes, and JSON registry.
- Node test suite and governance documentation.

## Run it

Node 20+ and TypeScript 5.8+ are required.

```bash
npm run check
```

Individual commands:

```bash
npm run validate
npm run build
npm test
```

## Runtime API

```ts
import {
  filters,
  filterUrl,
  compileFilter,
} from "@melodicbloom/svg-filter-atlas";

filters.list({ family: "optical" });
filters.get("nacre-laminate");
filters.getPreset("nacre-laminate", "abalone-ridge");

filterUrl("nacre-laminate", "abalone-ridge");
// url("#mb--nacre-laminate--abalone-ridge")

const customSvg = compileFilter(
  filters.get("nacre-laminate"),
  {
    id: "hero-nacre",
    preset: "abalone-ridge",
    parameters: { "surface-scale": 7 },
  },
);
```

## Static use

Inject `generated/definitions.svg` into the page shell, then use a generated CSS class:

```html
<link rel="stylesheet" href="presets.css" />
<article class="mb-filter--nacre-laminate--abalone-ridge">...</article>
```

An external `<object>` does not expose its definitions to the parent document. For production, inline the SVG bundle or use a framework adapter.

## React

```tsx
import {
  FilterDefinitions,
  filterUrl,
} from "@melodicbloom/svg-filter-atlas/react";

export function Card() {
  return (
    <>
      <FilterDefinitions include={[
        { recipe: "nacre-laminate", preset: "abalone-ridge" },
      ]} />
      <article style={{ filter: filterUrl("nacre-laminate", "abalone-ridge") }}>
        Nacre card
      </article>
    </>
  );
}
```

Use `SvgFilter` for a uniquely named dynamic instance.

## Astro

```astro
---
import FilterDefinitions from "@melodicbloom/svg-filter-atlas/astro";
import { filterUrl } from "@melodicbloom/svg-filter-atlas";
---

<FilterDefinitions include={[{ recipe: "washi-fiber", preset: "kozo-fine" }]} />
<section style={`filter:${filterUrl("washi-fiber", "kozo-fine")}`}>...</section>
```

## Repository placement

Recommended monorepo location:

```text
packages/svg-filter-atlas/
apps/svg-filter-atelier/
```

The atelier becomes the editor and review surface; this package remains the governed source and compiler.

## Next milestone

Version 0.2 should connect the atelier directly to this schema, add recipe import/export, produce live framework snippets, and add Playwright browser screenshots for all approved presets.
