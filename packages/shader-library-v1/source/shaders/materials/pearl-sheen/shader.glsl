#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 outColor;

uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform vec3 baseColor;
uniform float sheen;

vec3 ramp(float x) {
  vec3 rose = vec3(1.0, 0.78, 0.92);
  vec3 cyan = vec3(0.62, 0.94, 1.0);
  return mix(baseColor, mix(rose, cyan, x), 0.55);
}

void main() {
  vec2 aspect = vec2(u_resolution.x / max(u_resolution.y, 1.0), 1.0);
  vec2 p = (v_uv - 0.5) * aspect;

  vec3 normal = normalize(vec3(p * 1.35, 0.72));
  float facing = pow(clamp(1.0 - normal.z, 0.0, 1.0), 1.25);
  float shimmer = 0.5 + 0.5 * sin(u_time * 0.8 + length(p) * 10.0 - p.x * 3.0);
  float response = clamp(shimmer * sheen * (0.35 + facing), 0.0, 1.0);

  vec3 color = ramp(response);
  color *= 0.88 + 0.22 * (1.0 - length(p));
  color += pow(facing, 3.0) * vec3(0.45, 0.65, 1.0) * sheen;

  outColor = vec4(color, 1.0);
}
