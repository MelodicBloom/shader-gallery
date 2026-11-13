import { test } from 'node:test';
import assert from 'node:assert/strict';
import { disposePlayer, type DisposablePlayer } from './dispose';

// Mirrors ShaderPlayer.destroy(): GL deletes only run while this.gl is set.
function fakePlayer(lost: boolean) {
  const deletes: string[] = []; let destroyed = 0;
  const gl = { isContextLost: () => lost, deleteProgram: () => deletes.push('program'), deleteBuffer: () => deletes.push('buffer'), deleteVertexArray: () => deletes.push('vao') };
  const p: DisposablePlayer & { gl: typeof gl | null } = {
    gl, program: {}, quad: { buffer: {}, vao: {} },
    destroy() { destroyed++; const g = this.gl as typeof gl | null; if (g) { if (this.program) g.deleteProgram(); const q = this.quad as any; if (q?.buffer) g.deleteBuffer(); if (q?.vao) g.deleteVertexArray(); } this.program = null; this.quad = null; this.gl = null; },
  };
  return { p, deletes, destroyed: () => destroyed };
}

test('healthy context in the same epoch deletes GL objects', () => {
  const f = fakePlayer(false);
  assert.equal(disposePlayer(f.p, 0, 0), 'deleted');
  assert.deepEqual(f.deletes, ['program', 'buffer', 'vao']); assert.equal(f.destroyed(), 1);
});

test('lost context: no GL deletes, references dropped, destroy still runs', () => {
  const f = fakePlayer(true);
  assert.equal(disposePlayer(f.p, 0, 0), 'dropped');
  assert.deepEqual(f.deletes, []); assert.equal(f.destroyed(), 1);
  assert.equal(f.p.gl, null); assert.equal(f.p.program, null); assert.equal(f.p.quad, null);
});

test('restored context but player from an earlier epoch: no GL deletes', () => {
  const f = fakePlayer(false); // isContextLost() is false again after webglcontextrestored
  assert.equal(disposePlayer(f.p, 0, 1), 'dropped');
  assert.deepEqual(f.deletes, []);
});

test('null player is a no-op', () => {
  assert.equal(disposePlayer(null, 0, 0), 'none');
});

test('undefined player is a no-op', () => {
  assert.equal(disposePlayer(undefined, 2, 2), 'none');
});

test('a player without a context still releases non-GL resources after dropping handles', () => {
  let destroyed = 0;
  const player: DisposablePlayer = {
    gl: null, program: {}, quad: {},
    destroy() {
      assert.equal(this.gl, null);
      assert.equal(this.program, null);
      assert.equal(this.quad, null);
      destroyed++;
    },
  };
  assert.equal(disposePlayer(player, 3, 3), 'dropped');
  assert.equal(destroyed, 1);
});

test('stale epoch skips context queries and drops handles before cleanup', () => {
  let destroyed = 0;
  const player: DisposablePlayer = {
    gl: { isContextLost() { assert.fail('stale context must not be queried'); } },
    program: {}, quad: {},
    destroy() {
      assert.equal(this.gl, null);
      assert.equal(this.program, null);
      assert.equal(this.quad, null);
      destroyed++;
    },
  };
  assert.equal(disposePlayer(player, 4, 5), 'dropped');
  assert.equal(destroyed, 1);
});

test('healthy nonzero epoch preserves handles until destroy and repeat disposal does not delete twice', () => {
  const f = fakePlayer(false);
  const destroy = f.p.destroy;
  const { gl, program, quad } = f.p;
  f.p.destroy = function () {
    assert.equal(this.gl, gl); assert.equal(this.program, program); assert.equal(this.quad, quad);
    destroy.call(this);
  };
  assert.equal(disposePlayer(f.p, 7, 7), 'deleted');
  f.p.destroy = destroy;
  assert.equal(disposePlayer(f.p, 7, 7), 'dropped');
  assert.deepEqual(f.deletes, ['program', 'buffer', 'vao']);
  assert.equal(f.destroyed(), 2);
});

test('undefined player is a no-op across different epochs', () => {
  assert.equal(disposePlayer(undefined, 1, 2), 'none');
});

test('a player without a GL context still runs non-GL cleanup after dropping references', () => {
  let destroyed = 0;
  const player: DisposablePlayer = {
    gl: null, program: {}, quad: {},
    destroy() {
      destroyed++;
      assert.equal(this.gl, null);
      assert.equal(this.program, null);
      assert.equal(this.quad, null);
    },
  };
  assert.equal(disposePlayer(player, 4, 4), 'dropped');
  assert.equal(destroyed, 1);
});

test('stale epochs never query the old context and clear references before destroy', () => {
  let destroyed = 0;
  const player: DisposablePlayer = {
    gl: { isContextLost() { assert.fail('Stale context must not be queried'); } },
    program: {}, quad: {},
    destroy() {
      destroyed++;
      assert.equal(this.gl, null);
      assert.equal(this.program, null);
      assert.equal(this.quad, null);
    },
  };
  assert.equal(disposePlayer(player, 1, 3), 'dropped');
  assert.equal(destroyed, 1);
});

test('same nonzero epoch preserves healthy resources until destroy', () => {
  const gl = { isContextLost: () => false }, program = {}, quad = {};
  let destroyed = 0;
  const player: DisposablePlayer = {
    gl, program, quad,
    destroy() {
      destroyed++;
      assert.equal(this.gl, gl);
      assert.equal(this.program, program);
      assert.equal(this.quad, quad);
    },
  };
  assert.equal(disposePlayer(player, 7, 7), 'deleted');
  assert.equal(destroyed, 1);
});

test('disposing the same cleaned-up player again cannot delete GL objects twice', () => {
  const f = fakePlayer(false);
  assert.equal(disposePlayer(f.p, 2, 2), 'deleted');
  assert.equal(disposePlayer(f.p, 2, 2), 'dropped');
  assert.deepEqual(f.deletes, ['program', 'buffer', 'vao']);
  assert.equal(f.destroyed(), 2);
});
