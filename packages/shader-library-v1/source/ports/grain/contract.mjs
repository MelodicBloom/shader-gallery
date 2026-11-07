export const SIZE = 384;
export const BASE_RGB = Object.freeze([224, 209, 183]);
export const DEFAULT_PARAMETERS = Object.freeze({ strength: 0.65, frequency: 0.16, octaves: 3, seed: 7 });

/** Validate the shared controls before either backend receives them. */
export function parameters(input = {}) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new TypeError("Expected grain parameters.");
  for (const key of Object.keys(input)) {
    if (!Object.hasOwn(DEFAULT_PARAMETERS, key)) throw new TypeError(`Unknown grain parameter: ${key}`);
  }
  const p = { ...DEFAULT_PARAMETERS, ...input };
  for (const [key, min, max, integer] of [
    ["strength", 0, 1, false], ["frequency", 0.01, 0.5, false],
    ["octaves", 1, 5, true], ["seed", 0, 65535, true]
  ]) {
    if (typeof p[key] !== "number" || !Number.isFinite(p[key]) || p[key] < min || p[key] > max || (integer && !Number.isInteger(p[key]))) {
      throw new RangeError(`${key} must be ${integer ? "an integer" : "a number"} in [${min}, ${max}].`);
    }
  }
  return Object.freeze(p);
}

/** A grain-only derivative of roughPaper's isotropic fractalNoise primitive. */
export function svgMarkup(input) {
  const p = parameters(input);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <defs><filter id="grain" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="${p.frequency}" numOctaves="${p.octaves}" seed="${p.seed}" result="noise"/>
    <feColorMatrix in="noise" type="saturate" values="0"/>
    <feComponentTransfer result="opaqueGrain">
      <feFuncR type="linear" slope="${p.strength}" intercept="${1 - p.strength}"/>
      <feFuncG type="linear" slope="${p.strength}" intercept="${1 - p.strength}"/>
      <feFuncB type="linear" slope="${p.strength}" intercept="${1 - p.strength}"/>
      <feFuncA type="table" tableValues="1 1"/>
    </feComponentTransfer>
    <feBlend in="SourceGraphic" in2="opaqueGrain" mode="multiply"/>
  </filter></defs>
  <rect width="${SIZE}" height="${SIZE}" fill="rgb(${BASE_RGB.join(",")})"${p.strength === 0 ? "" : ' filter="url(#grain)"'}/>
</svg>`;
}
