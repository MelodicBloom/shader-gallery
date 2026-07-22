#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 outColor;

uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float speed;
uniform float amplitude;

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

void main() {
  vec2 uv = v_uv;
  float t = u_time * speed;
  float center = 0.52
    + sin(uv.x * 5.5 + t) * 0.10 * amplitude
    + sin(uv.x * 11.0 - t * 0.63) * 0.045 * amplitude;

  float turbulence = (valueNoise(vec2(uv.x * 7.0 - t * 0.12, uv.y * 4.0 + t * 0.08)) - 0.5) * 0.12;
  float distanceToRibbon = abs(uv.y - center - turbulence);

  float ribbon = exp(-distanceToRibbon * 24.0);
  float glow = exp(-distanceToRibbon * 7.0);
  vec3 night = vec3(0.012, 0.008, 0.08);
  vec3 green = vec3(0.08, 0.95, 0.62);
  vec3 cyan = vec3(0.08, 0.55, 1.0);
  vec3 violet = vec3(0.65, 0.18, 1.0);

  vec3 color = night;
  color += glow * mix(cyan, violet, uv.x) * 0.28;
  color += ribbon * mix(green, cyan, 0.5 + 0.5 * sin(uv.x * 8.0 + t)) * 0.95;

  outColor = vec4(color, 1.0);
}
