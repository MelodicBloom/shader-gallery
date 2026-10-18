export const CONTROLS = Object.freeze({
  sectors: [3,24,1,10],
  scale: [0.5,12,0.1,4.2],
  speed: [-2,2,0.05,0.35],
  rotation: [-3.14159,3.14159,0.01,0],
  warp: [0,1.5,0.01,0.45],
  palette: [0,1,0.01,0.18],
  contrast: [0.5,2,0.01,1.15],
  seed: [0,9999,1,314]
});
export const DEFAULTS = Object.freeze(Object.fromEntries(Object.entries(CONTROLS).map(([k,v])=>[k,v[3]])));
export function validatePatch(patch) {
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) throw new TypeError('Object required');
  for (const [key,value] of Object.entries(patch)) {
    const limits=CONTROLS[key];
    if (!limits || typeof value !== 'number' || !Number.isFinite(value) || value<limits[0] || value>limits[1]) throw new RangeError('Invalid control: '+key);
    if ((key==='sectors'||key==='seed') && !Number.isInteger(value)) throw new RangeError('Integer required: '+key);
  }
  return Object.freeze({...patch});
}
export function foldPolar(x,y,n,rotation=0) {
  if (!Number.isInteger(n) || n<3 || n>24) throw new RangeError('N 3..24');
  if (![x,y,rotation].every(Number.isFinite)) throw new TypeError('Nonfinite geometry');
  const period=2*Math.PI/n, theta=Math.atan2(y,x)+rotation;
  const a=((theta%period)+period)%period, f=Math.min(a,period-a), r=Math.hypot(x,y);
  return [r*Math.cos(f),r*Math.sin(f)];
}
export function receipt(state,time) {
  validatePatch(state);
  if (Object.keys(state).length!==Object.keys(CONTROLS).length || !Number.isFinite(time) || time<0 || time>3600) throw new RangeError('Incomplete or invalid receipt');
  return {schemaVersion:'0.1.0',engine:'WebGL2 procedural fBm',controls:{...state},timeSeconds:time,renderValidation:'requires browser evidence'};
}