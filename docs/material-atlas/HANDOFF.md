# Option C · Material Atlas / Precious Opal pilot

Target: `MelodicBloom/shader-gallery` default branch `main`, feature branch recommended: `feat/material-atlas-opal-v0-1`.

## Bounded scope

This overlay **adds** a `/material-atlas/` browser experiment to `packages/shader-library-v1/source/`, imports the existing 15 shader library entries, and provides the first topology-aware 3D opal specimen and renderer-neutral material/event core. It does **not** replace or mutate `manifest.json`, the canonical 15 shaders, original live gallery, or `qt314wink/shader-grammar` optical ontology. The user's extended 30+ collection still requires inventory reconciliation.

## Apply (from repo root)

```
git status --short
git switch main && git pull --ff-only
git switch -c feat/material-atlas-opal-v0-1
# Extract this ZIP at repository root, preserving directory names; fail on existing-file conflicts.
cd packages/shader-library-v1/source
node --test material-atlas/tests/core.test.mjs
# EGL/GLES native shader validator required to run this gate:
node material-atlas/tests/shader.test.mjs
python3 -m http.server 8000
# Visit http://localhost:8000/material-atlas/
```

## Stop conditions

If the target folders already exist, the repo is dirty, native shader smoke fails, WebGL2 compile fails, alpha/mean checks fail, or visual quality does not resemble the opal reference, stop and report exact evidence. Do not promote to main or replace old Opal Core. Review physically-inspired claims with bounded light-angle/geometry/reference captures.

## Definition of done

1. All five core tests pass; all six native shader rendering samples pass.
2. Opal viewer supports sphere/cabochon/crystal, perspective orbit and zoom, 13 meaningful dials and light controls.
3. Reveal state can be saved/copied and deterministically replayed at discrete state level.
4. All available original manifest entries appear in the atlas with their own original controls, identified as 2D until converted.
5. Existing gallery continues serving exactly 15 without changed manifest, snapshots or build expectations.
6. Browser smoke succeeds on desktop and mobile WebGL2 with reduced-motion considerations; known experimental limits are documented.
7. Other known material repositories are inventoried and de-duplicated before claiming complete 30+ coverage.

## Ownership and cross-engine boundaries

The renderer-neutral `material-atlas/core.js` is the pilot contract. The browser adapter consumes it today; Unreal mapping is exposed as a semantic scalar map and documented, **not shipped as a working Unreal asset**. Preserve shared state semantics and provenance while allowing engine-specific optical implementations and geometry creation.
