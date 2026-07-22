# Shader Library v1 integration

The extracted package is intentionally isolated at `packages/shader-library-v1/source/`.

## Validation order

```bash
npm test
npm run generate:previews
npm run build:docs
```

## Preservation rules

- Keep the existing root `aurora/`, `abalone/`, and `docs/` files unchanged.
- Do not modify the existing GitHub Pages workflow in this PR.
- Run package-scoped CI only when `packages/shader-library-v1/**` changes.
- Integrate the root gallery with the new manifest only through a later reviewed PR.
