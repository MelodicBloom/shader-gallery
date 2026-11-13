import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPageLifecycle, type LifecycleHooks } from './lifecycle';

function harness(unusable = false) {
  const calls: string[] = []; let bad = unusable;
  const hooks: LifecycleHooks = {
    stopLoop: () => calls.push('stop'), startLoop: () => calls.push('start'),
    release: () => calls.push('release'), reinitialize: () => { calls.push('reinit'); bad = false; },
    contextUnusable: () => bad,
  };
  return { calls, lc: createPageLifecycle(hooks), setUnusable: (v: boolean) => { bad = v; } };
}

test('pagehide(persisted) stops rAF and flags; pageshow(persisted) restarts the loop', () => {
  const { calls, lc } = harness();
  lc.pagehide(true); assert.deepEqual(calls, ['stop']); assert.equal(lc.state, 'suspended');
  lc.pageshow(true); assert.deepEqual(calls, ['stop', 'start']); assert.equal(lc.state, 'running');
});

test('pagehide(not persisted) releases the player; a later pageshow re-initializes', () => {
  const { calls, lc } = harness();
  lc.pagehide(false); assert.deepEqual(calls, ['stop', 'release']); assert.equal(lc.state, 'released');
  lc.pageshow(true); assert.deepEqual(calls, ['stop', 'release', 'reinit']); assert.equal(lc.state, 'running');
});

test('bfcache restore with a lost context re-initializes instead of resuming', () => {
  const { calls, lc, setUnusable } = harness();
  lc.pagehide(true); setUnusable(true); // browser dropped the context while cached, no events delivered
  lc.pageshow(true); assert.deepEqual(calls, ['stop', 'reinit']);
});

test('first-load pageshow does nothing (initialize already runs)', () => {
  const { calls, lc } = harness();
  lc.pageshow(false); assert.deepEqual(calls, []);
});

test('webglcontextlost stops the loop; restored re-initializes', () => {
  const { calls, lc } = harness();
  lc.contextlost(); assert.deepEqual(calls, ['stop']); assert.equal(lc.state, 'context-lost');
  lc.contextrestored(); assert.deepEqual(calls, ['stop', 'reinit']); assert.equal(lc.state, 'running');
});

test('context restored while suspended defers rebuild to pageshow', () => {
  const { calls, lc } = harness();
  lc.pagehide(true); lc.contextlost(); lc.contextrestored();
  assert.deepEqual(calls, ['stop', 'stop']);
  lc.pageshow(true); assert.deepEqual(calls, ['stop', 'stop', 'reinit']); assert.equal(lc.state, 'running');
});

test('pageshow while context still lost waits for webglcontextrestored', () => {
  const { calls, lc, setUnusable } = harness();
  lc.pagehide(true); lc.contextlost(); setUnusable(true);
  lc.pageshow(true); assert.deepEqual(calls, ['stop', 'stop']); assert.equal(lc.state, 'context-lost');
  lc.contextrestored(); assert.deepEqual(calls, ['stop', 'stop', 'reinit']); assert.equal(lc.state, 'running');
});

test('a suspended page resumes even when pageshow is not marked persisted', () => {
  const { calls, lc } = harness();
  assert.equal(lc.state, 'running');
  lc.pagehide(true); lc.pageshow(false);
  assert.deepEqual(calls, ['stop', 'start']);
  assert.equal(lc.state, 'running');
});

test('deferred context rebuild is consumed once and subsequent cache cycles resume normally', () => {
  const { calls, lc } = harness();
  for (let cycle = 0; cycle < 2; cycle++) {
    lc.pagehide(true); lc.contextlost(); lc.contextrestored();
    assert.equal(lc.state, 'suspended');
    lc.pageshow(true);
    assert.equal(lc.state, 'running');
  }
  lc.pagehide(true); lc.pageshow(true);
  assert.deepEqual(calls, ['stop', 'stop', 'reinit', 'stop', 'stop', 'reinit', 'stop', 'start']);
});

test('restoration before pagehide allows a healthy cached page to resume', () => {
  const { calls, lc } = harness();
  lc.contextlost(); lc.contextrestored();
  lc.pagehide(true); lc.pageshow(true);
  assert.deepEqual(calls, ['stop', 'reinit', 'stop', 'start']);
  assert.equal(lc.state, 'running');
});

test('release followed by context events rebuilds on pageshow and clears release state', () => {
  const { calls, lc } = harness();
  lc.pagehide(false); lc.contextlost();
  assert.equal(lc.state, 'released');
  lc.contextrestored();
  assert.deepEqual(calls, ['stop', 'release', 'stop']);
  lc.pageshow(true);
  assert.equal(lc.state, 'running');
  lc.pagehide(true); lc.pageshow(true);
  assert.deepEqual(calls, ['stop', 'release', 'stop', 'reinit', 'stop', 'start']);
});

