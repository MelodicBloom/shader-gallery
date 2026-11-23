#!/usr/bin/env python3
"""Offline renderer for Crystal Tunnel v2 (Mesa llvmpipe via EGL, CPU).
Usage (run from the repo root):
  tools/render.py still  --w 854 --h 480 --aa 2 --t 0 5 10 --out work/st        # PNG stills (XDEFS='#define LOWQ' = low preset)
  tools/render.py frames --w 1920 --h 1080 --aa 3 --fps 60 --out work/frames    # resumable PNG sequence (t = f/fps)
  tools/render.py video  --w 1280 --h 720 --aa 2 --fps 30 --out loop.mp4        # single pass to H.264, not resumable
"""
import os, time, argparse, subprocess
import hashlib, json
from pathlib import Path
os.environ.setdefault("EGL_PLATFORM", "surfaceless")
os.environ.setdefault("LP_NUM_THREADS", str(os.cpu_count()))
import numpy as np, moderngl

HERE = os.path.dirname(os.path.abspath(__file__))
LOOP_T = 40.0
HDR = """#version 330
{defs}
uniform vec3 iResolution; uniform float iTime; uniform float iTimeDelta; uniform int iFrame;
uniform sampler2D iChannel0;
out vec4 outColor;
"""
FTR = "\nvoid main(){ vec4 c; mainImage(c, gl_FragCoord.xy); outColor = c; }\n"
VS = "#version 330\nin vec2 p; void main(){ gl_Position = vec4(p,0,1); }"

def shader_sources(defines):
    shaders = Path(HERE).parent / "shaders"
    return tuple(HDR.format(defs=defines[stage]) + (shaders / file).read_text() + FTR
                 for stage, file in (("scene", "buffer_a.glsl"), ("post", "image.glsl")))

class R:
    def __init__(s, w, h, sources, tile=0):
        s.w, s.h = w, h
        s.ctx = moderngl.create_context(standalone=True, backend="egl")
        s.scene = s.ctx.program(vertex_shader=VS, fragment_shader=sources[0])
        s.post = s.ctx.program(vertex_shader=VS, fragment_shader=sources[1])
        vb = s.ctx.buffer(np.array([-1,-1, 1,-1, -1,1, 1,1], dtype="f4").tobytes())
        s.va_s = s.ctx.vertex_array(s.scene, [(vb, "2f", "p")])
        s.va_p = s.ctx.vertex_array(s.post, [(vb, "2f", "p")])
        s.hdr = s.ctx.texture((w, h), 4, dtype="f4")
        s.hdr.repeat_x = s.hdr.repeat_y = False
        s.hdr.filter = (moderngl.LINEAR_MIPMAP_LINEAR, moderngl.LINEAR)
        s.fb_s = s.ctx.framebuffer([s.hdr])
        s.ldr = s.ctx.texture((w, h), 3, dtype="f1")
        s.fb_p = s.ctx.framebuffer([s.ldr])
        s.tile = tile
    def _set(s, prog, t, fps, frame):
        for k, v in (("iResolution", (s.w, s.h, 1.0)), ("iTime", t), ("iTimeDelta", 1.0/fps), ("iFrame", frame)):
            if k in prog: prog[k].value = v
    def frame(s, t, fps=60, frame=0):
        s._set(s.scene, t, fps, frame); s._set(s.post, t, fps, frame)
        s.fb_s.use()
        th = s.tile or s.h
        for y in range(0, s.h, th):               # tiles keep each llvmpipe draw short
            s.ctx.scissor = (0, y, s.w, min(th, s.h - y))
            s.va_s.render(moderngl.TRIANGLE_STRIP)
        s.ctx.scissor = None
        s.ctx.finish()
        s.hdr.build_mipmaps()
        if "iChannel0" in s.post: s.post["iChannel0"].value = 0
        s.hdr.use(0)
        s.fb_p.use(); s.va_p.render(moderngl.TRIANGLE_STRIP)
        a = np.frombuffer(s.fb_p.read(components=3), dtype=np.uint8).reshape(s.h, s.w, 3)
        return a[::-1]

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("mode"); ap.add_argument("--w", type=int, default=960); ap.add_argument("--h", type=int, default=540)
    ap.add_argument("--aa", type=int, default=2); ap.add_argument("--fps", type=int, default=60)
    ap.add_argument("--t", type=float, nargs="*", default=[0.0]); ap.add_argument("--out", default="work/st")
    ap.add_argument("--start", type=int, default=0); ap.add_argument("--end", type=int, default=-1)
    ap.add_argument("--crf", type=int, default=14)
    a = ap.parse_args()
    defines = {"scene": f"#define AA {a.aa}\n" + os.environ.get("XDEFS", ""),
               "post": os.environ.get("XPOST", "")}
    sources = shader_sources(defines)
    if a.mode == "frames":
        render_frames(a, sources, defines)
        return

    r = R(a.w, a.h, sources, tile=64)
    if a.mode == "still":
        import cv2
        os.makedirs(os.path.dirname(a.out) or ".", exist_ok=True)
        for t in a.t:
            t0 = time.time(); img = r.frame(t, a.fps, int(round(t * a.fps)))
            fn = f"{a.out}_{t:06.2f}.png"; cv2.imwrite(fn, img[:, :, ::-1]); print(fn, f"{time.time()-t0:.2f}s", flush=True)
    elif a.mode == "video":
        video(a, r)

