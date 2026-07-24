#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 outColor;

uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float scatter;
uniform float glow;

float hash21(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

void main() {
  vec2 aspect = vec2(u_resolution.x / max(u_resolution.y, 1.0), 1.0);
  vec2 p = (v_uv - 0.5) * aspect;
  float r = length(p);

  float pulse = 0.75 + 0.25 * sin(u_time * 1.2);
  float core = exp(-r * 10.0) * pulse;
  float halo = exp(-r * 3.2);
  float facets = 0.5 + 0.5 * sin(atan(p.y, p.x) * 7.0 + r * 24.0 - u_time * 0.4);

  vec3 rose = vec3(0.95, 0.58, 0.98);
  vec3 aqua = vec3(0.28, 0.95, 0.82);
  vec3 base = mix(rose, aqua, clamp(scatter, 0.0, 1.0));
  vec3 spectral = mix(base, vec3(0.62, 0.78, 1.0), facets * scatter);

  vec3 color = spectral * (0.35 + halo * 0.7 + core * glow);
  color += core * vec3(1.0, 0.95, 0.86) * glow;

  outColor = vec4(color, 1.0);
}
