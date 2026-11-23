export const DEFAULT_GENERATED_AT = "2026-07-22T23:17:29.204Z";

/**
 * Resolves the registry timestamp without making ordinary builds time-dependent.
 *
 * SOURCE_DATE_EPOCH is the reproducible-builds convention and is expressed as
 * whole seconds since the Unix epoch. When it is not supplied, the committed
 * v0.1 release timestamp is retained so rebuilding the same sources produces
 * the same registry bytes.
 */
export function resolveGeneratedAt(sourceDateEpoch) {
  if (sourceDateEpoch == null || sourceDateEpoch === "") {
    return DEFAULT_GENERATED_AT;
  }

  const value = String(sourceDateEpoch);
  if (!/^\d+$/.test(value)) {
    throw new Error("SOURCE_DATE_EPOCH must be a non-negative integer number of seconds.");
  }

  const seconds = Number(value);
  const milliseconds = seconds * 1000;
  if (!Number.isSafeInteger(seconds) || !Number.isSafeInteger(milliseconds)) {
    throw new Error("SOURCE_DATE_EPOCH is outside the supported safe integer range.");
  }

  const date = new Date(milliseconds);
  if (Number.isNaN(date.getTime())) {
    throw new Error("SOURCE_DATE_EPOCH does not resolve to a valid date.");
  }

  return date.toISOString();
}
