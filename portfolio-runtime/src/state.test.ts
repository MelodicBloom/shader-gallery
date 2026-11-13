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

// Each case starts from a valid export so one invalid field is exercised at a time.
test('preset validation rejects malformed shapes and missing required fields atomically', () => {
  resetScene(false);
  const valid = serializePreset();
  const before = sceneStore.getState();
  let notifications = 0;
  const unsubscribe = sceneStore.subscribe(() => notifications++);
  try {
    for (const text of ['', '{', 'null', '[]', 'true', '42', '"preset"']) {
      assert.throws(() => restorePreset(text), text);
    }
    for (const key of Object.keys(JSON.parse(valid))) {
      const candidate = JSON.parse(valid);
      delete candidate[key];
      assert.throws(() => restorePreset(JSON.stringify(candidate)), `missing ${key}`);
    }
    for (const key of ['uniforms', 'camera']) {
      for (const value of [null, [], 3, 'invalid']) {
        const candidate = { ...JSON.parse(valid), [key]: value };
        assert.throws(() => restorePreset(JSON.stringify(candidate)), `${key}: ${value}`);
      }
    }
    for (const patch of [{ version: 3 }, { version: '2' }, { material: 'other' }, { inspectorVisible: 1 }]) {
      assert.throws(() => restorePreset(JSON.stringify({ ...JSON.parse(valid), ...patch })));
    }
    assert.equal(sceneStore.getState(), before);
    assert.equal(notifications, 0);
  } finally { unsubscribe(); }
});

for (const [key, contract] of Object.entries(uniformContract)) {
  test(`${key} accepts endpoints and rejects invalid writes without publishing state`, () => {
    resetScene(false);
    const name = key as keyof typeof uniformContract;
    const original = sceneStore.getState();
    for (const value of [contract.min, contract.max]) {
      setUniform(name, value);
      assert.deepEqual(sceneStore.getState(), {
        ...original, uniforms: { ...original.uniforms, [key]: value },
      });
      assert.equal(parsePreset(serializePreset()).uniforms[name], value);
    }
    const before = sceneStore.getState();
    for (const value of [contract.min - 0.001, contract.max + 0.001, NaN, Infinity, -Infinity]) {
      assert.throws(() => setUniform(name, value));
      assert.equal(sceneStore.getState(), before);
    }
    for (const value of [undefined, null, '0.5', contract.min - 0.001, contract.max + 0.001]) {
      const candidate = JSON.parse(serializePreset());
      candidate.uniforms[key] = value;
      assert.throws(() => restorePreset(JSON.stringify(candidate)));
      assert.equal(sceneStore.getState(), before);
    }
  });
}

test('camera, phase and light preset limits are inclusive and strictly validated', () => {
  resetScene(false);
  for (const [group, key, min, max] of [
    ['camera', 'yaw', -Math.PI, Math.PI], ['camera', 'pitch', -1.2, 1.2],
    ['camera', 'distance', 2.4, 5], ['', 'time', 0, 86400], ['', 'lightHeading', -3.14, 3.14],
  ] as const) {
    for (const value of [min, max, min - 0.001, max + 0.001, null, '0', undefined]) {
      const candidate = JSON.parse(serializePreset());
      (group ? candidate[group] : candidate)[key] = value;
      if (value === min || value === max) assert.doesNotThrow(() => parsePreset(JSON.stringify(candidate)));
      else assert.throws(() => parsePreset(JSON.stringify(candidate)), `${key}: ${value}`);
    }
  }
});

test('light heading writes preserve other state and reject nonfinite and out-of-range values', () => {
  resetScene(false);
  const original = sceneStore.getState();
  for (const value of [-3.14, 0, 3.14]) {
    setLightHeading(value);
    assert.deepEqual(sceneStore.getState(), { ...original, lightHeading: value });
  }
  const before = sceneStore.getState();
  for (const value of [-3.141, 3.141, NaN, Infinity, -Infinity]) {
    assert.throws(() => setLightHeading(value));
    assert.equal(sceneStore.getState(), before);
  }
});

