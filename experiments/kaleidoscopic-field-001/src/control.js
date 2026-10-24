/** Pure, environment-independent experiment control semantics. */
export const FPS = 60;
export const DURATION = 12;
export const DEFAULTS = Object.freeze({
  segments: 9, displacement: 1.45, persistence: 0.945,
  speed: 0.70, audioGain: 1.15, tilt: 0.72,
  pointSize: 2.8, grid: 216, autoQuality: false
});
export const PRESETS = Object.freeze({
  proof: { ...DEFAULTS },
  restrained: { ...DEFAULTS, segments: 6, displacement: 0.7, persistence: 0.965, audioGain: 0.4, speed: 0.35 },
  energetic: { ...DEFAULTS, segments: 12, displacement: 2.2, persistence: 0.91, audioGain: 2, speed: 1.25, tilt: 0.9 }
});
const ranges = Object.freeze({
  segments: [3,20], displacement:[0,3], persistence:[0,0.985],
  speed:[0,2], audioGain:[0,3], tilt:[0.15,1.3],
  pointSize:[1,5], grid:[72,280]
});
export function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
export function sanitizeParams(p) {
  const out={};
  for (const [key,[lo,hi]] of Object.entries(ranges)) {
    const n=Number(p[key]);
    out[key]= Number.isFinite(n) ? clamp(n,lo,hi) : DEFAULTS[key];
  }
  out.segments=Math.round(out.segments);
  out.grid=Math.round(out.grid);
  out.autoQuality=Boolean(p.autoQuality);
  return out;
}
export function audioAt(samples, time) {
  if (!samples.length) return {t:0,rms:0,kick:0,snare:0,rhythm:0};
  const pos=clamp(time*FPS,0,samples.length-1);
  const i=Math.floor(pos), j=Math.min(samples.length-1,i+1), f=pos-i;
  const result={t:time};
  for(const k of ['rms','kick','snare','rhythm'])
    result[k]=samples[i][k]*(1-f)+samples[j][k]*f;
  return result;
}
export function derivedAudio(a, gain) {
  const hit=clamp(Math.max(a.kick,a.snare),0,1);
  return { rms: clamp(a.rms,0,1), hit,
    motion: clamp((0.58*a.rms+0.42*hit)*gain,0,3),
    // [0.5, 100] is referenced in the tutorial, NOT asserted to be an exact mapping.
    tutorialStyleSlope: 0.5+99.5*clamp((0.58*a.rms+0.42*hit)*gain/3,0,1)
  };
}
export function scheduleAt(time) {
  // Public schedule shared by browser implementation + TouchDesigner reproduction.
  // Only two time-windowed changes; all others held at PROOF defaults.
  return {
    segments: time < 4 ? 9 : time < 8 ? 12 : 7,
    phase: time < 4 ? 'A' : time < 8 ? 'B' : 'C',
    displacementMultiplier: time < 4 ? 1 : time < 8 ? 1.2 : 0.8,
  };
}
export function foldAngle(angle, sectors) {
  const wedge=Math.PI/sectors;
  const full=2*wedge;
  const t=((angle%full)+full)%full;
  return t>wedge?full-t:t;
}
export function expectedFrameCount() { return FPS*DURATION; }
export function buildProvenance(params, samples, runtime={}) {
  return {
    schema:'kaleidoscopic-field-trace/v1', specimen:'KF-001',
    generator:'self-contained WebGL2 reference implementation',
    durationSeconds:DURATION, simulationFPS:FPS,
    fixture:'fixtures/benchmark-12s.wav', envelope:'fixtures/envelope-60fps.json',
    schedule:'docs/parameter-schedule.json',
    params:sanitizeParams(params), sampleCount:samples.length,
    coordinateConventions:'centered UV [-1,1], reflection per PI/N wedge; R channel represents height in [0,1]',
    runtime, limitations:[
      'GPU pixel equality is not guaranteed across drivers',
      'TouchDesigner operator equivalence is approximate until a .toe is built and measured',
      'Audio event annotations are fixture-ground-truth; they are not live beat detections'
    ]
  };
}
