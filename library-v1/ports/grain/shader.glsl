#version 300 es
precision highp float;
precision highp int;
uniform float u_strength;
uniform float u_frequency;
uniform int u_octaves;
uniform uint u_seed;
uniform vec3 u_base;
out vec4 outColor;

// Seeded value noise. This is an independent algorithm, not SVG's turbulence.
float lattice(uvec2 p) {
  uint h = p.x * 374761393u + p.y * 668265263u + u_seed * 2246822519u;
  h = (h ^ (h >> 13u)) * 1274126177u;
  return float(h ^ (h >> 16u)) / 4294967295.0;
}
float noise(vec2 p) {
  uvec2 cell = uvec2(floor(p));
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(lattice(cell), lattice(cell + uvec2(1, 0)), f.x),
             mix(lattice(cell + uvec2(0, 1)), lattice(cell + uvec2(1, 1)), f.x), f.y);
}
void main() {
  if (u_strength == 0.0) {
    outColor = vec4(u_base, 1.0);
    return;
  }
  vec2 p = gl_FragCoord.xy * u_frequency;
  float sum = 0.0, weight = 0.5, total = 0.0;
  for (int octave = 0; octave < 5; octave++) {
    if (octave >= u_octaves) break;
    sum += weight * noise(p);
    total += weight;
    weight *= 0.5;
    p *= 2.0;
  }
  float grain = clamp(sum / total, 0.0, 1.0);
  outColor = vec4(u_base * mix(1.0, grain, u_strength), 1.0);
}