test('orbit handles negative turns, both clamps, default zoom and invalid coordinates atomically', () => {
  resetScene(false);
  orbit(-4 * Math.PI + 0.4, -99, 99);
  assert.ok(Math.abs(sceneStore.getState().camera.yaw - 0.4) < 1e-12);
  assert.equal(sceneStore.getState().camera.pitch, -1.2);
  assert.equal(sceneStore.getState().camera.distance, 5);
  orbit(Math.PI, 0);
  assert.deepEqual(sceneStore.getState().camera, { yaw: -Math.PI, pitch: 0, distance: 5 });
  const before = sceneStore.getState();
  for (const invalid of [NaN, Infinity, -Infinity]) {
    for (const coordinates of [[invalid, 0, 3], [0, invalid, 3], [0, 0, invalid]]) {
      assert.throws(() => orbit(coordinates[0], coordinates[1], coordinates[2]));
      assert.equal(sceneStore.getState(), before);
    }
  }
});

test('reset restores defaults with fresh nested objects and preserves the motion preference', () => {
  resetScene(true);
  const initial = sceneStore.getState();
  setUniform('grain', 1); orbit(2, 1, 5);
  sceneStore.setState({ playback: 'paused', time: 25, inspectorVisible: false, lightHeading: 2 });
  resetScene();
  assert.deepEqual(sceneStore.getState(), initial);
  assert.notEqual(sceneStore.getState().uniforms, initial.uniforms);
  assert.notEqual(sceneStore.getState().camera, initial.camera);
  resetScene(false);
  assert.equal(sceneStore.getState().reducedMotion, false);
});

test('serialization projects a canonical preset without changing the displayed state', () => {
  resetScene(false);
  const canonical = serializePreset(9);
  const candidate = JSON.parse(canonical);
  candidate.extra = 'ignored'; candidate.camera.extra = 1; candidate.uniforms.extra = 1;
  const reversed = Object.fromEntries(Object.entries(candidate).reverse());
  let notifications = 0;
  const unsubscribe = sceneStore.subscribe(() => notifications++);
  try {
    restorePreset(JSON.stringify(reversed));
    assert.equal(notifications, 1);
    assert.equal(serializePreset(), canonical);
    const before = sceneStore.getState();
    assert.equal(JSON.parse(serializePreset(12)).time, 12);
    for (const time of [-1, 86401, NaN, Infinity]) assert.throws(() => serializePreset(time));
    assert.equal(sceneStore.getState(), before);
    assert.equal(notifications, 1);
  } finally { unsubscribe(); }
});

test('legacy migration keeps supplied controls and rejects invalid supplied values', () => {
  resetScene(false);
  const legacy = JSON.parse(serializePreset());
  legacy.version = 1;
  legacy.uniforms.layerSpacing = 1.5; legacy.uniforms.fireStrength = 0;
  assert.equal(parsePreset(JSON.stringify(legacy)).uniforms.layerSpacing, 1.5);
  assert.equal(parsePreset(JSON.stringify(legacy)).uniforms.fireStrength, 0);
  for (const value of [null, '0', -1]) {
    legacy.uniforms.fireStrength = value;
    assert.throws(() => parsePreset(JSON.stringify(legacy)));
  }
});

test('evidence matrix is a deterministic camera/light product independent of edited scene state', () => {
  const expected = createEvidenceMatrix();
  resetScene(true); orbit(-2, -1, 5); setUniform('grain', 0);
  assert.deepEqual(createEvidenceMatrix(), expected);
  const cameras = new Set(expected.map(c => JSON.stringify(c.preset.camera)));
  const lights = new Set(expected.map(c => c.preset.lightHeading));
  assert.equal(cameras.size, 3); assert.equal(lights.size, 3);
  assert.equal(new Set(expected.map(c => JSON.stringify([c.preset.camera, c.preset.lightHeading]))).size, 9);
  const next = createEvidenceMatrix();
  next[0].preset.camera.yaw = 0; next[0].preset.uniforms.grain = 1;
  assert.deepEqual(createEvidenceMatrix(), expected);
});

test('pixel budget handles custom caps, low DPR, exact limits and invalid inputs', () => {
  assert.equal(pixelRatioForBudget(100, 100, 0.75), 0.75);
  assert.equal(pixelRatioForBudget(100, 100, 2, 10000), 1);
  assert.equal(pixelRatioForBudget(100, 100, 2, 2500), 0.5);
  for (let index = 0; index < 4; index++) {
    for (const value of [0, -1, NaN, Infinity, -Infinity]) {
      const args: [number, number, number, number] = [100, 100, 2, 10000];
      args[index] = value;
      assert.equal(pixelRatioForBudget(...args), 1, `argument ${index}: ${value}`);
    }
  }
});

