import { createStore } from 'zustand/vanilla';

export const uniformContract = {
  grain: { label: 'Layer detail', min: 0, max: 1, step: 0.01, default: 0.48, uniform: 'grain' },
  paletteShift: { label: 'Spectral phase', min: 0, max: 1, step: 0.01, default: 0.32, uniform: 'paletteShift' },
  spectral: { label: 'Spectral intensity', min: 0, max: 1, step: 0.01, default: 0.62, uniform: 'spectral' },
  roughness: { label: 'Surface roughness', min: 0.08, max: 0.8, step: 0.01, default: 0.26, uniform: 'roughness' },
} as const;
export type UniformKey = keyof typeof uniformContract;
export type UniformState = Record<UniformKey, number>;
export type ScenePreset = {
  version: 1; material: 'abalone'; uniforms: UniformState;
  camera: { yaw: number; pitch: number; distance: number };
  playback: 'playing' | 'paused'; time: number; reducedMotion: boolean; inspectorVisible: boolean;
};
const defaults = (): ScenePreset => ({ version: 1, material: 'abalone',
  uniforms: Object.fromEntries(Object.entries(uniformContract).map(([k, v]) => [k, v.default])) as UniformState,
  camera: { yaw: 0.35, pitch: 0.18, distance: 3.4 }, playback: 'playing', time: 0,
  reducedMotion: false, inspectorVisible: true });
const finite = (value: unknown, min: number, max: number): number => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) throw new Error(`Expected a finite number in [${min}, ${max}].`);
  return value;
};
const object = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Expected a preset object.');
  return value as Record<string, unknown>;
};
export function parsePreset(text: string): ScenePreset {
  const p = object(JSON.parse(text)), uniforms = object(p.uniforms), camera = object(p.camera);
  if (p.version !== 1 || p.material !== 'abalone') throw new Error('Unsupported preset version or material.');
  if (p.playback !== 'playing' && p.playback !== 'paused') throw new Error('Invalid playback mode.');
  for (const key of ['reducedMotion', 'inspectorVisible']) if (typeof p[key] !== 'boolean') throw new Error(`Invalid ${key}.`);
  return { version: 1, material: 'abalone',
    uniforms: Object.fromEntries(Object.entries(uniformContract).map(([k, v]) => [k, finite(uniforms[k], v.min, v.max)])) as UniformState,
    camera: { yaw: finite(camera.yaw, -Math.PI, Math.PI), pitch: finite(camera.pitch, -1.2, 1.2), distance: finite(camera.distance, 2.4, 5) },
    time: finite(p.time, 0, 86400), playback: p.playback,
    reducedMotion: p.reducedMotion as boolean, inspectorVisible: p.inspectorVisible as boolean };
}
export const sceneStore = createStore<ScenePreset>(() => defaults());
export const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
export function setUniform(key: UniformKey, value: number) {
  const c = uniformContract[key]; finite(value, c.min, c.max);
  sceneStore.setState(s => ({ uniforms: { ...s.uniforms, [key]: value } }));
}
export function orbit(yaw: number, pitch: number, distance = sceneStore.getState().camera.distance) {
  if (![yaw, pitch, distance].every(Number.isFinite)) throw new Error('Camera values must be finite.');
  sceneStore.setState({ camera: { yaw: ((yaw + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI, pitch: clamp(pitch, -1.2, 1.2), distance: clamp(distance, 2.4, 5) } });
}
export function resetScene(reducedMotion = sceneStore.getState().reducedMotion) { sceneStore.setState({ ...defaults(), reducedMotion }, true); }
export function serializePreset(time = sceneStore.getState().time) {
  const s = sceneStore.getState();
  // Parsing projects into a stable field order and validates the complete export.
  return JSON.stringify(parsePreset(JSON.stringify({ ...s, time: finite(time, 0, 86400) })), null, 2);
}
export function restorePreset(text: string) { const p = parsePreset(text); sceneStore.setState(p, true); }
