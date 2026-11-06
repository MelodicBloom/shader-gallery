# Thin-film example host

Additive WebGL2 runtime for `../glsl-thin-film.glsl`. The original GLSL function, recipes, ontology, validation contracts, and provenance manifest are unchanged. The host supplies a fullscreen thickness strip and two bounded controls; it does not implement the recipe compiler, spectral backend, or material calibration.

From the repository root, run `python3 -m http.server 4173` and open `/packages/shader-grammar/examples/runtime/`. Static HTTPS hosting needs no install or build command. The function is fetched from its original path and shown as text even when WebGL2 is unavailable.

This consumer example does not move semantic authority away from `qt314wink/shader-grammar`. Rollback: remove this `runtime/` directory.
