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
  vec2 p = vec2(gl_FragCoord.x * u_frequency * 0.22, gl_FragCoord.y * u_frequency * 3.4);
  float sum = 0.0, weight = 0.5, total = 0.0;
  for (int octave = 0; octave < 5; octave++) {
    if (octave >= u_octaves) break;
    sum += weight * noise(p);
    total += weight;
    weight *= 0.5;
    p *= 2.0;
  }
  float fiber = clamp(sum / total, 0.0, 1.0);
  float laid = 0.65 + 0.35 * sin(gl_FragCoord.y * u_frequency * 2.2 + fiber * 6.28318);
  float ringDist = length(gl_FragCoord.xy - vec2(-80.0, 520.0));
  float ring = smoothstep(0.02, 0.0, abs(fract(ringDist * 0.018) - 0.5) - 0.46);
  float height = fiber * 0.65 + laid * 0.25 + ring * 0.1;
  vec3 normal = normalize(vec3(-dFdx(height) * 22.0, -dFdy(height) * 22.0, 1.0));
  vec3 light = normalize(vec3(0.25, 0.72, 0.7));
  float shade = mix(0.55, 1.22, clamp(dot(normal, light), 0.0, 1.0));
  float spec = pow(clamp(dot(reflect(-light, normal), vec3(0.0, 0.0, 1.0)), 0.0, 1.0), 36.0);
  vec3 paper = u_base * shade * mix(0.82, 1.0, laid) * mix(1.0, 0.62, ring);
  outColor = vec4(mix(u_base, paper, u_strength) + spec * u_strength * 0.16, 1.0);
}
