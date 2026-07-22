#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 outColor;

uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform int bands;
uniform float phase;

const float TAU = 6.28318530718;

vec3 bandColor(float x) {
  return 0.5 + 0.5 * cos(TAU * (x + vec3(0.0, 0.33, 0.66)));
}

void main() {
  vec2 aspect = vec2(u_resolution.x / max(u_resolution.y, 1.0), 1.0);
  vec2 p = (v_uv - 0.5) * aspect;
  float r = length(p);
  float sum = 0.0;
  float count = float(max(bands, 1));

  for (int i = 1; i <= 8; ++i) {
    if (i <= bands) {
      float f = float(i);
      sum += 0.5 + 0.5 * cos(r * 10.0 * f + u_time * 0.2 + phase * f);
    }
  }

  sum /= count;
  vec3 color = bandColor(sum);
  color *= 0.72 + 0.45 * (1.0 - smoothstep(0.0, 0.75, r));

  outColor = vec4(color, 1.0);
}
