import test from 'node:test';
import assert from 'node:assert/strict';
import { parseBoundedInput } from './input-validation.mjs';

test('empty, incomplete and out-of-range input is rejected without clamping', () => {
  for (const value of ['', ' ', '.', '-', '1.', '1', '3', 'Infinity']) {
    assert.equal(parseBoundedInput(value, 1.01, 2.55), null);
  }
  assert.equal(parseBoundedInput('1.517', 1.01, 2.55), 1.517);
  assert.equal(parseBoundedInput('1.01', 1.01, 2.55), 1.01);
});
