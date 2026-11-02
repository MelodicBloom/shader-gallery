# Crystal Lens local warp + Ripple viewport clip — plan (scaffold)
Status: **draft / not implemented.**

## Crystal Lens (`shaders/crystal-lens/shader.glsl`)
- Today: `warp` displaces backdrop UV across the whole wall.
- Plan: multiply warp offset by a lens silhouette mask `m = smoothstep(r+e, r-e, length(p))` so refraction stays inside the lens. Additive: new `u_lensLocal` (default 1, 0 = legacy whole-wall warp).

## Ripple Pool (`shaders/ripple-pool/shader.glsl`)
- Today: blanks/knocks off at extreme X/Z orbit.
- Plan: clamp sample coords to safe viewport and fade (not hard discard) outside; `u_rippleClip` (default 1, 0 = legacy).

## Rules
Additive clamps/masks only; no cross-lineage merge; independent of alias naming and N2 light toggle.

## Revert
Single commit revert, or set the flags to 0.
