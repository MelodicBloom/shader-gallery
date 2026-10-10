import { ShaderPlayer } from '../../library-v1/runtime/ShaderPlayer.js';
import fragment from './abalone.glsl?raw';
import fallbackUrl from '../../library-v1/shaders/aurora/abalone/preview.png';
import { sceneStore, uniformContract, setUniform, orbit, resetScene, serializePreset, restorePreset, type UniformKey } from './state';
import './styles.css';

const element = <T extends HTMLElement>(selector: string) => document.querySelector<T>(selector)!;
const canvas = element<HTMLCanvasElement>('#surface');
const fallback = element<HTMLImageElement>('#fallback'); fallback.src = fallbackUrl;
const status = element('#render-status');
const reduced = element<HTMLInputElement>('#reduced');
const playback = element<HTMLButtonElement>('#playback');
const preset = element<HTMLTextAreaElement>('#preset');
const presetStatus = element('#preset-status');
const media = matchMedia('(prefers-reduced-motion: reduce)');
sceneStore.setState({ reducedMotion: media.matches });
let player: ShaderPlayer | null = null, raf = 0, lost = false, generation = 0;
let elapsed = 0, previous = performance.now(), sample: number[] = [], lastReport = 0;
let motionState = sceneStore.getState(), dirty = true;
const inputs = new Map<UniformKey, HTMLInputElement>();

for (const [key, contract] of Object.entries(uniformContract)) {
  const label = document.createElement('label'); label.className = 'uniform';
  const heading = document.createElement('span'); heading.append(document.createTextNode(contract.label));
  const output = document.createElement('output'); output.id = `value-${key}`;
  const input = document.createElement('input'); input.type = 'range'; input.id = `uniform-${key}`;
  input.min = String(contract.min); input.max = String(contract.max); input.step = String(contract.step);
  output.htmlFor = input.id; label.htmlFor = input.id; heading.append(output); label.append(heading, input);
  input.addEventListener('input', () => setUniform(key as UniformKey, input.valueAsNumber));
  inputs.set(key as UniformKey, input); element('#uniform-controls').append(label);
}

function synchronize() {
  const s = sceneStore.getState();
  for (const [key, input] of inputs) { input.value = String(s.uniforms[key]); element(`#value-${key}`).textContent = s.uniforms[key].toFixed(2); }
  reduced.checked = s.reducedMotion;
  playback.textContent = s.playback === 'playing' ? 'Pause motion' : 'Resume motion';
  element('#inspector').hidden = !s.inspectorVisible;
  element('main').classList.toggle('inspector-hidden', !s.inspectorVisible);
  const toggle = element('#inspector-toggle'); toggle.textContent = s.inspectorVisible ? 'Hide inspector' : 'Show inspector'; toggle.setAttribute('aria-expanded', String(s.inspectorVisible));
  if (s.time !== motionState.time) elapsed = s.time;
  // Paused/reduced motion preserves the displayed phase, including while orbiting.
  motionState = s; previous = performance.now(); dirty = true; sample = [];
  if (s.reducedMotion || s.playback === 'paused') element('#performance').textContent = 'Frame cadence: motion stopped; render on change';
}
sceneStore.subscribe(synchronize); synchronize();
media.addEventListener('change', event => sceneStore.setState({ reducedMotion: event.matches }));
reduced.addEventListener('change', () => sceneStore.setState({ reducedMotion: reduced.checked }));
playback.addEventListener('click', () => sceneStore.setState(s => ({ playback: s.playback === 'playing' ? 'paused' : 'playing' })));
element('#inspector-toggle').addEventListener('click', () => sceneStore.setState(s => ({ inspectorVisible: !s.inspectorVisible })));
element('#reset').addEventListener('click', () => { elapsed = 0; resetScene(); presetStatus.textContent = 'Named preset: Midnight nacre'; });
element('#export').addEventListener('click', () => { preset.value = serializePreset(elapsed); presetStatus.textContent = 'Preset exported at the displayed phase.'; });
element('#restore').addEventListener('click', () => {
  try { restorePreset(preset.value); elapsed = sceneStore.getState().time; dirty = true; presetStatus.textContent = 'Preset restored.'; }
  catch (error) { presetStatus.textContent = `Preset rejected: ${(error as Error).message}`; }
});

