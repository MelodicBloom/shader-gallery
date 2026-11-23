#!/usr/bin/env python3
"""Rebuild index.html from tools/index.template.html + shaders/*.glsl (shaders are inlined so the
page works from file:// and from GitHub Pages with no fetch/CORS issues)."""
import os
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
t = open(os.path.join(R, "tools", "index.template.html")).read()
t = t.replace("/*__SCENE__*/", open(os.path.join(R, "shaders", "buffer_a.glsl")).read())
t = t.replace("/*__POST__*/", open(os.path.join(R, "shaders", "image.glsl")).read())
open(os.path.join(R, "index.html"), "w").write(t)
print("wrote index.html")
