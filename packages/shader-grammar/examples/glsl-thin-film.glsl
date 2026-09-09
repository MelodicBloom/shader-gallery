// Illustrative approximation; the ontology remains implementation-neutral.
vec3 thinFilmApprox(float thicknessNm, float cosTheta) {
  vec3 lambdaNm = vec3(650.0, 510.0, 475.0);
  vec3 phase = 4.0 * 3.14159265 * 1.46 * thicknessNm * cosTheta / lambdaNm;
  return 0.5 + 0.5 * cos(phase);
}
