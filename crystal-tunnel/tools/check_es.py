#!/usr/bin/env python3
"""Compile both shaders as GLSL ES 3.00 (the WebGL2 dialect) through Mesa's ARB_ES3_compatibility, low+high variants."""
import os, moderngl
os.environ.setdefault("EGL_PLATFORM", "surfaceless")
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ctx = moderngl.create_context(standalone=True, backend="egl")
VS = "#version 300 es\nin vec2 p; void main(){ gl_Position = vec4(p,0,1); }"
H = lambda d: "#version 300 es\nprecision highp float; precision highp int;\n" + d + "\nuniform vec3 iResolution; uniform float iTime; uniform float iTimeDelta; uniform int iFrame;\nuniform sampler2D iChannel0;\nout vec4 outColor;\n"
F = "\nvoid main(){ vec4 c; mainImage(c, gl_FragCoord.xy); outColor = c; }\n"
sc = open(os.path.join(R, "shaders/buffer_a.glsl")).read(); po = open(os.path.join(R, "shaders/image.glsl")).read()
for name, src in [("buffer_a low", H("#define AA 1\n#define LOWQ") + sc), ("buffer_a high", H("#define AA 2") + sc), ("image", H("") + po)]:
    ctx.program(vertex_shader=VS, fragment_shader=src + F); print("OK  GLSL ES 3.00:", name)
