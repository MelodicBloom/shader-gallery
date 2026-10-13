import { createStore } from 'zustand/vanilla';

export const uniformContract = {
  grain: { label: 'Layer detail', min: 0, max: 1, step: 0.01, default: 0.48, uniform: 'grain' },
  layerSpacing: { label: 'Layer spacing', min: 0.35, max: 1.6, step: 0.01, default: 0.94, uniform: 'layerSpacing' },
  paletteShift: { label: 'Spectral phase', min: 0, max: 1, step: 0.01, default: 0.32, uniform: 'paletteShift' },
  spectral: { label: 'Spectral intensity', min: 0, max: 1, step: 0.01, default: 0.62, uniform: 'spectral' },
  fireStrength: { label: 'Inner fire', min: 0, max: 1.5, step: 0.01, default: 0.78, uniform: 'fireStrength' },
  roughness: { label: 'Surface roughness', min: 0.08, max: 0.8, step: 0.01, default: 0.26, uniform: 'roughness' },
} as const;
export type UniformKey = keyof typeof uniformContract;
export type UniformState = Record<UniformKey, number>;
export type ScenePreset = {
  version: 1; material: 'abalone'; uniforms: UniformState;
  camera: { yaw: number; pitch: number; distance: number };
  playback: 'playing' | 'paused'; time: number; lightHeading: number; reducedMotion: boolean; inspectorVisible: boolean;
};
const defaults = (): ScenePreset => ({ version: 1, material: 'abalone',
  uniforms: Object.fromEntries(Object.entries(uniformContract).map(([k, v]) => [k, v.default])) as UniformState,
  camera: { yaw: 0.35, pitch: 0.18, distance: 3.4 }, playback: 'playing', time: 0, lightHeading: -1.1,
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
    time: finite(p.time, 0, 86400), lightHeading: finite(p.lightHeading, -3.14, 3.14), playback: p.playback,
    reducedMotion: p.reducedMotion as boolean, inspectorVisible: p.inspectorVisible as boolean };
}
export const sceneStore = createStore<ScenePreset>(() => defaults());
export const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
export function setUniform(key: UniformKey, value: number) {
  const c = uniformContract[key]; finite(value, c.min, c.max);
  sceneStore.setState(s => ({ uniforms: { ...s.uniforms, [key]: value } }));
}
export function setLightHeading(value: number) { sceneStore.setState({ lightHeading: finite(value, -3.14, 3.14) }); }
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

export type EvidenceCapture = {
  id: string;
  label: string;
  purpose: 'directional interference and glint localization';
  preset: ScenePreset;
};

/**
 * Static input receipt for visual review. This does not claim a performance
 * measurement or physical-material validation.
 */
export function createEvidenceMatrix(): EvidenceCapture[] {
  const base = defaults();
  const cameras = [
    { id: 'C1', label: 'Camera 1', yaw: -0.72, pitch: -0.22, distance: 3.4 },
    { id: 'C2', label: 'Camera 2', yaw: 0.35, pitch: 0.18, distance: 3.4 },
    { id: 'C3', label: 'Camera 3', yaw: 1.1, pitch: 0.52, distance: 3.8 },
  ];
  const lights = [
    { id: 'L1', label: 'Light A', heading: -1.2 },
    { id: 'L2', label: 'Light B', heading: 0.15 },
    { id: 'L3', label: 'Light C', heading: 1.4 },
  ];
  return cameras.flatMap(camera => lights.map(light => ({
    id: `${camera.id}-${light.id}`,
    label: `${camera.label} / ${light.label}`,
    purpose: 'directional interference and glint localization' as const,
    preset: {
      ...base,
      camera: { yaw: camera.yaw, pitch: camera.pitch, distance: camera.distance },
      lightHeading: light.heading,
      playback: 'paused' as const,
      time: 0,
    },
  })));
}
