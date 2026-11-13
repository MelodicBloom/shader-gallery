import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ShaderPlayer } from '../../library-v1/runtime/ShaderPlayer.js';
import { synchronizeClock, resizeWithinBudget } from './runtime-regressions.js';

test('continuous control updates do not discard animation frame time', () => {
  const mode = { time: 0, playback: 'playing', reducedMotion: false };
  let elapsed = 0, previous = 0;
  for (let i = 1; i <= 60; i++) {
    const now = i * 1000 / 60;
    ({ elapsed, previous } = synchronizeClock(elapsed, previous, mode, mode, now - 1));
    elapsed += Math.min(now - previous, 100) / 1000;
    previous = now;
  }
  assert.ok(Math.abs(elapsed - 1) < 1e-9, `elapsed ${elapsed}`);
  const paused = { ...mode, playback: 'paused' };
  assert.deepEqual(synchronizeClock(elapsed, previous, mode, paused, 1100), { elapsed, previous: 1100 });
  assert.deepEqual(synchronizeClock(elapsed, previous, mode, { ...mode, time: 7 }, 1100), { elapsed: 7, previous: 1100 });
});

test('actual ShaderPlayer resize respects the pixel budget including 8K and extreme ratios', () => {
  for (const [width, height, dpr] of [[7332, 4244, 1], [1920, 1080, 2], [390, 844, 3], [1, 100000000, 1]]) {
    const canvas = { clientWidth: width, clientHeight: height, width: 1, height: 1 };
    const player = Object.create(ShaderPlayer.prototype);
    player.canvas = canvas;
    player.options = { pixelRatio: 0.01 };
    let viewport;
    player.gl = { viewport: (...args) => { viewport = args; } };
    resizeWithinBudget(player, width, height, dpr, 1500000);
    assert.ok(canvas.width * canvas.height <= 1500000, `${canvas.width}×${canvas.height}`);
    assert.deepEqual(viewport, [0, 0, canvas.width, canvas.height]);
    assert.equal(player.options.pixelRatio, 1);
  }
});
