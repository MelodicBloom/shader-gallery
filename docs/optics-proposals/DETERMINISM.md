# Determinism record

Chrome 157.0.8103.50, SwiftShader (`Google SwiftShader`), device pixel ratio 1, viewports 1440×900 and 390×844. `Math.random` is a fixed LCG (1664525, 1013904223, start 1). `performance.now` and the animation timestamp are pinned at 16 ms. Each frame below was rendered twice. The two PNG SHA-256 values matched in every case. No frame was unstable under that pin.

## Byte identity

| File | Source | Result |
| --- | --- | --- |
| `docs/optical-studies-02.html` | `ccceaea` blob `28f3e6dd15d9ac2f5f745d728be65f9ed1463953` | identical |
| `docs/index.html` fragment shaders (5) | `ccceaea` | identical strings |
| `docs/index.html` and `README.md` | `d9344e1` | identical files |
| `aurora/index.html` shader string | `ccceaea` | identical |
| `abalone/index.html` shader string | `ccceaea` | identical |
| grain port, source copy, and zip | `ef13a5a` | identical blobs |
| recovered lab HTML, CSS, and JS | svg-filter-lab commits named in `docs/recovered/PROVENANCE.json` | identical bytes, different folder |

## Intentional non-visual deltas

`aurora/index.html` against `ccceaea`: after setting the canvas size, the page calls `gl.viewport(0, 0, c.width, c.height)`. The draw loop stops requesting frames when `prefers-reduced-motion: reduce` matches. The shader text is unchanged.

`abalone/index.html` against `ccceaea`: the same reduced-motion stop. The original page already set the viewport inside `resize()`. The shader text is unchanged.

`docs/index.html` against `ccceaea`: the run-1 keyboard links, focus style, viewport call inside `initShader`, reduced-motion stop, and the three missing studies left as non-links. That file is exactly `d9344e1`.

Recovered SVG pages: the folder is `docs/recovered/lab/` so the original `../css/styles.css` and `../js/animations.js` relative URLs resolve. The HTML bytes are the source commits.

Unapplied proposal pages and these notes are new files. They are not linked from the gallery.

## What the pinned frames showed

Abalone at `ccceaea` and the restored page: same PNG hash at both viewports (`c8bbe2aaf0da…` at 1440, `2953987439cd…` at 390). Reduced motion matches that same 1440 hash, because the first frame still draws.

Optical Studies at `ccceaea` and the restored page: same PNG hash (`303c80caa3b8…` at 1440, `69757d6b1477…` at 390). `u_time` is 0.

Aurora at `ccceaea` does not match the restored page on this Chrome. The byte-exact file paints a 300×150 region at the bottom left (lit bounds about x 0–298, y 750–898 on a 1440×900 shot). Setting `canvas.width` did not reset the viewport. The restored page is the original shader plus the viewport call, and it fills the frame. These are not the same pixels. The full-frame image is the original shader under the recorded viewport delta, not a restyle.

Grain restored is the `ef13a5a` page (seed 7). The wood-figure page at `7de197b` hashes differently. There is no rendered fiber proposal.

## Nondeterminism found

None across the two captures of a given URL, viewport, and motion setting.

Reduced motion on Optical Studies is deterministic and different from the moving-light capture. The cause is layout: the button label changes, the canvas height changes from 925 to 947, and the shader is sampled on a different grid. Light and time do not change.
