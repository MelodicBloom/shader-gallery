# HELIOS RELAY — measured QA

Copied from the standalone 2026-11-09 run. Not remeasured when this directory was added to shader-gallery. Inspected references are listed in `../README.md`. The GitHub section below records the measurement machine.

Date: 2026-11-09. Browser: Headless Chrome 156.0.8078.47, Linux x86_64. GPU: ANGLE SwiftShader (Vulkan 1.3.0, Subzero, 0x0000C0DE). Software renderer. No phone and no thermal claim.

The picture is a raster of the same eight rigid ribs, ivory ring, graphite knuckles, and brass hoop. Quality 64 is the finer mesh (40×12 tori, 4-segment rounded boxes). Quality 32 is coarser and is not the timing reference. The canvas pixel budget is unchanged. There is no ray march; the old 80-step cap is an unused ceiling.

## Score

| Category | Score | Why |
| --- | --- | --- |
| Structural identity | 2 | Pulse error 0.82°, 0.55°, and the other two phases still ≤ 5°. Glow off keeps coverage and object luma above 0.4. |
| Action causality | 2 | Central 20% reveal 20.5% closed to 66.0% open. Ten touch cases, slider, and keyboard pass. |
| Reproducibility | 2 | Repeat, A-B-A, reset, t/t+12/t+24, and yaw ±π match. |
| Accessibility | 2 | Named 44px controls, keyboard, reduced motion boots paused and still accepts input. Play then advances time. |
| Robustness | 2 | Context restore hash matches. Bad shader is shown and restored. Null WebGL2 is reported. Portrait and ultrawide render. |
| Performance | 2 | Quality 64, full 120 warmup + 600 frames, both target sizes, median and p95 under the gate on RAF and GPU. |

Total: **12/12**. This replaces the earlier performance score of 1, which only recorded a miss.

## Frame time

Target: median ≤ 33.3 ms and p95 ≤ 50 ms at quality 64. CPU time is the JavaScript interval around `drawArrays` with no `gl.finish`. RAF is the gap between animation-frame callbacks. GPU is `EXT_disjoint_timer_query_webgl2` elapsed time for that draw. Warmup frames are not in the 600.

| Profile | Frames | Buffer | CPU median / p95 | RAF median / p95 | GPU median / p95 |
| --- | --- | --- | --- | --- | --- |
| 390×844 | 600 after 120 | 390×844 | 0 / 0.10 ms | 16.70 / 16.70 ms | 7.77 / 10.62 ms |
| 1280×720 | 600 after 120 | 1280×720 | 0 / 0.10 ms | 16.70 / 33.30 ms | 14.09 / 16.27 ms |

Both pass. A single RAF sample in each run is a multi-second hitch (max about 2.0 s and 2.3 s). It does not move the p95.

### Previous raymarch on this same SwiftShader

Those runs were short, and they failed. They are the baseline, not discarded.

| Profile | Frames | GPU median | GPU p95 | RAF median |
| --- | --- | --- | --- | --- |
| 960×640 | 12 after 8 | 384 ms | 390 ms | 383 ms |
| 390×844 | 30 after 10 | 231 ms | 286 ms | 233 ms |
| 1280×720 | 30 after 10 | 532 ms | 600 ms | 533 ms |

Same machine, same 390×844 and 1280×720 drawing buffers, same DPR cap and 1.25M pixel budget. The raster path is the change. Quality was not lowered to 32 to claim the target, and the buffers were not shrunk.

## Other checks that still pass

- Coverage at 960×640: about 41%.
- Reveal delta: about 45.5 percentage points.
- Luminance: more than 32 occupied bins.
- Real animation frames: 24 played frames advanced time; 8 paused frames and 8 hidden frames did not.
- Reduced motion: boot paused at phase 0; controls change aperture, energy, and yaw; after Play, time moved (0.24 s on the follow-up read).
- Float framebuffer scan: 0 nonfinite samples.
- One in-page suite: 32/32.

## GitHub

`https://github.com/MelodicBloom/shader-gallery` is public and readable. This machine is not logged into GitHub (`gh auth status` reports no hosts, and the GitHub connector is down). No draft pull request was opened. The patch that adds only `helios-relay/` is with these artifacts. It does not edit `docs/index.html`, existing studies, or deployment config.
