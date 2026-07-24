#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 outColor;

uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float orientation;
uniform float contrast;

const float TAU = 6.28318530718;

vec3 spectral(float x) {
  return 0.5 + 0.5 * cos(TAU * (x + vec3(0.02, 0.35, 0.68)));
}

void main() {
  vec2 aspect = vec2(u_resolution.x / max(u_resolution.y, 1.0), 1.0);
  vec2 p = (v_uv - 0.5) * aspect;
  vec2 direction = vec2(cos(orientation), sin(orientation));
  vec2 tangent = vec2(-direction.y, direction.x);

  float primary = dot(p, direction) * 19.0;
  float secondary = dot(p, tangent) * 7.0;
  float wave = 0.5 + 0.5 * sin(primary + sin(secondary + u_time * 0.35) * 1.6 + u_time * 0.8);
  wave = pow(clamp(wave, 0.0, 1.0), max(contrast, 0.05));

  vec3 color = mix(vec3(0.08, 0.12, 0.22), spectral(wave), 0.82);
  color += pow(wave, 8.0) * vec3(0.75, 0.9, 1.0) * 0.35;

  outColor = vec4(color, 1.0);
}
