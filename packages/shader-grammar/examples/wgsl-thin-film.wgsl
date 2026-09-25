// Illustrative approximation; the ontology remains implementation-neutral.
fn thin_film_approx(thickness_nm: f32, cos_theta: f32) -> vec3<f32> {
  let lambda_nm = vec3<f32>(650.0, 510.0, 475.0);
  let phase = 4.0 * 3.14159265 * 1.46 * thickness_nm * cos_theta / lambda_nm;
  return vec3<f32>(0.5) + vec3<f32>(0.5) * cos(phase);
}
