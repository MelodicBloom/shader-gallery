/** Parse a complete in-range input without changing what the user typed. */
export function parseBoundedInput(raw, min, max) {
  if (typeof raw !== 'string' || raw.trim() === '' || raw.endsWith('.')) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n >= min && n <= max ? n : null;
}
