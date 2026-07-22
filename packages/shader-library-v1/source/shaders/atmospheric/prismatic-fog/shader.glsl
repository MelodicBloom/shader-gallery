#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 outColor;

uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float density;
uniform float falloff;

float hash21(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
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

float fogField(vec2 uv, float channelOffset) {
  vec2 p = uv - 0.5;
  float radial = exp(-length(p) * max(falloff, 0.05));
  float noiseA = valueNoise(uv * 5.0 + vec2(u_time * 0.035 + channelOffset, -u_time * 0.022));
  float noiseB = valueNoise(uv * 13.0 - vec2(u_time * 0.018, channelOffset * 2.0));
  return radial * density * (0.58 + noiseA * 0.30 + noiseB * 0.12);
}

void main() {
  float offset = 0.025;
  float red = fogField(v_uv + vec2(offset, 0.0), 0.0);
  float green = fogField(v_uv, 2.0);
  float blue = fogField(v_uv - vec2(offset, 0.0), 4.0);

  vec3 color = vec3(red * 0.78, green * 0.92, blue * 1.12);
  color += vec3(0.10, 0.16, 0.28) * min((red + green + blue) / 3.0, 1.0);
  float alpha = clamp(max(max(red, green), blue), 0.0, 0.92);

  outColor = vec4(color, alpha);
}
