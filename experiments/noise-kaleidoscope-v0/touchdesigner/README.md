# TouchDesigner adapter — manual proof run

IMPORTANT: Not tested in TouchDesigner here; official docs https://docs.derivative.ca/Write_a_GLSL_TOP and https://docs.derivative.ca/Noise_TOP are the authoritative parameter references.

1. New TouchDesigner network: create Noise TOP named noise_field.
2. Set Type to Perlin 2D (GPU), resolution 512x512. Choose seed 314 when the build exposes it.
3. Create GLSL TOP named polar_fold. Connect noise_field to its input 0.
4. Create a Text DAT named kaleido_pixel; paste contents of kaleidoscope_pixel.glsl. Set polar_fold's Pixel Shader DAT to kaleido_pixel.
5. On Vectors page, add scalar uniforms in separate vector rows: uTime=1.2345, uSides=10, uScale=4.2, uSpeed=0.35, uRotation=0, uWarp=0.45, uPalette=0.18, uContrast=1.15. Float uniforms use X component.
6. Connect an Out TOP. Middle-click GLSL TOP and inspect Info DAT for compiler diagnostics.
7. For animation, switch uTime X to expression absTime.seconds. For deterministic capture, use Constant value again.
8. Test sides 3,6,12,24 and warp 0/1.5. Record TouchDesigner version, GPU, screenshot, shader errors, parameter snapshot.
9. Save .toe only when verified; do not claim cross-renderer pixel matching, as TD samples a Noise TOP and WebGL2 generates four-octave fBm directly.

If GLSL version or vector-row names vary in your installed build, consult the GLSL TOP parameter help rather than guessing. Do not overwrite an existing network; create a fresh Base COMP for this trial.