# BENTHIC_OS

**BENTHIC_OS is an interactive WebGL2 study in procedural form, real-time rendering, and performance-aware interface design.** It turns a compact fragment shader into a tactile, bioluminescent coral-like volume that viewers can recolor, reshape, orbit, and inspect directly in the browser.

For hiring managers and potential clients, this is a focused proof of creative coding and frontend delivery: one visual idea carried from shader math through responsive interaction, accessibility behavior, device-aware quality controls, and browser QA. It is intentionally dependency-free so the artifact can be opened, reviewed, and handed off without a framework build or CDN.

## How it works

The browser draws one full-screen triangle through WebGL2. Each fragment casts a ray into a three-dimensional implicit field:

1. A sphere establishes the base volume.
2. Layered 3D value noise displaces that volume into ridges and folds.
3. Conservative sphere tracing searches for the surface.
4. A finite-difference gradient reconstructs the surface normal.
5. Diffuse, specular, rim, fog, and pulse terms create the wet bioluminescent material.
6. Pointer/touch input changes the orbit; the control panel updates shader uniforms without rebuilding geometry.

The result is an implicit surface, not a polygonal coral mesh. The raster pipeline still uses a full-screen triangle, so the accurate description is “raymarched procedural volume,” not “polygon-free rendering.”

## Why it is more performant than the earlier implementation

The earlier browser version loaded Three.js r128, React development builds, Babel, Tailwind’s runtime compiler, and external fonts before rendering. It also applied the same 80-step raymarch and pixel-density policy to every device and displayed a hard-coded `STABLE_60` label.

This version:

- removes all runtime libraries, compilation, font requests, and CDN dependencies;
- uses a WebGL2 full-screen triangle generated from `gl_VertexID`, with no mesh buffer allocation;
- bounds ray entry against a containing sphere before marching;
- offers 46-, 64-, and 84-step quality profiles;
- caps drawing-buffer scale independently from CSS layout size;
- automatically steps quality down after sustained expensive frame times unless the viewer chooses a profile;
- pauses rendering in hidden tabs;
- stops shader time and selects Eco quality when reduced motion is requested;
- reports measured frame cadence instead of promising a fixed frame rate; and
- handles WebGL unavailability and context loss explicitly.

These are implementation-level optimizations. They do not establish a universal frame-rate improvement: performance still depends on viewport, browser, driver, GPU, power mode, and thermals.

## Run it

Open [`index.html`](index.html) directly in a current browser, or serve the repository locally:

```bash
python -m http.server 4173
```

Then visit `http://127.0.0.1:4173/benthic-os/`.

## Controls

- Drag or swipe the render to orbit; release to add a brief light pulse.
- Choose Cyan, Toxic, or Coral material profiles.
- Adjust tissue density, calcification, metabolic rate, and rim light.
- Select Eco, Balanced, or High rendering.
- Open **View GLSL Buffer** to inspect the fragment kernel used by the page.

## Evidence boundary

Browser QA covers page identity, nonblank WebGL output, console health, the primary controls, and desktop/mobile responsive layouts. It does not prove a stable physical-device frame rate, thermal behavior, production deployment, Three.js or React Three Fiber experience, HLSL, Unity, Unreal, installation hardware, or client outcomes.

That separation is deliberate: BENTHIC_OS is the native WebGL2/GLSL proof. A separate Three.js/R3F proof should reuse the artistic system while demonstrating actual framework structure, scene lifecycle, reusable React components, and framework-specific testing.
