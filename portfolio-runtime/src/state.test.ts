import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sceneStore, uniformContract, resetScene, setUniform, setLightHeading, orbit, serializePreset, restorePreset, parsePreset, createEvidenceMatrix, pixelRatioForBudget, MAX_RENDER_PIXELS } from './state';
test('preset round trip restores semantic state and displayed time', () => {
  resetScene(false); setUniform('spectral', 0.8); orbit(1, 0.3, 4);
  sceneStore.setState({ playback: 'paused', reducedMotion: true, inspectorVisible: false });
  const saved = serializePreset(12.5); resetScene(false); restorePreset(saved);
  assert.deepEqual(sceneStore.getState(), JSON.parse(saved));
  assert.equal(serializePreset(), saved);
});
test('invalid preset is rejected atomically, including NaN-like/null, wrong modes and bounds', () => {
  resetScene(false); const before = sceneStore.getState();
  for (const mutate of [
    (p: any) => p.uniforms.grain = null,
    (p: any) => p.uniforms.roughness = 2,
    (p: any) => p.camera.pitch = 9,
    (p: any) => p.playback = 'unknown',
    (p: any) => p.reducedMotion = 'false',
    (p: any) => p.time = -1,
  ]) { const p = JSON.parse(serializePreset()); mutate(p); assert.throws(() => restorePreset(JSON.stringify(p))); assert.equal(sceneStore.getState(), before); }
  assert.throws(() => parsePreset('null'));
});
test('orbit wraps yaw and clamps pitch/distance; uniform writes reject nonfinite input', () => {
  resetScene(false); orbit(100, 99, 0);
  const camera = sceneStore.getState().camera;
  assert.ok(camera.yaw >= -Math.PI && camera.yaw <= Math.PI); assert.equal(camera.pitch, 1.2); assert.equal(camera.distance, 2.4);
  assert.throws(() => setUniform('grain', NaN)); assert.throws(() => orbit(Infinity, 0));
  assert.throws(() => setLightHeading(Infinity));
});
test('evidence matrix contains nine deterministic, paused camera and light inputs', () => {
  const matrix = createEvidenceMatrix();
  assert.equal(matrix.length, 9);
  assert.equal(new Set(matrix.map(capture => capture.id)).size, 9);
  for (const capture of matrix) {
    assert.equal(capture.preset.playback, 'paused');
    assert.equal(capture.preset.time, 0);
    assert.doesNotThrow(() => parsePreset(JSON.stringify(capture.preset)));
  }
});
test('legacy version-1 presets migrate missing nacre controls without losing valid values', () => {
  resetScene(false); setUniform('spectral', 0.8);
  const legacy = JSON.parse(serializePreset()) as Record<string, any>;
  legacy.version = 1; delete legacy.lightHeading; delete legacy.uniforms.layerSpacing; delete legacy.uniforms.fireStrength;
  const migrated = parsePreset(JSON.stringify(legacy));
  assert.equal(migrated.version, 2); assert.equal(migrated.uniforms.spectral, 0.8);
  assert.equal(migrated.uniforms.layerSpacing, uniformContract.layerSpacing.default);
  assert.equal(migrated.uniforms.fireStrength, uniformContract.fireStrength.default);
});
test('pixel ratio respects both the device cap and the render-pixel budget', () => {
  assert.equal(pixelRatioForBudget(1000, 600, 1.25), 1.25);
  assert.equal(pixelRatioForBudget(1000, 600, 3), 1.5);
  const fourKRatio = pixelRatioForBudget(3840, 2160, 2);
  assert.ok(fourKRatio < 0.5);
  assert.ok(3840 * 2160 * fourKRatio * fourKRatio <= MAX_RENDER_PIXELS + 1);
  assert.equal(pixelRatioForBudget(0, 600, 2), 1);
});

