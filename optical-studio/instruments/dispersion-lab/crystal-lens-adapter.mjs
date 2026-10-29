/** Candidate-only adapter: Dispersion Instrument export → Crystal Lens v1.2 uniforms.
 * Does NOT mutate GLSL. Does NOT claim physical spectral accuracy.
 * Crystal Lens baseIOR = 1.40 + paletteShift*0.30  (range 1.40..1.70)
 * Channel IORs use authored offsets, not Fraunhofer C/d/F.
 */
import { PRESETS, reference, compareToThreeChannelProxy, exportCandidate } from './cauchy.mjs';

export const CRYSTAL_LENS_ND_MIN = 1.40;
export const CRYSTAL_LENS_ND_MAX = 1.70;
/** Artistic half-span when spectral=1 and dispersionUI=0 (nB−nR ≈ 0.135). */
export const ARTISTIC_CHANNEL_SPAN_AT_UNIT = 0.055 + 0.080;

export function ndToPaletteShift(nd) {
  const raw = (nd - CRYSTAL_LENS_ND_MIN) / (CRYSTAL_LENS_ND_MAX - CRYSTAL_LENS_ND_MIN);
  const clamped = Math.min(1, Math.max(0, raw));
  return {
    paletteShift: clamped,
    baseIORTarget: nd,
    baseIORRendered: CRYSTAL_LENS_ND_MIN + clamped * (CRYSTAL_LENS_ND_MAX - CRYSTAL_LENS_ND_MIN),
    outOfRange: raw < 0 || raw > 1,
  };
}

/**
 * Map physical nF−nC into spectral × (1+dispersionUI).
 * Prefer holding spectral=1 and solving dispersionUI when possible; else scale both.
 * displayExaggeration (default 3) matches instrument previewDisplaySpreadMultiplier —
 * appearance only; never written into physical model fields.
 */
export function spreadToDispersionControls(deltaFC, { displayExaggeration = 3, preferSpectral = 1 } = {}) {
  if (!(deltaFC >= 0) || !Number.isFinite(deltaFC)) {
    throw new RangeError(`deltaFC must be finite ≥ 0, got ${deltaFC}`);
  }
  const appearanceSpread = deltaFC * displayExaggeration;
  const productNeeded = appearanceSpread / ARTISTIC_CHANNEL_SPAN_AT_UNIT;
  let spectral = preferSpectral;
  let dispersionUI = productNeeded / spectral - 1;
  if (dispersionUI < 0) {
    dispersionUI = 0;
    spectral = Math.min(1, productNeeded);
  } else if (dispersionUI > 2) {
    dispersionUI = 2;
    spectral = Math.min(1, productNeeded / (1 + dispersionUI));
  }
  return {
    spectral,
    dispersionUI,
    appearanceSpreadTarget: appearanceSpread,
    product: spectral * (1 + dispersionUI),
    displayExaggeration,
  };
}

export function adaptCandidate(presetId, nd, vd, options = {}) {
  const candidate = exportCandidate(presetId, nd, vd);
  const ref = reference(nd, vd);
  const ndMap = ndToPaletteShift(nd);
  const spreadMap = spreadToDispersionControls(ref.deltaFC, options);
  const proxies = compareToThreeChannelProxy(nd, vd);
  const warnings = [];
  if (ndMap.outOfRange) {
    warnings.push(
      `nd ${nd} outside Crystal Lens authored range [${CRYSTAL_LENS_ND_MIN}, ${CRYSTAL_LENS_ND_MAX}]; paletteShift clamped → rendered baseIOR ${ndMap.baseIORRendered.toFixed(4)}`,
    );
  }
  warnings.push(
    'Crystal Lens uses three authored RGB Snell paths, not seven Cauchy samples or Fraunhofer-bound IORs.',
  );
  warnings.push(
    'Adapter output is candidate-only; do not set production uniforms without an image/source receipt and QUALITY_GATES entry.',
  );

  return {
    schemaVersion: 'crystal-lens-adapter/0.1.0',
    status: 'candidate-only',
    source: candidate,
    proposedUniforms: {
      paletteShift: Number(ndMap.paletteShift.toFixed(4)),
      spectral: Number(spreadMap.spectral.toFixed(4)),
      dispersionUI: Number(spreadMap.dispersionUI.toFixed(4)),
      // unchanged artistic defaults — adapter does not invent finish/lighting
      grain: null,
      roughness: null,
      warp: null,
      causticStrength: null,
      bloomMix: null,
    },
    derived: {
      ...ndMap,
      ...spreadMap,
      physicalSpread: ref.deltaFC,
      fraunhoferProxies: proxies,
      futureDirectIorUniforms: {
        note: 'Proposed if Crystal Lens gains explicit nR/nG/nB uniforms; not present in v1.2',
        nR_as_nC: proxies.redProxy,
        nG_as_nd: proxies.greenProxy,
        nB_as_nF: proxies.blueProxy,
      },
    },
    warnings,
    modelBoundary: {
      calibrated: false,
      connectedToLiveShader: false,
      evidenceClass: 'HYPOTHESIS',
    },
  };
}

export function adaptPreset(presetId, options = {}) {
  const p = PRESETS.find((x) => x.id === presetId);
  if (!p) throw new RangeError(`Unknown preset ${presetId}`);
  return adaptCandidate(p.id, p.nd, p.vd, options);
}

export function adaptAllPresets(options = {}) {
  return PRESETS.map((p) => adaptPreset(p.id, options));
}
