import test from 'node:test';
import assert from 'node:assert/strict';
import { PRESETS, reference } from './cauchy.mjs';
import {
  ARTISTIC_CHANNEL_SPAN_AT_UNIT,
  CRYSTAL_LENS_ND_MAX,
  CRYSTAL_LENS_ND_MIN,
  adaptAllPresets,
  adaptCandidate,
  adaptPreset,
  ndToPaletteShift,
  spreadToDispersionControls,
} from './crystal-lens-adapter.mjs';

const near = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) < tol, `${a} != ${b}`);

test('nd mid-range maps linearly into paletteShift', () => {
  const m = ndToPaletteShift(1.55);
  near(m.paletteShift, (1.55 - CRYSTAL_LENS_ND_MIN) / 0.3);
  assert.equal(m.outOfRange, false);
  near(m.baseIORRendered, 1.55);
});

test('nd outside Crystal Lens range clamps and flags', () => {
  assert.equal(ndToPaletteShift(1.333).outOfRange, true);
  assert.equal(ndToPaletteShift(1.333).paletteShift, 0);
  assert.equal(ndToPaletteShift(2.417).outOfRange, true);
  assert.equal(ndToPaletteShift(2.417).paletteShift, 1);
  near(ndToPaletteShift(2.417).baseIORRendered, CRYSTAL_LENS_ND_MAX);
});

test('spread mapping keeps physical model separate from 3× appearance', () => {
  const delta = reference(1.62, 30).deltaFC;
  const s = spreadToDispersionControls(delta, { displayExaggeration: 3 });
  near(s.appearanceSpreadTarget, delta * 3);
  assert.ok(s.spectral >= 0 && s.spectral <= 1);
  assert.ok(s.dispersionUI >= 0 && s.dispersionUI <= 2);
  near(s.product * ARTISTIC_CHANNEL_SPAN_AT_UNIT, s.appearanceSpreadTarget, 1e-6);
});

test('crown preset stays in-range; diamond flags clamp', () => {
  const crown = adaptPreset('crown');
  assert.equal(crown.derived.outOfRange, false);
  assert.equal(crown.status, 'candidate-only');
  assert.equal(crown.modelBoundary.connectedToLiveShader, false);
  assert.ok(crown.proposedUniforms.paletteShift >= 0 && crown.proposedUniforms.paletteShift <= 1);

  const diamond = adaptPreset('diamond');
  assert.equal(diamond.derived.outOfRange, true);
  assert.match(diamond.warnings.join(' '), /outside Crystal Lens/);
});

test('adaptAllPresets covers five materials and never claims live bind', () => {
  const all = adaptAllPresets();
  assert.equal(all.length, PRESETS.length);
  for (const a of all) {
    assert.equal(a.schemaVersion, 'crystal-lens-adapter/0.1.0');
    assert.equal(a.proposedUniforms.grain, null);
    assert.ok(a.warnings.length >= 2);
  }
});

test('custom candidate preserves export schema linkage', () => {
  const a = adaptCandidate('custom', 1.62, 30);
  assert.equal(a.source.schemaVersion, 'dispersion-instrument/0.1.0');
  near(a.derived.physicalSpread, (1.62 - 1) / 30);
  assert.ok(a.derived.futureDirectIorUniforms.nB_as_nF > a.derived.futureDirectIorUniforms.nG_as_nd);
});
