# Wood-fiber optics proposal (not applied)

The live grain shader, contract, page, and source zip are byte-identical to `ef13a5a`. The wood-figure rewrite is gone. This file does not change them.

## Model

A fiber along tangent `T` has a Kajiya–Kay highlight (Kajiya, J., Kay, T. "Rendering fur with three dimensional textures." SIGGRAPH 1989):

```
spec = (sqrt(1 - (T · L)^2) * sqrt(1 - (T · V)^2) - (T · L)(T · V))^p
```

Marschner’s hair model (Marschner et al., SIGGRAPH 2003) splits that into R, TT, and TRT lobes. Wood is closer to the single fiber lobe than to hair. A laid-paper or flat-sawn board uses the same lobe with `T` along the grain.

Fixed parameters if this were ever applied, and not applied now:

| Symbol | Value | Unit | Range |
| --- | --- | --- | --- |
| p | 24 | 1 | 8–64 before the highlight becomes a line |
| T | (1, 0, 0) in the plane | 1 | unit vector |
| fiber contrast | 0.35 | 1 | 0–1 |

## BOTTLENECKS

The live shader is one 5-octave value-noise loop. That is cheap. A fiber specular would add a handful of dots and one power, not another octave loop.

## FAILURE MODES

A fiber specular, if it were applied: `T · L` near ±1 makes the square roots zero and the highlight vanish (grazing along the fiber); mediump noise bands; the SVG `feTurbulence` path is not Kajiya–Kay and will not match the GLSL lobe; SwiftShader derivatives (`dFdx`) disagree with real GPUs; strength 0 is defined to return the base color exactly, so a specular term must be multiplied by strength or the zero-strength test fails; reduced motion does not apply because this page does not animate.
