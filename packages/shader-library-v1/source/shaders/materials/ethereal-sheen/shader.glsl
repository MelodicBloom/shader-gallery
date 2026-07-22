#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 outColor;

uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float sheen;
uniform float detail;

const float TAU = 6.28318530718;

float hash21(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

vec3 sheenPalette(float x) {
  vec3 phase = vec3(0.02, 0.31, 0.64);
  return 0.62 + 0.38 * sin(TAU * (x + phase + u_time * 0.05));
}

void main() {
  vec2 aspect = vec2(u_resolution.x / max(u_resolution.y, 1.0), 1.0);
  vec2 p = (v_uv - 0.5) * aspect;
  float angle = atan(p.y, p.x);

  float scale = 35.0 + detail * 180.0;
  float grain = hash21(floor(v_uv * scale));
  float field = 0.5 + 0.5 * sin(angle * 6.0 + u_time * 0.2 + grain * 2.0 + length(p) * 9.0);

  vec3 spectral = sheenPalette(field);
  vec3 color = mix(vec3(0.92, 0.94, 0.97), spectral, clamp(sheen, 0.0, 1.0));
  float fresnel = pow(clamp(length(p) * 1.45, 0.0, 1.0), 2.0);
  color += fresnel * vec3(0.18, 0.28, 0.55) * sheen;

  outColor = vec4(color, 1.0);
}
