// Thin-film iridescence (hand-written), injected into MeshPhysicalMaterial via onBeforeCompile.
// A view-angle (Fresnel) driven rainbow sheen, like oil on glass or a coated cut crystal.
uniform float uFilm;   // strength, driven by the Dispersion slider
uniform float uHue;    // phase, driven by the hue-cycle clock
uniform float uSpread; // spectral spread (higher in Gem mode)

// Cosine palette: a cheap stand-in for thin-film interference colours.
vec3 filmPalette(float x) {
  return 0.5 + 0.5 * cos(6.28318 * (vec3(0.0, 0.33, 0.67) + x));
}

vec3 thinFilm(vec3 n, vec3 viewDir) {
  float ndv = clamp(dot(n, viewDir), 0.0, 1.0);
  float fresnel = 0.3 + 0.7 * pow(1.0 - ndv, 2.0);  // grazing angles carry most colour
  float opd = ndv * uSpread + uHue;                  // optical path difference ~ cos(theta)
  // zero-mean chroma: shifts hue across facets without brightening (no bloom flooding)
  return (filmPalette(opd) - 0.5) * 2.0 * fresnel * uFilm;
}
