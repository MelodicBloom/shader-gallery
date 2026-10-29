
## Newly uploaded Interactive Shader archive — classified as a visual prototype

**Archive:** `Interactiveshader.zip`
**SHA-256:** `6fa8f6909ad19ff0e173f04ef424e0cf416788f23684a2274b7d0e637350694f`

**Observed contents:** private Vite app named `figma-make-app`, `pnpm-lock.yaml`, React 19, Three.js 0.186.1, React Three Fiber, Tailwind/Vite, and a single `src/App.tsx` containing inline GLSL ES 3.00 vertex/fragment programs.

**Observed capabilities:** interactive type/drip shader, text mask canvas, mouse/touch-driven distortion, animated wave fields, fBm/domain-warped fields, eight-sample subsurface loop, four presets, fill/outline/shadow modes, and a 14-drip signed-distance-field loop.

**Fitness:** `candidate-consumer` / `prototype`. It is useful as an interaction and art-direction reference, but it is not yet a shader-gallery package because it has no metadata contract, shader manifest, deterministic reference state, static fallback, performance receipt, or renderer QA evidence. It should consume released shader-gallery artifacts rather than become a second shader runtime.

**Graph role:** `Artifact` for the archive and `Prototype`/`ConsumerCandidate` for the app; link to shader-gallery through `CONSUMES` only after an explicit adapter is defined. Record the archive hash and do not execute its install, dev, or deploy scripts during ingestion.

**Important engineering signals:** the shader hard-codes loop counts and temporal motion, rebuilds `ShaderMaterial` on shader selection, updates a canvas texture every frame, and tracks global mouse/touch listeners. These are valuable performance and lifecycle review targets, not proof of production readiness.
