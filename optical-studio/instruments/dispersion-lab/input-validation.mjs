// Decimal literal only: rejects '', '-', '.', 'e', '1e', '0x10', 'Infinity', '1,5'.
const DECIMAL = /^[+-]?(?:\d+(?:\.\d+)?|\.\d+)(?:[eE][+-]?\d+)?$/;

/** Parse a complete decimal number, or null. Never coerces incomplete text to 0. */
export function parseFiniteInput(raw) {
  if (typeof raw !== 'string') return null;
  const s = raw.trim();
  if (!DECIMAL.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function stepDecimals(step) {
  const s = String(step);
  const i = s.indexOf('.');
  return i < 0 ? 0 : s.length - i - 1;
}

/** Parse a complete in-range, on-step input without changing what the user typed (used while typing). */
export function parseBoundedInput(raw, min, max, step) {
  const n = parseFiniteInput(raw);
  if (n === null || n < min || n > max) return null;
  if (step !== undefined && (!Number.isFinite(step) || step <= 0 || Math.abs((n-min)/step-Math.round((n-min)/step)) > 1e-7)) return null;
  return n;
}

/**
 * Commit (blur/change): a complete finite number is clamped to [min,max] and snapped to step.
 * Incomplete or non-numeric text returns null so the caller keeps it visible and invalid.
 */
export function commitBoundedInput(raw, min, max, step) {
  const n = parseFiniteInput(raw);
  if (n === null) return null;
  let v = Math.min(max, Math.max(min, n));
  if (step !== undefined && Number.isFinite(step) && step > 0) {
    v = min + Math.round((v - min) / step) * step;
    v = Math.min(max, Math.max(min, Number(v.toFixed(stepDecimals(step)))));
  }
  return v;
}