for (const key of Object.keys(uniformContract) as (keyof typeof uniformContract)[]) {
  test(`${key} accepts both bounds and rejects invalid writes without notifying subscribers`, () => {
    resetScene(false);
    const { min, max } = uniformContract[key];
    const original = sceneStore.getState();
    for (const value of [min, max]) {
      setUniform(key, value);
      assert.deepEqual(sceneStore.getState(), { ...original, uniforms: { ...original.uniforms, [key]: value } });
    }
    const before = sceneStore.getState();
    let notifications = 0;
    const unsubscribe = sceneStore.subscribe(() => notifications++);
    try {
      for (const value of [min - 0.001, max + 0.001, NaN, Infinity, -Infinity]) {
        assert.throws(() => setUniform(key, value));
        assert.equal(sceneStore.getState(), before);
      }
      assert.equal(notifications, 0);
    } finally { unsubscribe(); }
  });
}

test('restore rejects malformed, incomplete and unsupported presets without changing state', () => {
  resetScene(false);
  const before = sceneStore.getState();
  const invalid = ['{', '[]', '42', '"preset"'];
  const mutations: ((p: any) => void)[] = [
    p => { p.version = 3; }, p => { p.version = '2'; }, p => { p.material = 'other'; },
    p => { p.uniforms = []; }, p => { p.camera = null; },
    p => { delete p.uniforms.fireStrength; }, p => { delete p.camera.distance; },
    p => { delete p.lightHeading; }, p => { delete p.time; },
    p => { p.inspectorVisible = 1; }, p => { delete p.reducedMotion; },
    p => { p.camera.yaw = Math.PI + 0.001; }, p => { p.camera.yaw = -Math.PI - 0.001; },
    p => { p.camera.pitch = -1.201; }, p => { p.camera.distance = 2.399; },
    p => { p.camera.distance = 5.001; }, p => { p.time = 86401; },
    p => { p.lightHeading = -3.141; }, p => { p.lightHeading = 3.141; },
    p => { p.uniforms.grain = '0.5'; },
    p => { p.version = 1; p.uniforms.layerSpacing = null; },
  ];
  for (const mutate of mutations) {
    const preset = JSON.parse(serializePreset()); mutate(preset);
    invalid.push(JSON.stringify(preset));
  }
  let notifications = 0;
  const unsubscribe = sceneStore.subscribe(() => notifications++);
  try {
    for (const text of invalid) {
      assert.throws(() => restorePreset(text), Error, text);
      assert.equal(sceneStore.getState(), before);
    }
    assert.equal(notifications, 0);
  } finally { unsubscribe(); }
});

test('preset parser accepts inclusive camera, time and lighting boundaries', () => {
  resetScene(false);
  for (const [yaw, pitch, distance, time, lightHeading] of [
    [-Math.PI, -1.2, 2.4, 0, -3.14], [Math.PI, 1.2, 5, 86400, 3.14],
  ]) {
    const preset = { ...JSON.parse(serializePreset()), camera: { yaw, pitch, distance }, time, lightHeading };
    assert.deepEqual(parsePreset(JSON.stringify(preset)), preset);
  }
});

test('export is canonical and does not publish the displayed time to the store', () => {
  resetScene(false);
  const before = sceneStore.getState();
  const exported = serializePreset(86400);
  assert.equal(JSON.parse(exported).time, 86400);
  assert.equal(sceneStore.getState(), before);
  const preset = JSON.parse(exported);
  const reordered = Object.fromEntries(Object.entries(preset).reverse());
  reordered.uniforms = Object.fromEntries(Object.entries(preset.uniforms).reverse());
  reordered.unrecognized = 'discard me';
  let notifications = 0;
  const unsubscribe = sceneStore.subscribe(() => notifications++);
  try { restorePreset(JSON.stringify(reordered)); } finally { unsubscribe(); }
  assert.equal(notifications, 1);
  assert.equal(serializePreset(), exported);
  for (const value of [-1, 86401, NaN, Infinity]) assert.throws(() => serializePreset(value));
});