def check_frame_cache(out, manifest):
    path = out / "manifest.json"
    try:
        cached = json.loads(path.read_text())
    except FileNotFoundError:
        if any(out.glob("f[0-9]*.png")):
            raise SystemExit(f"Frame cache {out} has no manifest. Move it aside or use a new --out directory.")
        tmp = path.with_suffix(".tmp")
        tmp.write_text(json.dumps(manifest, indent=2) + "\n")
        tmp.replace(path)
        return
    except (ValueError, OSError):
        raise SystemExit(f"Cannot read frame cache manifest {path}. Move the cache aside or use a new --out directory.")
    if cached != manifest:
        raise SystemExit(f"Frame cache {out} does not match this render. Move it aside or use a new --out directory.")

def render_frames(a, sources, defines):
    import fcntl
    import cv2

    out = Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    manifest = {
        "width": a.w, "height": a.h, "fps": a.fps, "aa": a.aa, "loop_seconds": LOOP_T,
        "defines": defines,
        "shader_sha256": {stage: hashlib.sha256(src.encode()).hexdigest()
                          for stage, src in zip(("vertex", "scene", "post"), (VS, *sources))},
    }
    # Hold the lock through PNG writes so concurrent renders cannot race cache setup or frame writes.
    with (out / ".render.lock").open("a") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        check_frame_cache(out, manifest)
        r = R(a.w, a.h, sources, tile=64)
        n = int(round(LOOP_T * a.fps)); end = n if a.end < 0 else a.end
        t0 = time.time()
        for f in range(a.start, end):
            fn = out / f"f{f:05d}.png"
            if fn.exists(): continue
            img = r.frame(f / a.fps, a.fps, f)
            tmp = fn.with_suffix(".tmp.png")
            cv2.imwrite(str(tmp), img[:, :, ::-1]); tmp.replace(fn)
            if f % 10 == 0: print(f"frame {f}/{end}  {(time.time()-t0):.0f}s", flush=True)

def video(a, r):
    n = int(round(LOOP_T * a.fps))
    cmd = ["ffmpeg", "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{a.w}x{a.h}", "-r", str(a.fps), "-i", "-",
           "-c:v", "libx264", "-preset", "slow", "-crf", str(a.crf), "-pix_fmt", "yuv420p",
           "-vf", "scale=out_color_matrix=bt709:out_range=tv", "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709",
           "-movflags", "+faststart", a.out]
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    t0 = time.time()
    for f in range(n):
        p.stdin.write(r.frame(f / a.fps, a.fps, f).tobytes())
        if f % 100 == 0: print(f"frame {f}/{n} {time.time()-t0:.0f}s", flush=True)
    p.stdin.close(); p.wait()

if __name__ == "__main__":
    main()
