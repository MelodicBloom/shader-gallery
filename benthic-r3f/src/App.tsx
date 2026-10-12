import { useEffect, useState } from 'react';
import { BenthicScene, type MaterialControls } from './BenthicScene';
import { lowerQuality, type Quality } from './quality';

const PALETTES = {
  cyan: { baseColor: '#001122', glowColor: '#00f0ff' },
  toxic: { baseColor: '#102200', glowColor: '#39ff14' },
  coral: { baseColor: '#220011', glowColor: '#ff3366' },
} as const;

type Palette = keyof typeof PALETTES;

const INITIAL: MaterialControls = {
  ...PALETTES.cyan,
  density: 3.2,
  displacement: 0.34,
  fresnel: 2.8,
  speed: 0.55,
};

function useReducedMotion() {
  const [reduced, setReduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const query = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return reduced;
}

type RangeProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
};

function Range({ label, value, min, max, step, onChange }: RangeProps) {
  const id = `control-${label.toLowerCase().replaceAll(' ', '-')}`;
  return (
    <div className="range">
      <label htmlFor={id}>{label}</label>
      <output htmlFor={id}>{value.toFixed(2)}</output>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={event => onChange(Number(event.target.value))} />
    </div>
  );
}

export function App() {
  const systemReducedMotion = useReducedMotion();
  const [controls, setControls] = useState(INITIAL);
  const [palette, setPalette] = useState<Palette>('cyan');
  const [quality, setQuality] = useState<Quality>(systemReducedMotion ? 'eco' : 'balanced');
  const [manualQuality, setManualQuality] = useState(false);
  const [paused, setPaused] = useState(systemReducedMotion);
  const [fps, setFps] = useState(0);

  useEffect(() => {
    if (systemReducedMotion) {
      setPaused(true);
      if (!manualQuality) setQuality('eco');
    }
  }, [manualQuality, systemReducedMotion]);

  const updateControl = <K extends keyof MaterialControls>(key: K, value: MaterialControls[K]) => {
    setControls(previous => ({ ...previous, [key]: value }));
  };

  const choosePalette = (next: Palette) => {
    setPalette(next);
    setControls(previous => ({ ...previous, ...PALETTES[next] }));
  };

  return (
    <main className="app-shell">
      <div className="scene"><BenthicScene controls={controls} quality={quality} paused={paused} reducedMotion={systemReducedMotion} onFps={setFps} onDecline={() => { if (!manualQuality) setQuality(current => lowerQuality(current)); }} /></div>
      <div className="scanlines" aria-hidden="true" />
      <div className="hud">
        <header className="topbar">
          <section className="brand"><h1>BENTHIC_R3F</h1><p>React Three Fiber // procedural material system</p></section>
          <dl className="telemetry"><div><dt>Render</dt><dd>{fps > 0 ? `${fps} fps` : 'starting'}</dd></div><div><dt>Quality</dt><dd>{quality}</dd></div><div><dt>Geometry</dt><dd>icosphere d{quality === 'eco' ? 4 : quality === 'balanced' ? 5 : 6}</dd></div><div><dt>Motion</dt><dd>{paused ? 'paused' : 'active'}</dd></div></dl>
        </header>

        <aside className="pipeline panel"><h2>R3F scene pipeline</h2><p>React controls → R3F scene graph → Three.js shader material → WebGL</p><p className="hint">drag to orbit // tap material to pulse</p></aside>

        <section className="controls" aria-label="Artist controls">
          <article className="panel"><h2>[MAT.01] Material identity</h2><div className="swatches" role="group" aria-label="Material palette">{(Object.keys(PALETTES) as Palette[]).map(name => <button key={name} aria-pressed={palette === name} onClick={() => choosePalette(name)}>{name}</button>)}</div><Range label="Fresnel power" value={controls.fresnel} min={0.8} max={5} step={0.1} onChange={value => updateControl('fresnel', value)} /></article>
          <article className="panel"><h2>[GEO.02] Mesh displacement</h2><Range label="Tissue density" value={controls.density} min={1} max={7} step={0.1} onChange={value => updateControl('density', value)} /><Range label="Ridge depth" value={controls.displacement} min={0} max={0.72} step={0.01} onChange={value => updateControl('displacement', value)} /><Range label="Metabolic rate" value={controls.speed} min={0} max={1.4} step={0.02} onChange={value => updateControl('speed', value)} /></article>
          <article className="panel runtime"><h2>[SYS.03] Runtime</h2><p>This companion uses a real R3F scene graph, Three.js geometry and ShaderMaterial, throttled React telemetry, and frame-loop mutation through refs.</p><div className="quality" role="group" aria-label="Geometry quality">{(['eco', 'balanced', 'high'] as Quality[]).map(name => <button key={name} aria-pressed={quality === name} onClick={() => { setManualQuality(true); setQuality(name); }}>{name}</button>)}</div><div className="actions"><button onClick={() => setPaused(value => !value)} aria-pressed={paused}>{paused ? 'Resume motion' : 'Pause motion'}</button><button onClick={() => { setControls(INITIAL); setPalette('cyan'); setManualQuality(false); setQuality(systemReducedMotion ? 'eco' : 'balanced'); }}>Reset</button></div></article>
        </section>
      </div>
    </main>
  );
}
