# RECEIPTS: Mandala Glass slice

All times are America/New_York (EST, UTC-5). Date: **2026-11-23**.
This file records what was built, what was measured and what is still unverified. Nothing here is claimed without a file in `receipts/` to back it.

## Scope
This is a time-boxed slice of the mandala build, needed for the owner's interview on 2026-11-24. It covers only the hero (Ref 1), reinterpreted as a procedural 3D glass mandala. References 2–4 and the further synthesis/extension passes are **not** in this slice.

## Timeline
| Time (EST) | Event | Evidence |
|---|---|---|
| 04:19 | Env check: Node v24.22.1, npm 11.21.1, gh authenticated (ADMIN on repo), Playwright Chromium 1187 cached | — |
| 04:20 | Scaffolded `mandala-glass/` (three 0.187.0, vite 8.3.8); first build OK, 630.6 kB JS (159.1 kB gzip) | `npm run build` |
| 04:23–04:24 | **Pass 1** QA shots (2 viewports × 3 states). 0 console errors. Visual verdict: **FAIL**, bloom flooded the centre, blue read as lavender, gold invisible | `receipts/pass1-*.png` |
| 04:25 | **Pass 2** refine: bloom threshold 1.02→1.7, strength 0.55→0.42; core point light 6→1.5; glass body colour tinted (`color` lerped toward tint) and attenuation distances shortened. Verdict: centre readable, still lavender blue, coral tiles, pale gold | `receipts/pass2-*.png` |
| 04:26 | **Pass 3** refine: truer blue `#0a63ff`, pink `#ff5aaa` and yellow `#ffe02e` with longer attenuation (no orange/red shift); gold `(1.0,0.6,0.18)` roughness 0.12; key light 2.2→1.5; bloom threshold 2.0 | `receipts/pass3-*.png` |
| 04:27–04:33 | **Final** pass: glass clearcoat 0.6→0.25 to cut glare. Full QA (shots + bench + failure sims). 0 console errors | `receipts/final-*.png`, `receipts/final-qa.json` |
| 04:35 | Added adaptive level 4 ("lite glass", no transmission pass) after the bench showed SwiftShader cost; benched it | `receipts/final-q4-*.png`, `receipts/final-q4-bench.json` |

Commit SHAs, PR and deploy entries are listed at the bottom.

## Decisions
| Decision | Chosen | Chosen against | Why |
|---|---|---|---|
| Stack | plain **three.js + Vite**, vanilla JS | React Three Fiber + drei + postprocessing | Fewer moving parts on a deadline, smaller dependency surface, and the same three.js material underneath. R3F adds no visual capability for this slice. |
| Glass | `MeshPhysicalMaterial` transmission + `dispersion` (three ≥ r163) | drei `MeshTransmissionMaterial` | Native, no extra render passes per material, works with one shared transmission target. MTM's multi-sample cost is too high for mobile. |
| Environment | `RoomEnvironment` → PMREM (procedural) + 2 directional lights | External HDR | No runtime assets, deterministic, and the bright studio look the "cut glass on white" references call for. |
| Refraction cue | Procedural canvas backdrop (soft radial gradient, faint pastel rays and rings, contact shadow) | Plain white background | Glass on pure white has nothing to bend, so it reads as frosted plastic. Faint rays make refraction and dispersion visible. |
| Facets | Non-indexed geometry + recomputed normals (flat facets), 1-segment bevels | Smooth normals | Gives the cut-glass facet glints in the references. |
| Tone mapping | `NeutralToneMapping`, exposure 0.95 | ACES / AgX | Keeps hue and saturation of pink/yellow/blue. AgX desaturates and ACES shifts hues. |
| Bloom | UnrealBloom threshold 2.0 (HDR), strength 0.5 | Low threshold | Only the cyan core and true spec glints bloom; the white background must not. Pass 1 showed flooding at 1.02. |
| Determinism | mulberry32 seeded PRNG at build time only; animation is a pure function of time and state; `?t=` freezes the clock | `Math.random` / free-running | Reproducible captures. No `Math.random` anywhere in the code. |
| Adaptive quality | 5 levels, down-only, 90-frame median > 40 ms trigger, 120-frame cooldown | Up/down auto | Avoids oscillation. Down-only is safe for a demo. |
| Gems | Procedural 8-segment brilliant cut (LatheGeometry) | Licensed gem model | No licensed assets. |

## Build commands
```bash
cd mandala-glass && npm install && npm run build   # vite 8.3.8 → dist/
npx vite preview --port 4173 --strictPort          # local QA server
node scripts/qa.mjs                                # shots + bench + sims (needs playwright@1.55.0)
node scripts/bench4.mjs                            # lite-level bench
```
Dependencies: `three@0.187.0` (runtime), `vite@8.3.8` (dev). QA only: `playwright@1.55.0` with bundled Chromium build 1187, run outside the app's `package.json`.

## QA results (final)
**Renderer: headless Chromium + SwiftShader (CPU software rasteriser via ANGLE)**, `--use-angle=swiftshader`. The headless browser reports devicePixelRatio 1. These numbers are **not** representative of a real GPU, and no real-GPU or real-phone measurement was taken.