test('state notifications follow hook actions through loss, release and recovery', () => {
  const calls: string[] = [];
  const lc = createPageLifecycle({
    stopLoop: () => calls.push('stop'), startLoop: () => calls.push('start'),
    release: () => calls.push('release'), reinitialize: () => calls.push('reinit'),
    contextUnusable: () => true, onState: state => calls.push(state),
  });
  assert.deepEqual(calls, []);
  lc.pagehide(true); lc.contextlost(); lc.pageshow(true); lc.contextrestored();
  lc.pagehide(false); lc.pageshow(true);
  assert.deepEqual(calls, [
    'stop', 'suspended', 'stop', 'context-lost', 'context-lost', 'reinit', 'running',
    'stop', 'release', 'released', 'reinit', 'running',
  ]);
  assert.equal(lc.state, 'running');
});

test('ordinary pageshow resumes a suspended page and later first-load events stay inert', () => {
  const { calls, lc } = harness();
  assert.equal(lc.state, 'running');
  lc.pagehide(true); lc.pageshow(false); lc.pageshow(false);
  assert.deepEqual(calls, ['stop', 'start']);
  assert.equal(lc.state, 'running');
});

test('released resources are rebuilt even when the context reports healthy', () => {
  const { calls, lc } = harness();
  lc.pagehide(false); lc.pageshow(false);
  assert.deepEqual(calls, ['stop', 'release', 'reinit']);
  assert.equal(lc.state, 'running');
  lc.pagehide(true); lc.pageshow(true);
  assert.equal(lc.state, 'running');
  assert.deepEqual(calls, ['stop', 'release', 'reinit', 'stop', 'start']);
});

test('deferred restoration is consumed once even if the context already reports healthy', () => {
  const { calls, lc } = harness();
  lc.pagehide(true); lc.contextlost(); lc.contextrestored();
  assert.equal(lc.state, 'suspended');
  lc.pageshow(true);
  assert.equal(lc.state, 'running');
  lc.pagehide(true); lc.pageshow(true);
  assert.equal(lc.state, 'running');
  assert.deepEqual(calls, ['stop', 'stop', 'reinit', 'stop', 'start']);
});

test('multiple independent context losses can each recover', () => {
  const { calls, lc } = harness();
  for (let cycle = 0; cycle < 2; cycle++) {
    lc.contextlost(); assert.equal(lc.state, 'context-lost');
    lc.contextrestored(); assert.equal(lc.state, 'running');
  }
  assert.deepEqual(calls, ['stop', 'reinit', 'stop', 'reinit']);
});

test('state notifications follow loop cancellation, release, and recovery', () => {
  const calls: string[] = [];
  const lc = createPageLifecycle({
    stopLoop: () => calls.push('stop'), startLoop: () => calls.push('start'),
    release: () => calls.push('release'), reinitialize: () => calls.push('reinit'),
    contextUnusable: () => false, onState: state => calls.push(state),
  });
  lc.pageshow(false);
  assert.deepEqual(calls, []);
  lc.pagehide(true); lc.pageshow(true); lc.contextlost(); lc.contextrestored();
  lc.pagehide(false); lc.pageshow(true);
  assert.deepEqual(calls, [
    'stop', 'suspended', 'start', 'running', 'stop', 'context-lost', 'reinit', 'running',
    'stop', 'release', 'released', 'reinit', 'running',
  ]);
});

test('a released page with context loss and deferred restoration rebuilds on return', () => {
  const { calls, lc, setUnusable } = harness();
  lc.pagehide(false); lc.contextlost(); setUnusable(true);
  assert.equal(lc.state, 'released');
  lc.contextrestored();
  assert.equal(lc.state, 'released');
  assert.deepEqual(calls, ['stop', 'release', 'stop']);
  lc.pageshow(true);
  assert.deepEqual(calls, ['stop', 'release', 'stop', 'reinit']);
  assert.equal(lc.state, 'running');
});

test('restoration after pageshow waits for the lost context, then subsequent caching resumes normally', () => {
  const { calls, lc, setUnusable } = harness();
  lc.contextlost(); setUnusable(true); lc.pagehide(true); lc.pageshow(true);
  assert.equal(lc.state, 'context-lost');
  assert.deepEqual(calls, ['stop', 'stop']);
  lc.contextrestored();
  lc.pagehide(true); lc.pageshow(true);
  assert.equal(lc.state, 'running');
  assert.deepEqual(calls, ['stop', 'stop', 'reinit', 'stop', 'start']);
});
