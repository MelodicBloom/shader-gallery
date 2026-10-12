import { describe, expect, it } from 'vitest';
import { QUALITY, clamp, lowerQuality } from './quality';

describe('quality policy', () => {
  it('keeps detail and DPR ordered by cost', () => {
    expect(QUALITY.eco.detail).toBeLessThan(QUALITY.balanced.detail);
    expect(QUALITY.balanced.detail).toBeLessThan(QUALITY.high.detail);
    expect(QUALITY.eco.dpr[1]).toBeLessThan(QUALITY.high.dpr[1]);
  });

  it('steps quality down without falling below eco', () => {
    expect(lowerQuality('high')).toBe('balanced');
    expect(lowerQuality('balanced')).toBe('eco');
    expect(lowerQuality('eco')).toBe('eco');
  });

  it('clamps artist inputs to declared bounds', () => {
    expect(clamp(-1, 0, 2)).toBe(0);
    expect(clamp(1.2, 0, 2)).toBe(1.2);
    expect(clamp(3, 0, 2)).toBe(2);
  });
});
