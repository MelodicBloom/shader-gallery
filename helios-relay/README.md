# HELIOS RELAY

Standalone WebGL2 study. Eight rigid hinged ribs, a 12 second amber/cyan signal, and direct aperture, energy, and yaw controls. The renderer draws meshes. Quality 64 is the finer mesh (40×12 tori, 4-segment rounded boxes), not a ray-march step count.

This directory is not linked from the gallery landing page. Nothing under `docs/`, other studies, or deployment config is changed by adding it.

Open `index.html` in a WebGL2 browser.

## Evidence

`qa/` is the 2026-11-09 standalone measurement, copied with this study and not remeasured in this gallery checkout. `qa/QA.md` records headless Chrome 156.0.8078.47 on Linux with ANGLE SwiftShader, quality 64, 120 warmup frames and 600 measured frames at 390×844 and 1280×720. `qa/bench-samples.csv` includes RAF maxima of 2013.8 ms and 2262.2 ms. The GitHub paragraph in that note describes the measurement machine, which had no GitHub login. `tests/run-webgl.mjs` still uses that machine's `/workspace` layout, with `index.html` at the server root.

## References

This is the standalone bundle's inspection record. These pages were not reopened for the gallery copy.

1. Behance, The Dots II — own page returned HTTP 403. Title and mechanism are unverified search-index text. Not used as a score.
2. Superdesign portal hero — own page and six preview frames inspected. Transfer used here: one opening action reveals the interior. Photography, type, and the wordmark were not copied.
3. Awwwards, Virtually Ever After — own page and the supplied still inspected. Live gestures were not timed. Transfer: depth before motion, and named controls beside the pointer.
4. EPFL BamX Lux — own page and photograph inspected. Motion of the physical arches was not observed. Transfer: light sits on the members around a walkable void. Seven arches there; this vault has eight ribs. It is not a copy of that installation.
5. Inigo Quilez, distance functions — primitives and the warning that a union is not an exact interior distance. Used.
6. Inigo Quilez, cosine palettes — integer-frequency cosine palette with a nonnegative clamp before gamma. The signal is one amber/cyan cycle, not a rainbow.

The two-touch Kaleidoscopic IFS paste is an interaction reference only. Its twist-before-modulo, 100-step loop, unused time, and `atan(0,0)` behavior were not adopted.

