/** Parse a complete in-range input without changing what the user typed. */
export function parseBoundedInput(raw, min, max, step) {
  if (typeof raw !== 'string' || raw.trim() === '' || raw.endsWith('.')) return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < min || n > max) return null;
  if (step !== undefined && (!Number.isFinite(step) || step <= 0 || Math.abs((n-min)/step-Math.round((n-min)/step)) > 1e-7)) return null;
  return n;
}
