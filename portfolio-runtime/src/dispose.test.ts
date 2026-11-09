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
