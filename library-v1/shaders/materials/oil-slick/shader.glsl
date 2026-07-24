#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 outColor;

uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float filmThickness;
uniform float iridescence;

const float TAU = 6.28318530718;

vec3 thinFilmColor(float angle, float thickness) {
  float t = thickness * 10.0;
  float r = 0.5 + 0.5 * cos(TAU * (t + angle * 0.477 + u_time * 0.10));
  float g = 0.5 + 0.5 * cos(TAU * (t * 1.20 + angle * 0.398 + u_time * 0.12));
  float b = 0.5 + 0.5 * cos(TAU * (t * 1.50 + angle * 0.286 + u_time * 0.14));
  return vec3(r, g, b);
}

void main() {
  vec2 aspect = vec2(u_resolution.x / max(u_resolution.y, 1.0), 1.0);
  vec2 p = (v_uv - 0.5) * aspect;
  float radius = length(p);
  float angle = atan(p.y, p.x) / TAU;

  vec3 normal = normalize(vec3(p * 1.8, 0.65));
  float fresnel = pow(1.0 - abs(normal.z), 0.55);
  float ripple = 0.08 * sin(radius * 28.0 - u_time * 0.65)
               + 0.035 * sin(angle * TAU * 7.0 + u_time * 0.4);
  float thickness = clamp(filmThickness + ripple, 0.0, 1.2);

  vec3 spectral = thinFilmColor(angle, thickness);
  vec3 graphite = vec3(0.025, 0.03, 0.04);
  vec3 pearl = vec3(0.86, 0.89, 0.94);
  vec3 color = mix(graphite, pearl, 0.22 + 0.35 * (1.0 - radius));
  color = mix(color, spectral, clamp(iridescence * (0.32 + fresnel), 0.0, 1.0));

  float highlight = pow(max(0.0, dot(normal, normalize(vec3(-0.35, 0.45, 1.0)))), 28.0);
  color += highlight * vec3(0.95, 0.98, 1.0) * 0.65;

  float alpha = 1.0 - smoothstep(0.42, 0.66, radius);
  outColor = vec4(color, alpha);
}
