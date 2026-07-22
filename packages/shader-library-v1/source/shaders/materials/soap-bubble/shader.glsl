#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 outColor;

uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float speed;
uniform float bandWidth;

const float TAU = 6.28318530718;

float hash21(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float valueNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

vec3 spectral(float x) {
  return 0.55 + 0.45 * cos(TAU * (x + vec3(0.00, 0.33, 0.67)));
}

void main() {
  vec2 aspect = vec2(u_resolution.x / max(u_resolution.y, 1.0), 1.0);
  vec2 p = (v_uv - 0.5) * aspect;
  float r = length(p);
  float t = u_time * speed;

  float n = valueNoise(v_uv * 12.0 + vec2(t * 0.08, -t * 0.05));
  float membrane = r * 24.0 - t * 1.7 + n * 2.2;
  float wave = sin(membrane) + 0.35 * sin(membrane * 0.47 + t);
  float line = 1.0 - smoothstep(0.0, max(bandWidth, 0.001) * 8.0, abs(wave));

  vec3 color = mix(vec3(0.04, 0.06, 0.10), spectral(membrane / TAU), 0.72);
  color += line * vec3(0.65, 0.95, 1.0);

  vec3 normal = normalize(vec3(p * 1.7, sqrt(max(0.0, 0.3 - r * r))));
  float rim = pow(clamp(1.0 - abs(normal.z), 0.0, 1.0), 1.8);
  color += rim * vec3(0.8, 0.65, 1.0);

  float alpha = 1.0 - smoothstep(0.47, 0.505, r);
  outColor = vec4(color, alpha);
}
