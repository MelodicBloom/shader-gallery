#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 outColor;

uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float seed;
uniform float radialFrequency;
uniform float vortexStrength;
uniform float feedbackAmount;
uniform vec3 paletteA;
uniform vec3 paletteB;
uniform vec3 paletteC;

const float TAU = 6.28318530718;

float seededHash(vec2 p) {
  vec2 offset = vec2(seed * 0.017, seed * 0.071);
  return fract(sin(dot(p + offset, vec2(127.1, 311.7))) * 43758.5453123);
}

float valueNoise(vec2 p) {
  vec2 cell = floor(p);
  vec2 local = fract(p);
  vec2 curve = local * local * (3.0 - 2.0 * local);
  float a = seededHash(cell);
  float b = seededHash(cell + vec2(1.0, 0.0));
  float c = seededHash(cell + vec2(0.0, 1.0));
  float d = seededHash(cell + vec2(1.0, 1.0));
  return mix(mix(a, b, curve.x), mix(c, d, curve.x), curve.y);
}

float field(vec2 p) {
  float sum = 0.0;
  float weight = 0.56;
  mat2 turn = mat2(0.80, -0.60, 0.60, 0.80);
  for (int octave = 0; octave < 4; octave++) {
    sum += weight * valueNoise(p);
    p = turn * p * 2.03 + vec2(13.2, -7.8);
    weight *= 0.5;
  }
  return sum;
}

vec3 threeStopPalette(float t) {
  float first = smoothstep(0.0, 0.52, t);
  float second = smoothstep(0.45, 1.0, t);
  return mix(mix(paletteA, paletteB, first), paletteC, second);
}

void main() {
  vec2 aspect = vec2(u_resolution.x / max(u_resolution.y, 1.0), 1.0);
  vec2 p = (v_uv - 0.5) * aspect * 2.0;
  float radius = max(length(p), 0.001);
  vec2 radial = p / radius;
  vec2 tangent = vec2(-radial.y, radial.x);
  float recurrence = clamp(feedbackAmount, 0.0, 1.0);
  float rings = radius * max(radialFrequency, 0.1) * TAU;
  float pulse = sin(rings - u_time * 0.72 + seed * 0.013);
  vec2 flow = normalize(tangent * (0.55 + vortexStrength * (0.36 + 0.24 * pulse)) + radial * (0.24 * pulse));

  // This is a single-frame recurrence approximation: no prior framebuffer is sampled.
  vec2 carried = p + flow * (0.09 + recurrence * 0.24) + tangent * sin(radius * 9.0 - u_time * 0.4) * 0.025;
  float currentField = field(carried * (1.25 + radialFrequency * 0.16) + vec2(u_time * 0.07, -u_time * 0.04));
  float echoField = field((p - flow * 0.18) * (1.6 + radialFrequency * 0.1) + vec2(4.7, -2.9));
  float density = mix(currentField, 0.5 * currentField + 0.5 * echoField, recurrence);

  float filament = 0.5 + 0.5 * sin(rings + density * 9.0 - u_time * (0.5 + vortexStrength * 0.18));
  float bloom = smoothstep(0.46, 0.94, density * 0.72 + filament * 0.48);
  float core = exp(-radius * (2.8 + radialFrequency * 0.12));
  float halo = exp(-abs(radius - 0.44 - density * 0.08) * 8.0);
  float palettePosition = clamp(0.12 + density * 0.78 + filament * 0.18, 0.0, 1.0);

  vec3 color = threeStopPalette(palettePosition) * (0.14 + bloom * 0.86);
  color += mix(paletteB, paletteC, filament) * halo * (0.16 + recurrence * 0.24);
  color += paletteA * core * 0.28;
  outColor = vec4(color, 1.0);
}
