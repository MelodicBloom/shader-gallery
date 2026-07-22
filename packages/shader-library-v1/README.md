# Shader Library v1 package

This directory adds the compile-validated MelodicBloom shader-library overlay without replacing the repository's existing standalone Aurora, Abalone, or GitHub Pages files.

## Contents

- `melodicbloom-shader-library-v1-source.zip` — source-only package containing 15 WebGL2 fragment shaders, semantic metadata, `ShaderPlayer`, validation tools, docs source, CI, and Netlify configuration.
- Generated PNG previews are intentionally excluded from this source archive; regenerate them after extraction with `npm run generate:previews`.

## Install beside the existing gallery

```bash
mkdir shader-library-v1
unzip melodicbloom-shader-library-v1-source.zip -d shader-library-v1
cd shader-library-v1
npm test
npm run generate:previews
```

The package remains isolated under `packages/shader-library-v1/` until its architecture and deployment behavior are reviewed and intentionally integrated.