test('legacy migration retains supplied new controls and defaults omitted controls and lighting', () => {
  resetScene(false);
  const legacy = JSON.parse(serializePreset());
  legacy.version = 1; legacy.uniforms.layerSpacing = 1.5; legacy.uniforms.fireStrength = 0;
  legacy.lightHeading = 2;
  const migrated = parsePreset(JSON.stringify(legacy));
  assert.equal(migrated.uniforms.layerSpacing, 1.5);
  assert.equal(migrated.uniforms.fireStrength, 0);
  assert.equal(migrated.lightHeading, -1.1);
  assert.equal(sceneStore.getState().uniforms.layerSpacing, uniformContract.layerSpacing.default);
});

test('orbit wraps negative turns, preserves omitted distance and clamps both extremes', () => {
  resetScene(false);
  orbit(-4 * Math.PI + 0.5, -99, 99);
  assert.ok(Math.abs(sceneStore.getState().camera.yaw - 0.5) < 1e-12);
  assert.equal(sceneStore.getState().camera.pitch, -1.2);
  assert.equal(sceneStore.getState().camera.distance, 5);
  orbit(Math.PI, 0);
  assert.deepEqual(sceneStore.getState().camera, { yaw: -Math.PI, pitch: 0, distance: 5 });
  const before = sceneStore.getState();
  for (const args of [[0, NaN, 3], [0, 0, Infinity], [-Infinity, 0, 3]]) {
    assert.throws(() => orbit(args[0], args[1], args[2]));
    assert.equal(sceneStore.getState(), before);
  }
});

test('light heading accepts bounds and preserves state on rejection', () => {
  resetScene(false);
  for (const heading of [-3.14, 3.14]) {
    const before = sceneStore.getState(); setLightHeading(heading);
    assert.deepEqual(sceneStore.getState(), { ...before, lightHeading: heading });
  }
  const before = sceneStore.getState();
  for (const value of [-3.141, 3.141, NaN, -Infinity]) {
    assert.throws(() => setLightHeading(value)); assert.equal(sceneStore.getState(), before);
  }
});

test('reset restores every default, preserves reduced motion by default and creates fresh nested state', () => {
  resetScene(false); const defaults = sceneStore.getState();
  setUniform('grain', 1); orbit(2, 1, 5); setLightHeading(3);
  sceneStore.setState({ playback: 'paused', time: 20, reducedMotion: true, inspectorVisible: false });
  resetScene();
  assert.deepEqual(sceneStore.getState(), { ...defaults, reducedMotion: true });
  assert.notEqual(sceneStore.getState().uniforms, defaults.uniforms);
  assert.notEqual(sceneStore.getState().camera, defaults.camera);
  resetScene(false); assert.deepEqual(sceneStore.getState(), defaults);
});

test('evidence matrix is a deterministic camera/light Cartesian product independent of current state', () => {
  resetScene(false);
  const expected = createEvidenceMatrix();
  setUniform('grain', 1); orbit(2, 1, 5); setLightHeading(3);
  const before = sceneStore.getState();
  const actual = createEvidenceMatrix();
  assert.deepEqual(actual, expected); assert.equal(sceneStore.getState(), before);
  const cameras = new Set(actual.map(c => JSON.stringify(c.preset.camera)));
  const lights = new Set(actual.map(c => c.preset.lightHeading));
  assert.equal(cameras.size, 3); assert.equal(lights.size, 3);
  for (const camera of cameras) for (const light of lights) {
    assert.equal(actual.filter(c => JSON.stringify(c.preset.camera) === camera && c.preset.lightHeading === light).length, 1);
  }
  actual[0].preset.camera.yaw = 0;
  assert.deepEqual(createEvidenceMatrix(), expected);
});

test('pixel budget handles invalid inputs, fractional DPR and custom budgets', () => {
  for (const invalid of [0, -1, NaN, Infinity, -Infinity]) {
    for (let index = 0; index < 4; index++) {
      const args = [1000, 600, 2, MAX_RENDER_PIXELS]; args[index] = invalid;
      assert.equal(pixelRatioForBudget(args[0], args[1], args[2], args[3]), 1);
    }
  }
  assert.equal(pixelRatioForBudget(100, 100, 0.75), 0.75);
  assert.equal(pixelRatioForBudget(1000, 1000, 2, 250000), 0.5);
  assert.equal(pixelRatioForBudget(1000, 1000, 2, 2250000), 1.5);
});
