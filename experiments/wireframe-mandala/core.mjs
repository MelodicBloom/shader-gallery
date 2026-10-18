/** Deterministic procedural wireframe reference. No rendering or IO dependencies. */
export const SOURCE_ID = 'sFY78EmBZvY';
export const LIMIT = 30000;
export const DEFAULT = Object.freeze({
  seed: 31415, points: 96, copies: 12, templates: 8,
  amplitude: 0.3, frequency: 3.2, speed: 0.3,
  mode: 'nested', phase: 0, glow: true
});
const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
const finite = (x, fallback) => typeof x === 'number' && Number.isFinite(x) ? x : fallback;
function int(x, fallback, low, high) { return clamp(Math.round(finite(x, fallback)), low, high); }
export function normalize(input = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new TypeError('config must be an object');
  for (const key of Object.keys(input)) {
    if (!Object.hasOwn(DEFAULT, key)) throw new RangeError(`unknown control: ${key}`);
    if (typeof DEFAULT[key] === 'number' && (typeof input[key] !== 'number' || !Number.isFinite(input[key]))) throw new TypeError(`invalid numeric control: ${key}`);
  }
  const p = { ...DEFAULT,
    seed: int(input.seed, DEFAULT.seed, 0, 2147483647),
    points: int(input.points, DEFAULT.points, 12, 128),
    copies: int(input.copies, DEFAULT.copies, 3, 24),
    templates: int(input.templates, DEFAULT.templates, 1, 16),
    amplitude: clamp(finite(input.amplitude, DEFAULT.amplitude), 0, 0.9),
    frequency: clamp(finite(input.frequency, DEFAULT.frequency), 0.2, 12),
    speed: clamp(finite(input.speed, DEFAULT.speed), 0, 3),
    phase: clamp(finite(input.phase, DEFAULT.phase), -10000, 10000),
    mode: input.mode === 'radial' ? 'radial' : 'nested',
    glow: typeof input.glow === 'boolean' ? input.glow : DEFAULT.glow
  };
  // Reject over-budget requests instead of silently changing their semantic intent.
  if (estimateSegments(p) > LIMIT) throw new RangeError(`geometry budget > ${LIMIT} segments`);
  return p;
}
export function estimateSegments(p) {
  return (p.points - 1) * p.copies * (1 + (p.mode === 'nested' ? p.templates : 0));
}
function fract(x) { return x - Math.floor(x); }
function randomCell(i, seed) { return fract(Math.sin(i * 127.1 + seed * 311.7) * 43758.5453123); }
function noise1(x, seed) {
  const i = Math.floor(x), t = x - i, s = t * t * (3 - 2 * t);
  return (randomCell(i, seed) * (1 - s) + randomCell(i + 1, seed) * s) * 2 - 1;
}
function fbm(x, seed) {
  return (0.58 * noise1(x, seed) + 0.29 * noise1(x * 2.03 + 17.4, seed + 8) + 0.13 * noise1(x * 4.09 + 33.8, seed + 19));
}
export function sampleCurve(p, timeSeconds = 0) {
  const t = finite(timeSeconds, 0), out = [];
  for (let i = 0; i < p.points; i++) {
    const u = i / (p.points - 1);
    const x = 0.09 + 0.83 * u;
    const y = p.amplitude * fbm(u * p.frequency * 4 + p.phase + t * p.speed, p.seed);
    out.push([x, y]);
  }
  return out;
}
/** Segment arrays are [x1,y1,x2,y2,arm,layer], in normalized world coordinates. */
export function generate(input = DEFAULT, timeSeconds = 0) {
  const p = normalize(input), curve = sampleCurve(p, timeSeconds), out = [];
  const pushRotated = (a, b, theta, arm, layer) => {
    const c = Math.cos(theta), s = Math.sin(theta);
    out.push([a[0]*c-a[1]*s,a[0]*s+a[1]*c,b[0]*c-b[1]*s,b[0]*s+b[1]*c,arm,layer]);
  };
  for (let arm = 0; arm < p.copies; arm++) {
    const angle = 2 * Math.PI * arm / p.copies;
    for (let i = 0; i < curve.length - 1; i++) pushRotated(curve[i], curve[i+1], angle, arm, 0);
    if (p.mode === 'nested') {
      for (let j = 0; j < p.templates; j++) {
        // A bounded, explicit approximation of Copy SOP's template-point mechanism:
        // scaled source curve is oriented along the local template tangent.
        const k = Math.round((j + 0.5) * (curve.length - 1) / p.templates);
        const anchor = curve[k], prev = curve[Math.max(0,k-1)], next = curve[Math.min(curve.length-1,k+1)];
        const slope = Math.atan2(next[1]-prev[1], next[0]-prev[0]);
        const co = Math.cos(slope), si = Math.sin(slope), size = 0.13;
        for (let i = 0; i < curve.length-1; i++) {
          const a=curve[i], b=curve[i+1];
          const u=[anchor[0]+size*(a[0]*co-a[1]*si),anchor[1]+size*(a[0]*si+a[1]*co)];
          const v=[anchor[0]+size*(b[0]*co-b[1]*si),anchor[1]+size*(b[0]*si+b[1]*co)];
          pushRotated(u,v,angle,arm,1);
        }
      }
    }
  }
  return { params:p, segments:out };
}
/** Reproducibility fingerprint, *not* a cryptographic hash. */
export function fingerprint(segments) {
  let h = 2166136261;
  for (const segment of segments) {
    for (const coordinate of segment) {
      const q = Math.round(coordinate * 100000);
      h ^= q; h = Math.imul(h, 16777619) >>> 0;
    }
  }
  return h.toString(16).padStart(8, '0');
}
