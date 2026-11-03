/** Original MelodicBloom educational optics instrument. No oavivo source used.
 * Model: the two-term Cauchy parameterization of KHR_materials_dispersion.
 * Scalar, transparent, isotropic approximation only; no measurement claim.
 */
export const LINES_NM = Object.freeze({ F: 486.13, d: 587.56, C: 656.27 });
export const SAMPLES_NM = Object.freeze([450, 486.13, 530, 587.56, 610, 656.27, 700]);
export const PRESETS = Object.freeze([
  { id: 'water', name: 'Water', nd: 1.333, vd: 55.7, note: 'Illustrative reference; not calibrated to a water sample.' },
  { id: 'crown', name: 'Crown · N-BK7', nd: 1.517, vd: 64.2, note: 'Approximate catalog pair; wavelength-limited Cauchy fit.' },
  { id: 'flint', name: 'Dense flint · N-SF11', nd: 1.785, vd: 25.7, note: 'Approximate catalog pair; wavelength-limited Cauchy fit.' },
  { id: 'diamond', name: 'Diamond', nd: 2.417, vd: 55, note: 'High-index approximation; does not model internal faceting.' },
  { id: 'quartz', name: 'Rock crystal', nd: 1.544, vd: 69.9, note: 'Scalar approximation; quartz birefringence excluded.' }
]);

function finiteBetween(x, min, max) {
  if (!Number.isFinite(x) || x < min || x > max) throw new RangeError(`Expected finite value in [${min}, ${max}], received ${x}`);
}
export function coefficients(nd, vd) {
  finiteBetween(nd, 1.000001, 3);
  finiteBetween(vd, 1, 200);
  const { F, d, C } = LINES_NM;
  const B = (nd - 1) / (vd * (1 / (F * F) - 1 / (C * C)));
  return Object.freeze({ A: nd - B / (d * d), B });
}
export function indexAtNm(nd, vd, wavelengthNm) {
  finiteBetween(wavelengthNm, 380, 780);
  const { A, B } = coefficients(nd, vd);
  return A + B / (wavelengthNm * wavelengthNm);
}
export function reference(nd, vd) {
  const { F, d, C } = LINES_NM;
  const nF = indexAtNm(nd, vd, F);
  const ndComputed = indexAtNm(nd, vd, d);
  const nC = indexAtNm(nd, vd, C);
  return {
    nd, vd, nF, ndComputed, nC,
    deltaFC: nF - nC,
    expectedSpread: (nd - 1) / vd,
    coefficients: coefficients(nd, vd),
    sevenWavelengthIndices: SAMPLES_NM.map(nm => ({ nm, n: indexAtNm(nd, vd, nm) })),
    display: { kind: 'exaggeration-only', multiplier: 3, displayedSpread: 3 * (nF - nC) },
    displayContract: 'Readout displays physical-model spread; a 3x visualization parameter never alters n(lambda) or measured claims.'
  };
}
export function compareToThreeChannelProxy(nd, vd) {
  const r = reference(nd, vd);
  // These are Fraunhofer C/d/F indices, not camera-RGB effective spectra.
  return { redProxy: r.nC, greenProxy: r.ndComputed, blueProxy: r.nF, physicalModelSpread: r.deltaFC };
}
export function exportCandidate(presetId, nd, vd) {
  const result = reference(nd, vd);
  return {
    schemaVersion: 'dispersion-instrument/0.1.0',
    presetId, nd, vd,
    cauchy: result.coefficients,
    fraunhoferNm: LINES_NM,
    refIndices: compareToThreeChannelProxy(nd, vd),
    sevenSamples: result.sevenWavelengthIndices,
    previewDisplaySpreadMultiplier: 3,
    destination: 'candidate-only; no v1.2 GLSL uniform binding has been established',
    modelStatus: 'analytic educational approximation, NOT measured, NOT calibrated',
    sourceModel: 'Khronos KHR_materials_dispersion; oavivo credited as pedagogical/interface inspiration'
  };
}