test('every material control accepts its endpoints and rejects invalid writes atomically', () => {
  for (const key of Object.keys(uniformContract) as (keyof typeof uniformContract)[]) {
    resetScene(false);
    const contract = uniformContract[key];
    for (const value of [contract.min, contract.max]) {
      const before = sceneStore.getState();
      setUniform(key, value);
      assert.deepEqual(sceneStore.getState(), {
        ...before, uniforms: { ...before.uniforms, [key]: value },
      });
      assert.equal(before.uniforms[key], value === contract.min ? contract.default : contract.min);
    }
    for (const value of [contract.min - 0.001, contract.max + 0.001, NaN, Infinity, -Infinity]) {
      const before = sceneStore.getState();
      assert.throws(() => setUniform(key, value), key);
      assert.equal(sceneStore.getState(), before);
    }
  }
});

test('version-2 presets require every uniform and reject invalid numeric and structural fields', () => {
  resetScene(false);
  const valid = serializePreset();
  const rejects = (mutate: (preset: Record<string, any>) => void) => {
    const candidate = JSON.parse(valid);
    mutate(candidate);
    const before = sceneStore.getState();
    assert.throws(() => restorePreset(JSON.stringify(candidate)));
    assert.equal(sceneStore.getState(), before);
  };
  for (const [key, contract] of Object.entries(uniformContract)) {
    rejects(p => { delete p.uniforms[key]; });
    for (const value of [null, '0.5', false, contract.min - 0.001, contract.max + 0.001]) {
      rejects(p => { p.uniforms[key] = value; });
    }
  }
  for (const [key, min, max] of [['yaw', -Math.PI, Math.PI], ['pitch', -1.2, 1.2], ['distance', 2.4, 5]] as const) {
    for (const value of [undefined, null, '1', min - 0.001, max + 0.001]) rejects(p => { p.camera[key] = value; });
  }
  for (const [key, values] of Object.entries({
    version: [undefined, 0, 3, '2'], material: [undefined, 'aurora'],
    uniforms: [null, [], 1], camera: [null, [], 1],
    playback: [undefined, null, 'PLAYING'], reducedMotion: [undefined, 0, 'true'],
    inspectorVisible: [undefined, null, 'false'], time: [undefined, null, '0', -0.001, 86400.001],
    lightHeading: [undefined, null, '0', -3.141, 3.141],
  })) for (const value of values) rejects(p => { p[key] = value; });
  for (const text of ['', '{', 'null', '[]', 'true', '42']) {
    const before = sceneStore.getState();
    assert.throws(() => restorePreset(text));
    assert.equal(sceneStore.getState(), before);
  }
});

test('preset numeric bounds are inclusive and unknown fields are excluded from exports', () => {
  resetScene(false);
  for (const upper of [false, true]) {
    const preset = JSON.parse(serializePreset());
    for (const [key, contract] of Object.entries(uniformContract)) preset.uniforms[key] = upper ? contract.max : contract.min;
    preset.camera = upper ? { yaw: Math.PI, pitch: 1.2, distance: 5 } : { yaw: -Math.PI, pitch: -1.2, distance: 2.4 };
    preset.time = upper ? 86400 : 0;
    preset.lightHeading = upper ? 3.14 : -3.14;
    const expected = structuredClone(preset);
    preset.extra = 'ignored'; preset.camera.extra = 'ignored'; preset.uniforms.extra = 1;
    restorePreset(JSON.stringify(preset));
    assert.deepEqual(sceneStore.getState(), expected);
    assert.deepEqual(JSON.parse(serializePreset()), expected);
  }
});

test('legacy defaults apply only to omitted uniforms; malformed supplied values remain invalid', () => {
  resetScene(false);
  const legacy = JSON.parse(serializePreset());
  legacy.version = 1; legacy.uniforms = {}; delete legacy.lightHeading;
  const migrated = parsePreset(JSON.stringify(legacy));
  for (const [key, contract] of Object.entries(uniformContract)) {
    assert.equal(migrated.uniforms[key as keyof typeof uniformContract], contract.default);
    assert.throws(() => parsePreset(JSON.stringify({ ...legacy, uniforms: { [key]: null } })));
  }
  assert.equal(migrated.lightHeading, -1.1);
  assert.equal(sceneStore.getState().version, 2);
});

