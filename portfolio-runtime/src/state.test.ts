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


// Each case starts from a valid export so rejection exercises one field at a time.
test('version-2 presets reject missing, mistyped and out-of-range required fields atomically', () => {
  resetScene(false);
  const valid = serializePreset();
  const cases: Array<[string, (p: any) => void]> = [
    ['unsupported version', p => { p.version = 3; }],
    ['string version', p => { p.version = '2'; }],
    ['wrong material', p => { p.material = 'aurora'; }],
    ['missing uniforms', p => { delete p.uniforms; }],
    ['array uniforms', p => { p.uniforms = []; }],
    ['null camera', p => { p.camera = null; }],
    ['array camera', p => { p.camera = []; }],
    ['missing playback', p => { delete p.playback; }],
    ['missing reduced motion', p => { delete p.reducedMotion; }],
    ['numeric inspector flag', p => { p.inspectorVisible = 1; }],
  ];
  for (const [key, values] of Object.entries({
    version: [undefined, 0], material: [undefined], uniforms: [null, 1], camera: [1],
    playback: [null, 'PLAYING'], reducedMotion: [0, 'true'], inspectorVisible: [undefined, null, 'false'],
  })) for (const value of values) cases.push([`${key}=${value}`, p => { p[key] = value; }]);
  for (const [key, contract] of Object.entries(uniformContract)) {
    for (const value of [null, '0.5', false, contract.min - 0.001, contract.max + 0.001]) {
      cases.push([`${key}=${value}`, p => { p.uniforms[key] = value; }]);
    }
    cases.push([`missing ${key}`, p => { delete p.uniforms[key]; }]);
  }
  for (const [key, min, max] of [['yaw', -Math.PI, Math.PI], ['pitch', -1.2, 1.2], ['distance', 2.4, 5]] as const) {
    for (const value of [null, '1', min - 0.001, max + 0.001]) {
      cases.push([`camera.${key}=${value}`, p => { p.camera[key] = value; }]);
    }
    cases.push([`missing camera.${key}`, p => { delete p.camera[key]; }]);
  }
  for (const [key, min, max] of [['time', 0, 86400], ['lightHeading', -3.14, 3.14]] as const) {
    for (const value of [null, '0', min - 0.001, max + 0.001]) {
      cases.push([`${key}=${value}`, p => { p[key] = value; }]);
    }
    cases.push([`missing ${key}`, p => { delete p[key]; }]);
  }
  const before = sceneStore.getState();
  let notifications = 0;
  const unsubscribe = sceneStore.subscribe(() => { notifications++; });
  try {
    for (const [label, mutate] of cases) {
      const candidate = JSON.parse(valid); mutate(candidate);
      assert.throws(() => restorePreset(JSON.stringify(candidate)), label);
      assert.equal(sceneStore.getState(), before, label);
    }
    for (const text of ['', '{', 'null', '[]', '42', '"preset"', 'true']) {
      assert.throws(() => restorePreset(text), text);
      assert.equal(sceneStore.getState(), before);
    }
    assert.equal(notifications, 0);
  } finally { unsubscribe(); }
});

test('preset ranges include both endpoints and export uses a stable schema', () => {
  resetScene(false);
  for (const endpoint of ['min', 'max'] as const) {
    const p = JSON.parse(serializePreset());
    for (const [key, contract] of Object.entries(uniformContract)) p.uniforms[key] = contract[endpoint];
    p.camera = endpoint === 'min'
      ? { yaw: -Math.PI, pitch: -1.2, distance: 2.4 }
      : { yaw: Math.PI, pitch: 1.2, distance: 5 };
    p.time = endpoint === 'min' ? 0 : 86400;
    p.lightHeading = endpoint === 'min' ? -3.14 : 3.14;
    p.playback = 'paused';
    assert.deepEqual(parsePreset(JSON.stringify(p)), p);
    restorePreset(JSON.stringify({ ...p, extra: 'discard', camera: { ...p.camera, extra: 1 }, uniforms: { ...p.uniforms, extra: 1 } }));
    const exported = JSON.parse(serializePreset());
    assert.deepEqual(exported, p);
    assert.deepEqual(Object.keys(exported), ['version', 'material', 'uniforms', 'camera', 'time', 'lightHeading', 'playback', 'reducedMotion', 'inspectorVisible']);
    assert.deepEqual(Object.keys(exported.uniforms), Object.keys(uniformContract));
  }
});

test('legacy migration fills absent uniforms but rejects invalid supplied controls', () => {
  resetScene(false);
  const legacy = { ...JSON.parse(serializePreset()), version: 1, uniforms: {}, lightHeading: 99 };
  const migrated = parsePreset(JSON.stringify(legacy));
  for (const [key, contract] of Object.entries(uniformContract)) {
    assert.equal(migrated.uniforms[key as keyof typeof uniformContract], contract.default);
    assert.throws(() => parsePreset(JSON.stringify({ ...legacy, uniforms: { [key]: null } })));
    assert.throws(() => parsePreset(JSON.stringify({ ...legacy, uniforms: { [key]: contract.max + 1 } })));
  }
  assert.equal(migrated.lightHeading, -1.1);
  assert.equal(migrated.version, 2);
});

