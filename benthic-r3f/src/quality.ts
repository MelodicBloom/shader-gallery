export type Quality = 'eco' | 'balanced' | 'high';

export const QUALITY = {
  eco: { detail: 4, dpr: [0.65, 0.9] as const },
  balanced: { detail: 5, dpr: [0.8, 1.25] as const },
  high: { detail: 6, dpr: [1, 1.5] as const },
} satisfies Record<Quality, { detail: number; dpr: readonly [number, number] }>;

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function lowerQuality(quality: Quality): Quality {
  if (quality === 'high') return 'balanced';
  return 'eco';
}
