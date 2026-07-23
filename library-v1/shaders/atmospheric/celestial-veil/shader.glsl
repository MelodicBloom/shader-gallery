#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 outColor;

uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float density;
uniform vec3 tint;

float hash21(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

float starLayer(vec2 uv, float scale, float threshold) {
  vec2 grid = uv * scale;
  vec2 id = floor(grid);
  vec2 local = fract(grid) - 0.5;
  float seed = hash21(id);
  vec2 offset = vec2(hash21(id + 17.3), hash21(id + 41.7)) - 0.5;
  float radius = length(local - offset * 0.6);
  float sparkle = step(threshold, seed) * smoothstep(0.09, 0.0, radius);
  sparkle *= 0.65 + 0.35 * sin(u_time * (0.8 + seed * 1.7) + seed * 20.0);
  return sparkle;
}

void main() {
  vec2 uv = v_uv;
  float stars = 0.0;
  stars += starLayer(uv, 24.0, 0.965);
  stars += starLayer(uv + 0.17, 42.0, 0.982) * 0.65;
  stars += starLayer(uv - 0.31, 68.0, 0.991) * 0.42;
  stars *= density;

  float veil = 0.5 + 0.5 * sin(uv.x * 5.0 + uv.y * 3.0 + u_time * 0.08);
  vec3 background = mix(vec3(0.008, 0.004, 0.028), tint, 0.12 + veil * 0.12);
  vec3 color = background + stars * vec3(0.86, 0.94, 1.0);

  outColor = vec4(color, 1.0);
}