test('orbit wraps full turns, preserves omitted distance, and rejects each nonfinite coordinate atomically', () => {
  resetScene(false); orbit(0, 0, 4.2);
  for (const turns of [-3, -1, 0, 1, 3]) {
    orbit(0.5 + turns * 2 * Math.PI, -9);
    assert.ok(Math.abs(sceneStore.getState().camera.yaw - 0.5) < 1e-12);
    assert.equal(sceneStore.getState().camera.pitch, -1.2);
    assert.equal(sceneStore.getState().camera.distance, 4.2);
  }
  orbit(Math.PI, 0, 99);
  assert.deepEqual(sceneStore.getState().camera, { yaw: -Math.PI, pitch: 0, distance: 5 });
  for (const value of [NaN, Infinity, -Infinity]) {
    for (const args of [[value, 0, 3], [0, value, 3], [0, 0, value]] as const) {
      const before = sceneStore.getState();
      assert.throws(() => orbit(args[0], args[1], args[2]));
      assert.equal(sceneStore.getState(), before);
    }
  }
});

test('light heading endpoints update only the light and invalid input does not notify subscribers', () => {
  resetScene(false);
  for (const value of [-3.14, 3.14]) {
    const before = sceneStore.getState(); setLightHeading(value);
    assert.deepEqual(sceneStore.getState(), { ...before, lightHeading: value });
  }
  let notifications = 0;
  const unsubscribe = sceneStore.subscribe(() => { notifications++; });
  try {
    for (const value of [-3.141, 3.141, NaN, Infinity, -Infinity]) assert.throws(() => setLightHeading(value));
    assert.equal(notifications, 0);
  } finally { unsubscribe(); }
});

test('reset restores fresh defaults while preserving or explicitly overriding reduced motion', () => {
  resetScene(true); const defaults = structuredClone(sceneStore.getState());
  setUniform('grain', 1); orbit(2, 1, 5);
  sceneStore.setState({ playback: 'paused', time: 80, inspectorVisible: false });
  resetScene(); assert.deepEqual(sceneStore.getState(), defaults);
  resetScene(false); assert.deepEqual(sceneStore.getState(), { ...defaults, reducedMotion: false });
});

test('exporting displayed time does not mutate stored time and rejects invalid phases', () => {
  resetScene(false); sceneStore.setState({ time: 7 });
  const before = sceneStore.getState();
  assert.equal(JSON.parse(serializePreset(123.5)).time, 123.5);
  assert.equal(sceneStore.getState(), before);
  for (const time of [-1, 86401, NaN, Infinity, -Infinity]) assert.throws(() => serializePreset(time));
  assert.equal(sceneStore.getState(), before);
});

test('evidence captures span all nine camera/light combinations independently of live scene edits', () => {
  resetScene(false); const expected = createEvidenceMatrix();
  setUniform('grain', 1); orbit(2, 1, 5); setLightHeading(3);
  const before = sceneStore.getState();
  const matrix = createEvidenceMatrix();
  assert.deepEqual(matrix, expected);
  assert.equal(sceneStore.getState(), before);
  const cameras = new Set(matrix.map(c => JSON.stringify(c.preset.camera)));
  const lights = new Set(matrix.map(c => c.preset.lightHeading));
  assert.equal(cameras.size, 3); assert.equal(lights.size, 3);
  assert.equal(new Set(matrix.map(c => `${JSON.stringify(c.preset.camera)}:${c.preset.lightHeading}`)).size, 9);
  matrix[0].preset.camera.yaw = 0;
  assert.deepEqual(matrix.slice(1), expected.slice(1));
  assert.deepEqual(createEvidenceMatrix(), expected);
});

test('pixel budget handles invalid arguments, custom budgets, and devices below one DPR', () => {
  for (const invalid of [0, -1, NaN, Infinity, -Infinity]) {
    for (let index = 0; index < 4; index++) {
      const args: [number, number, number, number] = [1000, 500, 2, 1_000_000];
      args[index] = invalid;
      assert.equal(pixelRatioForBudget(...args), 1);
    }
  }
  assert.equal(pixelRatioForBudget(1000, 1000, 2, 250_000), 0.5);
  assert.equal(pixelRatioForBudget(1000, 1000, 2, 2_250_000), 1.5);
  assert.equal(pixelRatioForBudget(100, 100, 0.75), 0.75);
  assert.equal(pixelRatioForBudget(500, 1000, 2), pixelRatioForBudget(1000, 500, 2));
});
