import test from 'node:test';
import assert from 'node:assert/strict';
import { parseBoundedInput, parseFiniteInput, commitBoundedInput } from './input-validation.mjs';

const INCOMPLETE = ['', ' ', '.', '-', '+', '1.', '-1.', 'e', '1e', '1e+', '-.', '0x10', '1,5', 'Infinity', '-Infinity', 'NaN', '1.2.3'];

test('empty, incomplete and out-of-range input is rejected without clamping', () => {
  for (const value of ['', ' ', '.', '-', '1.', '1', '3', 'Infinity']) {
    assert.equal(parseBoundedInput(value, 1.01, 2.55), null);
  }
  assert.equal(parseBoundedInput('1.517', 1.01, 2.55), 1.517);
  assert.equal(parseBoundedInput('1.01', 1.01, 2.55), 1.01);
  assert.equal(parseBoundedInput('9.05', 9, 95, 0.1), null);
  assert.equal(parseBoundedInput('9.1', 9, 95, 0.1), 9.1);
  assert.equal(parseBoundedInput('1.517', 1.01, 2.55, 0.001), 1.517);
});

test('parseFiniteInput never turns incomplete text into 0', () => {
  for (const value of INCOMPLETE) assert.equal(parseFiniteInput(value), null, JSON.stringify(value));
  assert.equal(parseFiniteInput(null), null);
  assert.equal(parseFiniteInput(undefined), null);
  assert.equal(parseFiniteInput(0), null, 'non-string rejected');
  assert.equal(parseFiniteInput('0'), 0, 'a typed 0 is a real 0');
  assert.equal(parseFiniteInput(' 1.5 '), 1.5);
  assert.equal(parseFiniteInput('.5'), 0.5);
  assert.equal(parseFiniteInput('-2'), -2);
  assert.equal(parseFiniteInput('1e1'), 10);
  assert.equal(parseFiniteInput('1e999'), null, 'overflow to Infinity rejected');
});

test('parseBoundedInput rejects every incomplete string', () => {
  for (const value of INCOMPLETE) assert.equal(parseBoundedInput(value, 9, 95, 0.1), null, JSON.stringify(value));
});

test('commitBoundedInput leaves incomplete text uncommitted (null, not 0 or min)', () => {
  for (const value of INCOMPLETE) assert.equal(commitBoundedInput(value, 9, 95, 0.1), null, JSON.stringify(value));
});

test('commitBoundedInput clamps a complete number only at commit time', () => {
  assert.equal(commitBoundedInput('3', 9, 95, 0.1), 9);
  assert.equal(commitBoundedInput('400', 9, 95, 0.1), 95);
  assert.equal(commitBoundedInput('0', 1.01, 2.55, 0.001), 1.01);
  assert.equal(commitBoundedInput('3', 1.01, 2.55, 0.001), 2.55);
  assert.equal(commitBoundedInput('30', 9, 95, 0.1), 30);
});

test('commitBoundedInput snaps to step without float noise', () => {
  assert.equal(commitBoundedInput('9.04', 9, 95, 0.1), 9);
  assert.equal(commitBoundedInput('9.06', 9, 95, 0.1), 9.1);
  assert.equal(commitBoundedInput('1.5174', 1.01, 2.55, 0.001), 1.517);
  assert.equal(commitBoundedInput('64.2', 9, 95, 0.1), 64.2);
  const v = commitBoundedInput('33.33', 9, 95, 0.1);
  assert.equal(v, 33.3);
  assert.equal(parseBoundedInput(String(v), 9, 95, 0.1), v, 'committed value re-validates');
});
