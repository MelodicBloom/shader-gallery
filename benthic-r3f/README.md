# BENTHIC_R3F

Companion proof to [`../benthic-os/`](../benthic-os/): the same procedural-material direction implemented as a real React Three Fiber scene with Three.js geometry and a custom `ShaderMaterial`.

## Brief introduction

For hiring managers and potential clients, this is a compact technical-art sample: an art-directed, responsive procedural material built inside a maintainable React application rather than presented as an isolated shader snippet. The work connects UI semantics, scene-graph composition, GPU shader code, adaptive quality, interaction, accessibility, and automated verification in one reviewable package.

## Proof target

- React 19 + TypeScript + Vite application structure
- `@react-three/fiber` Canvas, scene graph, render loop, and pointer events
- Three.js `IcosahedronGeometry`, `ShaderMaterial`, colors, camera, fog, and orbit controls
- custom GLSL vertex displacement and Fresnel/specular fragment shading
- transient frame updates through refs instead of React state per frame
- artist-facing semantic controls, quality profiles, adaptive decline, and reduced-motion demand rendering
- TypeScript, unit, production-build, and browser QA receipts

## How it works

React owns the artist-facing parameters and quality state. R3F translates the declarative scene into Three.js objects. An icosphere provides the topology; the vertex shader samples animated 3D value noise and displaces vertices along their normals, while the fragment shader combines tissue color, a directional highlight, specular response, and a view-dependent Fresnel rim. OrbitControls handles constrained camera interaction, and a pointer press injects a short material pulse.

Frame-transient values do not travel through React state. `useFrame` mutates shader uniforms and mesh rotation through refs, while the visible FPS estimate is deliberately throttled. Quality profiles jointly control geometry detail and device-pixel ratio; PerformanceMonitor can lower the automatic profile when rendering declines.

## Performance design

- `frameloop="demand"` when paused or when the operating system requests reduced motion
- no React state update for per-frame shader time or mesh transforms
- bounded DPR profiles (`0.65–1.5`) rather than unbounded device pixel ratio
- geometry detail tied to Eco, Balanced, and High profiles
- antialiasing disabled for the full-screen organic material, with shader lighting carrying the edge treatment
- automatic quality decline unless the viewer explicitly chooses a profile
- production dependency versions pinned exactly for reproducible installs

The dependency-free WebGL2 study remains the smaller and more direct renderer. This companion is not claimed to outperform it; its purpose is to prove production-relevant R3F/Three.js architecture while retaining deliberate GPU and mobile safeguards.

## Compatibility note

Three.js is deliberately pinned to `0.182.0`. Stable React Three Fiber `9.8.1` still constructs `THREE.Clock`; Three.js deprecated that class in r183, producing a warning on every Canvas mount in newer releases. This pin keeps the stable R3F stack warning-free until its public timing API migrates to `THREE.Timer`.

This is a browser R3F/Three.js proof. It is not evidence of HLSL, Unity, Unreal, engine parity, physical-device performance, or production deployment.

## QA gates

- unit: quality clamping and downgrade behavior
- static: TypeScript `--noEmit`
- build: Vite production compilation
- browser: 1440×900 and 390×844 canvases, WebGL2 availability, controls, accessible labels, horizontal overflow, console health, and reduced-motion defaults

The repository browser harness is [`../tools/benthic-r3f-qa.mjs`](../tools/benthic-r3f-qa.mjs). Browser QA in this iteration used Playwright with Chromium software rendering; that proves browser behavior at the tested viewports, not real-phone thermals or stable physical-GPU frame rate.

## Run

```bash
npm ci
npm run test
npm run build
npm run dev
```

Open `http://127.0.0.1:5174/`.
