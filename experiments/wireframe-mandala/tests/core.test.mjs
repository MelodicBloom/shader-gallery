import test from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { DEFAULT, LIMIT, normalize, sampleCurve, generate, estimateSegments, fingerprint, stepClock } from '../core.mjs';

test('clock advances at high refresh rates and bounds long gaps', () => {
  let clock = {elapsed:0,frameTime:0};
  for (let i=0;i<120;i++) clock=stepClock(clock.elapsed,1/120);
  assert.ok(Math.abs(clock.elapsed-1)<1e-9);
  assert.equal(clock.frameTime,1);
  assert.equal(stepClock(0,3).elapsed,0.08);
  assert.throws(()=>stepClock(0,-1),RangeError);
});

test('evidence tool finds its default preset when the path contains spaces', () => {
  const temp = mkdtempSync(join(tmpdir(), 'mandala test '));
  try {
    cpSync(fileURLToPath(new URL('../core.mjs', import.meta.url)), join(temp, 'core.mjs'));
    cpSync(fileURLToPath(new URL('../tools', import.meta.url)), join(temp, 'tools'), {recursive:true});
    cpSync(fileURLToPath(new URL('../presets', import.meta.url)), join(temp, 'presets'), {recursive:true});
    const result = spawnSync(process.execPath, [join(temp, 'tools', 'run-evidence.mjs'), '--time', '0'], {encoding:'utf8'});
    assert.equal(result.status, 0, result.stderr);
    assert.equal(JSON.parse(result.stdout).geometryFingerprint, '957b608d');
  } finally { rmSync(temp, {recursive:true, force:true}); }
});

test('default segment count matches declared complexity', () => {
  const p=normalize(DEFAULT); assert.equal(generate(p,0).segments.length,estimateSegments(p));
});
test('seed/time replay is deterministic', () => {
  const p=normalize(DEFAULT);
  assert.equal(fingerprint(generate(p,12.25).segments),fingerprint(generate(p,12.25).segments));
  assert.notEqual(fingerprint(generate(p,12.25).segments),fingerprint(generate({...p,seed:12},12.25).segments));
  assert.notEqual(fingerprint(generate(p,12.25).segments),fingerprint(generate(p,12.5).segments));
});
test('bounded controls reject pathological segment counts and invalid shape', () => {
  assert.throws(()=>normalize({points:128,copies:24,templates:16,mode:'nested'}),RangeError);
  assert.throws(()=>normalize(null),TypeError);
  assert.throws(()=>normalize({amplitdue:0.5}),RangeError);
  assert.throws(()=>normalize({points:'100'}),TypeError);
  assert.equal(normalize({amplitude:99}).amplitude,0.9);
  assert.equal(normalize({speed:-1}).speed,0);
  assert.ok(estimateSegments(normalize(DEFAULT)) <= LIMIT);
});
test('radial repetition preserves each arm length and finite coordinates',()=>{
  const p=normalize({...DEFAULT,mode:'radial',copies:8});
  const segs=generate(p,0).segments;
  assert.equal(segs.length,(p.points-1)*8);
  assert.ok(segs.every(s=>s.every(Number.isFinite)));
  for(let arm=1;arm<8;arm++) {
    const s=segs[arm*(p.points-1)], orig=segs[0];
    const r=Math.hypot(s[0],s[1]), r0=Math.hypot(orig[0],orig[1]);
    assert.ok(Math.abs(r-r0)<1e-10);
  }
});
test('noise amplitude zero produces straight base curve',()=>{
  const p=normalize({...DEFAULT,amplitude:0});
  assert.ok(sampleCurve(p,5).every(([x,y])=>x>0 && y===0));
});
