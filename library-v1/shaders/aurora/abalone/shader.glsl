#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 outColor;

uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float grain;
uniform float paletteShift;

const float TAU = 6.28318530718;

float hash21(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

float valueNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash21(i), hash21(i + vec2(1.0, 0.0)), u.x),
    mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  mat2 rotation = mat2(0.87758, 0.47943, -0.47943, 0.87758);
  for (int i = 0; i < 5; ++i) {
    value += amplitude * valueNoise(p);
    p = rotation * p * 2.03 + 0.17;
    amplitude *= 0.5;
  }
  return value;
}

vec3 abalonePalette(float x) {
  vec3 phase = vec3(0.02, 0.22 + paletteShift * 0.12, 0.52 - paletteShift * 0.08);
  return 0.52 + 0.48 * cos(TAU * (x + phase));
}

void main() {
  vec2 aspect = vec2(u_resolution.x / max(u_resolution.y, 1.0), 1.0);
  vec2 p = (v_uv - 0.5) * 2.0 * aspect;
  float t = u_time * 0.16;

  vec2 warp = vec2(
    fbm(p * 1.35 + vec2(t, -t * 0.6)),
    fbm(p * 1.35 + vec2(4.3 - t * 0.4, 1.7 + t * 0.7))
  );

  float micro = fbm(p * 7.0 + warp * 2.0);
  float ridges = sin(length(p + (warp - 0.5) * 0.42) * 15.0
                   + warp.x * 6.0 + micro * grain * 8.0 - t * 2.0);
  float phase = 0.5 + 0.5 * ridges;

  vec3 color = abalonePalette(phase + micro * 0.18);
  float depth = fbm(p * 1.1 + warp);
  color *= 0.38 + 0.85 * smoothstep(0.12, 0.88, depth);

  vec3 normal = normalize(vec3((warp - 0.5) * 1.6, 0.75));
  vec3 light = normalize(vec3(-0.35, 0.5, 1.0));
  float specular = pow(max(dot(normal, light), 0.0), 34.0);
  color += specular * vec3(1.0, 0.96, 0.88) * 0.8;

  float vignette = smoothstep(1.45, 0.15, length(p));
  color *= 0.55 + 0.45 * vignette;

  outColor = vec4(color, 1.0);
}
