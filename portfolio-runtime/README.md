# Abalone material study

Issue #11 first-specimen candidate. This package adds a raw WebGL2 / GLSL ES 3.00 runtime alongside `library-v1`, using the existing `ShaderPlayer`. Zustand's vanilla store supports semantic state without requiring React.

## Run locally

From `portfolio-runtime`:

```powershell
npm ci
npm run dev
npm run build
npm test
```

The development server uses `http://127.0.0.1:5173/` and refuses to silently choose another port. `dist/` is local build output, ignored by Git. Relative asset paths allow hosting the build in a subdirectory. Publishing is a separate step.

## State and rendering contract

- `src/state.ts`: material identity, bounded uniform values, orbital camera, playing/paused mode, reduced motion, inspector visibility, and versioned preset serialization. Restore validates every required field before atomically replacing state; exports use stable field ordering.
- `src/abalone.glsl`: camera ray / analytic ellipsoid intersection, object-space layer bands, approximate interference palette, Fresnel response, grazing highlight, and display encoding. This is an artistic optical approximation, not a physically validated BRDF.
- `src/main.ts`: maps semantic state to active GPU uniforms, validates GPU uniform types, handles pointer capture and keyboard orbit, owns frame time, clamps DPR to 1.5, and restores rendering after context loss.
- Frame time stays outside Zustand during animation. Export records the displayed phase; paused/reduced motion draws only when state or dimensions change. The animation scheduler continues checking visibility/state; it does not publish frame updates to the store.
- Reduced motion follows the system on initial load and system preference changes; a user can also toggle it directly. The displayed phase freezes rather than restarting. Arrow keys rotate, `+` / `-` zoom, and pointer drag or touch drag orbit.
- The inspector reports a rolling p95 of animation callback intervals. This is frame cadence, not GPU timing, and is not a cross-device performance claim.
- WebGL2 absence and compile/link/contract failure reveal the existing static Abalone preview with a diagnostic. The fallback is a legacy 2D preview, not a screenshot of this new 3D specimen.

## Scope and next gate

The first specimen has an analytic surface and fixed controlled lighting. Future imported geometry, multi-object scenes, composer layers, audio and any scene framework require a separate measured need and scope decision. Local Chromium QA does not establish Safari/Firefox, physical touch devices, hardware GPU timing, or final hiring-portfolio art direction. Evidence receipts and screenshots are kept in the task's `outputs` folder rather than committed as runtime claims.