### Screenshots (3 states × 2 viewports, quality locked to 0)
- `receipts/final-desktop-{hero,gem,closed}.png` (1280×720)
- `receipts/final-mobile-{hero,gem,closed}.png` (390×844)
- States: hero `?t=6`; gem `?t=14&mat=gem&disp=1.2&open=0.85`; closed + panel `?t=21&open=0.12&panel=1`
- Console errors / page errors: **0** across all runs (`final-qa.json` → `errors: []`)

### Frame-time bench (60 warm-up + 300 measured frames)
| Viewport | Mode | RAF median | RAF p95 | JS CPU median | JS CPU p95 | End level |
|---|---|---|---|---|---|---|
| 1280×720 | adaptive | 350.0 ms | 466.6 ms | 1.3 ms | 4.9 ms | 2 |
| 1280×720 | q=2 | 283.2 ms | 383.3 ms | 1.2 ms | 3.3 ms | 2 |
| 390×844 | adaptive | 133.2 ms | 199.9 ms | 1.2 ms | 3.9 ms | 3 |
| 390×844 | q=2 | 133.2 ms | 183.3 ms | 1.2 ms | 4.0 ms | 2 |
| 1280×720 | q=4 lite | 83.4 ms | 133.4 ms | 1.0 ms | 3.5 ms | 4 |
| 390×844 | q=4 lite | 50.0 ms | 83.3 ms | 0.9 ms | 2.1 ms | 4 |

Interpretation: JS work per frame is about 1 ms. The rest is software rasterisation of the transmission pass, MSAA and bloom on the CPU. On SwiftShader this **does not meet 30 fps at any level**. The adaptive run includes its own step-down transitions, so its numbers are worse than the locked q=2 run. Real-GPU performance is **unmeasured**.

### Failure simulations (`final-qa.json` → `sims`)
| Simulation | Result |
|---|---|
| `?nowebgl` forced fallback | fallback card shown (`fallback: true`, overlay visible). Screenshot: `final-sim-nowebgl.png` |
| Browser launched with `--disable-webgl --disable-webgl2 --disable-3d-apis` | fallback shown, reason "is not available in this browser" |
| `WEBGL_lose_context` lose → restore | lost seen; contextLost 1, contextRestored 1; frames continued (8 frames in ~2.5 s on SwiftShader); re-rendered correctly (`final-sim-context-restored.png`) |
| Resize 1280×720 → 390×844 → 1600×900 | canvas 1600×900 CSS and buffer; portrait reframing screenshot `final-sim-resized-portrait.png` |
| `prefers-reduced-motion: reduce` | autoRotate false, hueSpeed 0.3 |

## Known failures and limitations
- **Performance on SwiftShader is far below target** (see table). Real devices are untested. Lite level 4 trades away the transmission look: glass goes flat and pastel (`final-q4-lite-390.png`).
- `final-*` screenshots were captured before level 4 was added. That change only touches level 4, so levels 0–3 are unchanged, but the final shots were not retaken.
- A localized bright specular and bloom patch appears near the top of the ring at some tilt angles (visible in `final-desktop-hero.png`). It comes from RoomEnvironment's light panel reflecting off the glass tiles and was not fully removed.
- True caustics are not simulated; the "caustic feel" comes only from dispersion, facets and the refracted backdrop.
- Dispersion in three.js is screen-space (transmission-target based). It does not show inter-object refraction of other transmissive parts.
- Keyboard: the panel controls are native inputs and buttons (focusable, with visible focus). Orbit has no keyboard binding.
- Refs 2–4 and their synthesis are not implemented in this slice.

## Commits / PR / deploy
| Time (EST) | Item | Value |
|---|---|---|
| 04:36 | Commit 1 (app + QA receipts) | `315123638683837cad40a6230ac0b285b9bc620c` on `cursor/mandala-glass-slice` |
| 04:37 | Vercel production deploy (CLI `vercel deploy --prod` from this folder, account `wildfiremelody`, team `melodicbloom`, project `mandala-glass`, built from the commit-1 working tree) | **https://mandala-glass.vercel.app** |
| 04:37 | `curl` production URL | HTTP 200, `<title>Mandala Glass — procedural dispersive glass study` |
| 04:37 | `curl` deployment-specific URL `mandala-glass-oonbo94fn-melodicbloom.vercel.app` | HTTP 302 (Vercel Deployment Protection / SSO on per-deployment URLs). **Use the production URL**, which is public. |
| 04:38 | Headless screenshot of live URL (SwiftShader) | `receipts/live-vercel-1280.png`, `receipts/live-vercel-390.png`; 0 console errors; WebGL path (no fallback); auto quality 0 (desktop) and 1 (mobile) |
| — | Commit 2 (this receipts update) and the draft PR | listed in the PR description. A commit cannot contain its own SHA. |

The Vercel project is **not Git-connected**. Pushing to the branch does not redeploy. To redeploy, run `npx vercel deploy --prod` from `mandala-glass/`.
