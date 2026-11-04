# Transferable kaleidoscopic control mechanism

Reference geometry CPU: experiments/noise-kaleidoscope-v0/contract.mjs foldPolar().
WebGL2 fragment: experiments/noise-kaleidoscope-v0/shader.frag.glsl.
TouchDesigner GLSL TOP: experiments/noise-kaleidoscope-v0/touchdesigner/kaleidoscope_pixel.glsl.

Coordinate map p=2*(uv-0.5)*vec2(aspect,1). The centered angular coordinate is theta=atan(y,x)+rotation+speed*time*0.16. For N integer dihedral sectors, w=2pi/N, a=mod(theta,w), folded=min(a,w-a), q=r*(cos(folded),sin(folded)). Repeat/reflection of q is independent of the source texture field, which makes this an interoperable operator.

Reflection invariant: folded angle is identical for a and w-a. Rotation invariant: fold(R_(k*w)*p)=fold(p). Warp radius only using r and folded angle to avoid seams. Sample authored 4-octave value-fBm with seed offsets in browser; sample external Noise TOP red channel in TouchDesigner. Cross-adapter pixel parity is not expected.

Continuous controls interpolate boundedly; N and seed require explicit discrete switches, never interpolated fractional values. Inject time from the host timeline; use a fixed seconds value for reproducible captures. Record viewport/device and GPU; floating-point output may vary across drivers.

Common defects: world-angle noise before fold causes seam tearing; non-aspect-corrected coordinates distort symmetric petals; high spatial scale without adequate filtering causes aliasing; using absolute wall-clock for seed/time prevents replay; palette math is artistic color cycling, not spectral optics.