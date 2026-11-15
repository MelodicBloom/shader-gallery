# Handoff: Crystal Tunnel v2 → final render, Pages deploy, and the parked floral loop

> This is written as a GitHub issue body. Paste it into a new issue in this repo, and any agent or person can pick up from it.

## Context
- **Owner:** Jennipher Troup (creative technologist and design engineer). This repo is a portfolio piece.
- **Quality bar (the owner's words):** *"anything u build should be up to or surpassing the same visual standards, complexity, and quality of the videos i send you.. extend by 30s to 1 min, and ultimately turn into loops."*
- **References:** these are AI-video kaleidoscope clips that are **not in this repo**. On the original box they live at `/workspace/refs/ref04.mp4`, `ref05.mp4` and `ref09.mp4`, with notes in `/workspace/refs/notes.md`.
  - **ref04:** a Voronoi cyan core, counter-rotating sapphire rings, gold gears and silky petals. High energy.
  - **ref05:** an 8-fold diamond kaleidoscope with strong dispersion. Relaxing.
  - **ref09:** a crystal ring against ceramic petals, counter-rotating.

## Current state (Nov 14 2026)
- [x] Scene pass `shaders/buffer_a.glsl`. It contains:
  - 3 overlapping, counter-rotating depth layers.
  - Brilliant-cut gems.
  - PBR gold gears with teeth, bevels, hub and AO.
  - Thick 3D silk-petal shells with an SSS-style rim and translucency.
  - KIFS crystal clusters.
  - Glass panels that **refract and reflect neighbouring geometry**, with per-channel dispersion and a TIR bounce.
  - Soft shadows, AO and projected caustics.
  - A band-limited druse carpet.
  - CoC in alpha.
- [x] Post pass `shaders/image.glsl`: DOF bokeh gather, radial god rays, a 7-level bloom, chromatic aberration, ACES, vignette and looping grain.
- [x] An exact 40 s loop (log-polar zoom, integer-sector rotations, periodic time terms). At t = 40 against t = 0, the shader output differs by a mean abs diff of 0.03/255.
- [x] `index.html` live WebGL2 demo with a low/high quality toggle. It is static, so it is ready for Pages (`.nojekyll` is included).
- [x] Both shaders compile as GLSL ES 3.00 (`tools/check_es.py`, low and high variants).
- [x] Offline CPU renderer, a resumable loop script and a seam check.
- [x] Preview video: __PREVIEW__
- [x] Seam metric (encoded preview): __SEAM__

## Known issues and gaps against the references
- [ ] **No 1080p60 final yet.** Only the 720p30 preview exists. See the commands below.
- [ ] **The live demo has not been tested on a real GPU.** The box only had SwiftShader, which is too slow to show a frame in headless Chrome. Compilation was verified through Mesa. Check fps on a desktop GPU with `?q=high`. If it is too slow:
  - Lower the `marchOut` step counts (44/32/24).
  - Or add a `MEDQ` preset: AA 1 at full resolution with refraction on.
- [ ] **Composition is still band-structured** (concentric rings, rings of gems). ref04 and ref05 read as more organic, overlapping volumes. Ideas:
  - A second gem/petal instance per cell with a phase offset.
  - Domain-warp the s coordinate per layer, keeping the warp periodic in s.
- [ ] **Petals:** they are 3D but small and partly hidden under the glass panels. ref04's silky petals are larger and more numerous. Try 5 petals per wedge and a bigger L.
- [ ] **Gears read slightly flat in places.** Add a second, smaller meshing gear that counter-rotates at a ratio of 12:8 teeth. Its rotation must stay integer per loop (for example, spin = 3 turns per loop).
- [ ] **Caustics are faked** (an analytic web pattern), and there is no true photon or volumetric caustic.
- [ ] **Druse carpet:** it is band-limited, but at 1080p AA2 there is still slight sparkle on the outer ring. AA3 for finals, or a temporal accumulation pass in the demo.
- [ ] **Glass-panel edge stair-stepping** shows on the inner rings at 1 spp (low preset). It is fine at AA ≥ 2.
- [ ] **The palette is mostly blue, violet and teal.** ref04 has more warm gold and pink energy. Widen `gemTint`/`silkTint` or increase the gold share.
- [ ] **No audio reactivity and no Three.js wrapper.** It is raw WebGL2, which is smaller and has zero dependencies. A Three.js `EffectComposer` port is optional: use two `ShaderPass` instances with the same GLSL and a `WebGLRenderTarget` with `HalfFloatType` and `generateMipmaps`.

## Next steps (in order)
1. **Final 1080p60 render** (about 5 h CPU on an 8-core box, resumable):
   ```bash
   cd repo && setsid nohup nice -n 5 tools/render_loop.sh 1920 1080 60 3 crf:16 > render_1080.log 2>&1 < /dev/null &
   tail -f render_1080.log          # "frame N/2400"
   ```
   - Output: `media/crystal_tunnel_v2_loop_1080p60.mp4` plus `_seam.json` and `_seam_check.mp4`.
   - Do **not** commit the large mp4, which is gitignored. Attach it to a GitHub Release, and make a web version under 50 MB for the README:
     ```bash
     ffmpeg -i media/crystal_tunnel_v2_loop_1080p60.mp4 -c:v libx264 -preset slow -b:v 9M -maxrate 12M -bufsize 18M -pix_fmt yuv420p -movflags +faststart media/preview_1080p.mp4
     ```
2. **GitHub Pages:** go to Settings → Pages → Deploy from branch → `main` / root. The demo is then at `https://<user>.github.io/<repo>/`. For a portfolio or Google Sites embed, use `<iframe src="https://<user>.github.io/<repo>/?q=low" allowfullscreen>`. Google Sites → Insert → Embed → By URL also works.
3. **Real-GPU check:** open `?q=low` and `?q=high` and record fps. Tune or add `MEDQ` if needed.
4. **Visual gaps:** work through the known-issues list above. Iterate on 480p stills: `python3 tools/render.py still --w 854 --h 480 --aa 2 --t 0 10 20 --out work/st`.
5. **Parked: floral AI-video loop v3** (separate project, *not* in this repo). It is at `/workspace/loops/ai-floral-v3/` on the original box.
   - Contents:
     - 8 raw segments, `segments/s1_raw.mp4` to `s8_raw.mp4` (plus `segments/rejected/`).
     - Keyframes `keyframes/K1–K8_{original,fold}`.
     - An 8-fold wedge-mirror tool, `work/fold.py`.
     - `work/segcheck.py`.
     - `prompt_template.txt` (ref15 style anchors).
   - Earlier delivered version: `/workspace/loops/ai-floral-pilot/v2/ai-floral-pilot_ref15_loop_v2.mp4` (33 s, 960², 24 fps, seamless).
   - Remaining work:
     - QC each segment with `segcheck.py` and regenerate any that fail.
     - Apply `fold.py` symmetry lock to every frame.
     - Chain the segments with matched joins (the v2 join at 0:05 was weak).
     - Optical-flow retime toward ref15's speed.
     - Close the loop with a first+last-frame conditioned segment.
     - Encode at 960² 24 fps and 30–60 s, with a web preview under 50 MB.

## Exact commands (from repo root)
```bash
python3 tools/build.py                 # shaders/*.glsl -> index.html (inlined)
python3 tools/check_es.py              # GLSL ES 3.00 compile check, low + high
python3 -m http.server 8000            # demo at http://localhost:8000/?q=high
python3 tools/render.py still --w 854 --h 480 --aa 2 --t 5 --out work/st
XDEFS='#define LOWQ' python3 tools/render.py still --w 854 --h 480 --aa 1 --t 5 --out work/low
setsid nohup nice -n 5 tools/render_loop.sh 1280 720 30 2 9M > render_720.log 2>&1 < /dev/null &
python3 tools/seam_check.py media/<loop>.mp4 media/<loop>_seam_check.mp4
```

## Acceptance criteria
- [ ] `media/crystal_tunnel_v2_loop_1080p60.mp4`: 2400 frames, 40.000 s. The seam check wrap step is within [min, max] of the consecutive steps, with a ratio to the mean of ≤ 1.15. Nothing pops in `_seam_check.mp4`.
- [ ] The web preview is under 50 MB and is linked from the README. The full-quality file is attached to a Release.
- [ ] The Pages URL loads with no console errors in Chrome, Firefox and Safari 17 or later. `?q=low` holds 30 fps or more on a laptop iGPU, and `?q=high` holds 30 fps or more on a desktop GPU (or document the fps).
- [ ] The README hero stills are refreshed from the final render.
- [ ] Side by side with ref04, ref05 and ref09 (`sbs.py`-style), the owner agrees it meets or exceeds the reference quality. In particular: overlapping volumes, silky petals, chunky gold and dispersion fire.
- [ ] (Floral) a 30–60 s, 960², 24 fps exact loop with 8-fold symmetry locked and no visible joins.