let pointer: { id: number; x: number; y: number } | null = null;
canvas.addEventListener('pointerdown', event => { pointer = { id: event.pointerId, x: event.clientX, y: event.clientY }; canvas.setPointerCapture(event.pointerId); canvas.focus(); });
canvas.addEventListener('pointermove', event => {
  if (!pointer || pointer.id !== event.pointerId) return;
  const c = sceneStore.getState().camera;
  orbit(c.yaw - (event.clientX-pointer.x)*0.008, c.pitch + (event.clientY-pointer.y)*0.008);
  pointer.x = event.clientX; pointer.y = event.clientY;
});
for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) canvas.addEventListener(event, () => { pointer = null; });
canvas.addEventListener('keydown', event => {
  const c = sceneStore.getState().camera;
  const delta: Record<string, [number, number, number]> = { ArrowLeft: [-0.12,0,0], ArrowRight: [0.12,0,0], ArrowUp: [0,0.12,0], ArrowDown: [0,-0.12,0], '+': [0,0,-0.2], '=': [0,0,-0.2], '-': [0,0,0.2] };
  if (delta[event.key]) { event.preventDefault(); const d=delta[event.key]; orbit(c.yaw+d[0], c.pitch+d[1], c.distance+d[2]); }
});

function resize() {
  if (!player || lost) return;
  player.options.pixelRatio = Math.min(devicePixelRatio || 1, 1.5);
  player.resize(); dirty = true;
  element('#dimensions').textContent = `Render size: ${canvas.width} × ${canvas.height} / DPR ${player.options.pixelRatio.toFixed(2)}`;
}
const observer = new ResizeObserver(resize); observer.observe(canvas);
window.addEventListener('resize', resize);
document.addEventListener('visibilitychange', () => { previous = performance.now(); sample = []; dirty = true; });

async function initialize() {
  const current = ++generation;
  cancelAnimationFrame(raf); player?.destroy(); player = null;
  fallback.hidden = false; canvas.hidden = true;
  status.textContent = 'Preparing WebGL2…';
  element('#error-details').hidden = true;
  const next = new ShaderPlayer(canvas, fragment, { autoStart: false, autoResize: false, trackPointer: false, preserveDrawingBuffer: false, pixelRatio: Math.min(devicePixelRatio || 1, 1.5) });
  try {
    await next.init();
    if (current !== generation || lost) { next.destroy(); return; }
    for (const contract of Object.values(uniformContract)) {
      if (next.uniforms.get(contract.uniform)?.type !== 'float') throw new Error(`Uniform contract mismatch: ${contract.uniform} must be an active float.`);
    }
    if (next.uniforms.get('cameraOrbit')?.type !== 'vec3') throw new Error('Uniform contract mismatch: cameraOrbit must be an active vec3.');
    player = next; canvas.hidden = false; resize(); fallback.hidden = true;
    status.textContent = 'WebGL2 / GLSL ES 3.00 · compiled + linked';
    element('#performance').textContent = motionState.reducedMotion || motionState.playback === 'paused'
      ? 'Frame cadence: motion stopped; render on change' : 'Frame cadence: sampling…';
    previous = performance.now(); dirty = true;
    raf = requestAnimationFrame(frame);
  } catch (error) {
    next.destroy(); status.textContent = `Static preview · ${(error as Error).message.split('\n')[0]}`;
    element('#error-details').hidden = false;
    element('#render-error').textContent = (error as Error).message;
    fallback.alt = 'Static Abalone interference preview. Live WebGL2 rendering is unavailable.';
    element('#performance').textContent = 'Frame cadence: unavailable';
  }
}
function frame(now: number) {
  if (!player || lost) return;
  const dt = now-previous; previous = now;
  const s = sceneStore.getState(), animated = s.playback === 'playing' && !s.reducedMotion && !document.hidden;
  if (animated) elapsed = (elapsed + Math.min(dt,100)/1000) % 86400;
  if (!document.hidden && (animated || dirty)) {
    for (const [key, contract] of Object.entries(uniformContract)) player.setUniform(contract.uniform, s.uniforms[key as UniformKey]);
    player.setUniform('cameraOrbit', [s.camera.yaw, s.camera.pitch, s.camera.distance]);
    player.renderOnce({ time: elapsed }); dirty = false;
    if (animated && dt > 0) {
      sample.push(dt); if (sample.length > 180) sample.shift();
      if (now-lastReport > 1000 && sample.length >= 30) {
        const ordered = [...sample].sort((a,b)=>a-b);
        const p95 = ordered[Math.floor((ordered.length-1)*0.95)];
        element('#performance').textContent = `Frame cadence p95: ${p95.toFixed(1)} ms / ${sample.length} samples (not GPU time)`;
        lastReport = now;
      }
    }
  }
  raf = requestAnimationFrame(frame);
}
canvas.addEventListener('webglcontextlost', event => {
  event.preventDefault(); lost = true; ++generation; cancelAnimationFrame(raf);
  fallback.hidden = false; status.textContent = 'Context lost · static preview · waiting for recovery';
  element('#performance').textContent = 'Frame cadence: context lost';
});
canvas.addEventListener('webglcontextrestored', () => { lost = false; void initialize(); });
window.addEventListener('pagehide', () => { ++generation; cancelAnimationFrame(raf); observer.disconnect(); player?.destroy(); });
void initialize();
