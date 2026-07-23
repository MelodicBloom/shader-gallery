#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 outColor;

uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float gridScale;
uniform float intensity;

const float TAU = 6.28318530718;

vec3 prism(float x) {
  return 0.5 + 0.5 * sin(vec3(x, x + 2.094, x + 4.188));
}

void main() {
  vec2 p = v_uv * max(gridScale, 0.1);
  vec2 cell = fract(p) - 0.5;
  float grid = exp(-12.0 * dot(cell, cell));
  float edge = 1.0 - smoothstep(0.38, 0.49, max(abs(cell.x), abs(cell.y)));
  float scan = 0.5 + 0.5 * sin(u_time * 6.0 + v_uv.y * 70.0);
  float diagonal = dot(v_uv, normalize(vec2(1.0, 0.65)));

  vec3 color = prism(diagonal * TAU * 2.0 + u_time * 0.55);
  color *= 0.18 + intensity * (0.58 * grid + 0.30 * edge + 0.12 * scan);
  color += pow(scan, 12.0) * vec3(0.55, 0.8, 1.0) * 0.18;

  outColor = vec4(color, 1.0);
}
