#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 outColor;

uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float thickness;
uniform float contrast;

const float TAU = 6.28318530718;

vec3 palette(float x) {
  vec3 cool = vec3(0.11, 0.48, 1.0);
  vec3 warm = vec3(1.0, 0.42, 0.78);
  vec3 pearl = vec3(0.88, 0.95, 1.0);
  return mix(mix(cool, warm, smoothstep(0.1, 0.9, x)), pearl, 0.15);
}

void main() {
  vec2 aspect = vec2(u_resolution.x / max(u_resolution.y, 1.0), 1.0);
  vec2 p = (v_uv - 0.5) * aspect;

  float curvature = dot(p, p);
  vec3 normal = normalize(vec3(p * 1.4, 0.8));
  float fresnel = pow(clamp(1.0 - normal.z, 0.0, 1.0), 1.45);
  float phase = thickness * 10.0 + curvature * 11.0 - u_time * 0.22;
  float band = 0.5 + 0.5 * cos(phase);
  band = pow(clamp(band, 0.0, 1.0), max(contrast, 0.05));

  vec3 color = palette(band);
  color *= 0.72 + 0.55 * fresnel;
  color += pow(fresnel, 3.0) * vec3(0.3, 0.55, 1.0) * 0.45;

  outColor = vec4(color, 1.0);
}