test('uniform and light setters accept endpoints and reject invalid writes without publishing', () => {
  resetScene(false);
  for (const key of Object.keys(uniformContract) as Array<keyof typeof uniformContract>) {
    resetScene(false);
    const contract = uniformContract[key];
    for (const value of [contract.min, contract.max]) {
      const before = sceneStore.getState();
      setUniform(key, value);
      assert.deepEqual(sceneStore.getState(), { ...before, uniforms: { ...before.uniforms, [key]: value } });
      assert.notEqual(sceneStore.getState().uniforms, before.uniforms);
      assert.equal(before.uniforms[key], value === contract.min ? contract.default : contract.min);
    }
    for (const value of [NaN, Infinity, -Infinity, contract.min - 0.001, contract.max + 0.001]) {
      const before = sceneStore.getState();
      assert.throws(() => setUniform(key, value)); assert.equal(sceneStore.getState(), before);
    }
  }
  for (const value of [-3.14, 3.14]) { setLightHeading(value); assert.equal(sceneStore.getState().lightHeading, value); }
  for (const value of [NaN, Infinity, -Infinity, -3.141, 3.141]) {
    const before = sceneStore.getState();
    assert.throws(() => setLightHeading(value)); assert.equal(sceneStore.getState(), before);
  }
});

test('orbit wraps complete turns, preserves omitted distance and rejects each nonfinite component', () => {
  resetScene(false); orbit(0, 0, 4.2);
  for (const turns of [-3, -1, 0, 1, 3]) {
    orbit(0.4 + turns * 2 * Math.PI, -99);
    const camera = sceneStore.getState().camera;
    assert.ok(Math.abs(camera.yaw - 0.4) < 1e-12);
    assert.equal(camera.pitch, -1.2); assert.equal(camera.distance, 4.2);
  }
  orbit(Math.PI, 0, 99);
  assert.equal(sceneStore.getState().camera.yaw, -Math.PI);
  assert.equal(sceneStore.getState().camera.distance, 5);
  for (const value of [NaN, Infinity, -Infinity]) {
    for (const args of [[value, 0, 3], [0, value, 3], [0, 0, value]] as const) {
      const before = sceneStore.getState();
      assert.throws(() => orbit(args[0], args[1], args[2])); assert.equal(sceneStore.getState(), before);
    }
  }
});

test('reset restores fresh defaults while preserving or explicitly overriding reduced motion', () => {
  resetScene(true);
  const defaults = JSON.parse(serializePreset());
  setUniform('grain', 1); orbit(1, 1, 5);
  sceneStore.setState({ playback: 'paused', time: 123, inspectorVisible: false });
  resetScene(); assert.deepEqual(sceneStore.getState(), defaults);
  const previous = sceneStore.getState();
  resetScene(false);
  assert.deepEqual(sceneStore.getState(), { ...defaults, reducedMotion: false });
  assert.notEqual(sceneStore.getState().uniforms, previous.uniforms);
  assert.notEqual(sceneStore.getState().camera, previous.camera);
});

test('export records displayed time without modifying state and rejects invalid time', () => {
  resetScene(false); sceneStore.setState({ time: 7 });
  const before = sceneStore.getState();
  assert.equal(JSON.parse(serializePreset(23.5)).time, 23.5);
  assert.equal(JSON.parse(serializePreset()).time, 7);
  for (const value of [NaN, Infinity, -Infinity, -0.001, 86400.001]) assert.throws(() => serializePreset(value));
  assert.equal(sceneStore.getState(), before);
});

test('valid restore publishes a complete replacement exactly once', () => {
  resetScene(false);
  const target = JSON.parse(serializePreset(123));
  target.uniforms.grain = 0.9; target.camera.yaw = -1; target.playback = 'paused';
  const received: unknown[] = [];
  const unsubscribe = sceneStore.subscribe(state => received.push(state));
  try { restorePreset(JSON.stringify(target)); } finally { unsubscribe(); }
  assert.deepEqual(received, [target]);
});

test('evidence inputs span every camera/light pair and are independent of live state', () => {
  resetScene(false);
  const expected = createEvidenceMatrix();
  setUniform('grain', 1); orbit(-2, -1, 5); setLightHeading(3);
  const before = sceneStore.getState();
  const matrix = createEvidenceMatrix();
  assert.deepEqual(matrix, expected); assert.equal(sceneStore.getState(), before);
  assert.equal(new Set(matrix.map(c => JSON.stringify(c.preset.camera))).size, 3);
  assert.equal(new Set(matrix.map(c => c.preset.lightHeading)).size, 3);
  assert.equal(new Set(matrix.map(c => JSON.stringify([c.preset.camera, c.preset.lightHeading]))).size, 9);
  const next = createEvidenceMatrix();
  matrix[0].preset.camera.yaw = 0;
  assert.deepEqual(matrix.slice(1), expected.slice(1));
  assert.deepEqual(createEvidenceMatrix(), expected);
  assert.deepEqual(next, expected);
});

test('pixel budget handles custom limits, fractional DPR and every invalid input position', () => {
  assert.equal(pixelRatioForBudget(500, 1000, 2), pixelRatioForBudget(1000, 500, 2));
  assert.equal(pixelRatioForBudget(100, 100, 0.75), 0.75);
  assert.equal(pixelRatioForBudget(100, 100, 2, 2500), 0.5);
  assert.equal(pixelRatioForBudget(100, 100, 2, 22500), 1.5);
  for (const invalid of [0, -1, NaN, Infinity, -Infinity]) {
    for (let index = 0; index < 4; index++) {
      const args: [number, number, number, number] = [100, 100, 2, 10000];
      args[index] = invalid;
      assert.equal(pixelRatioForBudget(...args), 1, `argument ${index}: ${invalid}`);
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
