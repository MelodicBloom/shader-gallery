# SVG Filter Atlas v0.1 — Build Report

Built: 2026-07-22

## Verified outputs

- 8 canonical signature recipes
- 24 named presets
- 32 generated SVG filter definitions, including base recipes
- 1 generated registry
- 1 generated preset CSS file
- React and Astro adapters
- 7 passing Node tests
- Successful clean consumer import from the packed npm tarball
- Valid XML definition bundle
- Valid JSON registry

## Commands executed

```bash
npm run check
npm pack
```

## Consumer verification

The packed module was extracted into a fresh project and successfully used to:

- list all recipes;
- filter the catalog to the 3 optical recipes;
- resolve a stable static filter URL;
- compile `nacre-laminate / abalone-ridge` with a caller-owned ID.

## Known v0.1 boundary

Storybook integration is supplied as an optional source file, not as a bundled Storybook application. Browser screenshot regression and direct atelier editing are intentionally deferred to v0.2.
