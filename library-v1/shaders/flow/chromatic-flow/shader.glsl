#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 outColor;

uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float flowScale;
uniform float dispersion;

const float TAU = 6.28318530718;

float hash21(vec2 p) {
  return fract(sin(dot(p, vec2(41.7, 289.1))) * 43758.5453123);
}

vec2 flowDirection(vec2 cell, float time) {
  float angle = TAU * hash21(cell) + time * 0.22;
  return vec2(cos(angle), sin(angle));
}

float field(vec2 p, float offset) {
  vec2 cell = floor(p);
  vec2 local = fract(p) - 0.5;
  vec2 direction = flowDirection(cell, u_time + offset);
  return sin(TAU * (dot(local, direction) + 0.18 * sin(p.x * 0.7 + u_time * 0.4 + offset)));
}

void main() {
  vec2 aspect = vec2(u_resolution.x / max(u_resolution.y, 1.0), 1.0);
  vec2 p = (v_uv - 0.5) * aspect * max(flowScale, 0.05);

  float separation = dispersion * 0.16;
  float red = field(p + vec2(separation, 0.0), 0.0);
  float green = field(p, 1.8);
  float blue = field(p - vec2(separation, 0.0), 3.6);

  vec3 color = 0.5 + 0.5 * sin(vec3(red, green, blue) * 1.7 + vec3(0.0, 1.5, 3.0));
  float luminance = 0.45 + 0.55 * smoothstep(-0.8, 0.9, (red + green + blue) / 3.0);
  color *= luminance;

  outColor = vec4(color, 1.0);
}
