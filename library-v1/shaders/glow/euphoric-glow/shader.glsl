#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 outColor;

uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float glow;
uniform float hueShift;

vec3 hsv2rgb(vec3 c) {
  vec3 p = abs(fract(c.xxx + vec3(0.0, 2.0 / 3.0, 1.0 / 3.0)) * 6.0 - 3.0);
  return c.z * mix(vec3(1.0), clamp(p - 1.0, 0.0, 1.0), c.y);
}

void main() {
  vec2 aspect = vec2(u_resolution.x / max(u_resolution.y, 1.0), 1.0);
  vec2 p = (v_uv - 0.5) * aspect;
  float r = length(p);

  float core = exp(-r * 11.0);
  float halo = exp(-r * 3.2);
  float ring = exp(-abs(r - 0.24) * 32.0);
  float hue = fract(u_time * 0.05 + hueShift + r * 0.35);

  vec3 chroma = hsv2rgb(vec3(hue, 0.72, 1.0));
  vec3 color = chroma * (0.22 + halo * 0.55 + core * glow);
  color += ring * hsv2rgb(vec3(fract(hue + 0.33), 0.55, 1.0)) * glow * 0.35;

  outColor = vec4(color, 1.0);
}
