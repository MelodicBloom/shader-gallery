import { OrbitControls, PerformanceMonitor, Sparkles } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { QUALITY, type Quality } from './quality';
import { fragmentShader, vertexShader } from './shaders';

export type MaterialControls = {
  baseColor: string;
  glowColor: string;
  density: number;
  displacement: number;
  fresnel: number;
  speed: number;
};

type SceneProps = {
  controls: MaterialControls;
  quality: Quality;
  paused: boolean;
  reducedMotion: boolean;
  onFps: (fps: number) => void;
  onDecline: () => void;
};

function Coral({ controls, quality, paused, reducedMotion }: Pick<SceneProps, 'controls' | 'quality' | 'paused' | 'reducedMotion'>) {
  const mesh = useRef<THREE.Mesh>(null);
  const material = useRef<THREE.ShaderMaterial>(null);
  const pulse = useRef(0);
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uDensity: { value: controls.density },
    uDisplacement: { value: controls.displacement },
    uFresnel: { value: controls.fresnel },
    uPulse: { value: 0 },
    uBaseColor: { value: new THREE.Color(controls.baseColor) },
    uGlowColor: { value: new THREE.Color(controls.glowColor) },
  }), []);

  useEffect(() => {
    uniforms.uDensity.value = controls.density;
    uniforms.uDisplacement.value = controls.displacement;
    uniforms.uFresnel.value = controls.fresnel;
    uniforms.uBaseColor.value.set(controls.baseColor);
    uniforms.uGlowColor.value.set(controls.glowColor);
  }, [controls, uniforms]);

  useFrame((state, delta) => {
    if (!material.current || !mesh.current) return;
    if (!paused && !reducedMotion) {
      material.current.uniforms.uTime.value += delta * controls.speed;
      mesh.current.rotation.y += delta * 0.055;
      mesh.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.16) * 0.08;
    }
    pulse.current *= 0.93;
    material.current.uniforms.uPulse.value = pulse.current;
  });

  return (
    <mesh
      ref={mesh}
      scale={1.08}
      onPointerDown={event => {
        event.stopPropagation();
        pulse.current = 1;
      }}
    >
      <icosahedronGeometry args={[1.12, QUALITY[quality].detail]} />
      <shaderMaterial
        ref={material}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  );
}

function FrameTelemetry({ onFps }: Pick<SceneProps, 'onFps'>) {
  const elapsed = useRef(0);
  const frames = useRef(0);
  useFrame((_, delta) => {
    elapsed.current += delta;
    frames.current += 1;
    if (elapsed.current >= 0.75) {
      onFps(Math.round(frames.current / elapsed.current));
      elapsed.current = 0;
      frames.current = 0;
    }
  });
  return null;
}

export function BenthicScene(props: SceneProps) {
  const dpr = QUALITY[props.quality].dpr;
  return (
    <div
      className="canvas-shell"
      role="img"
      aria-label="Interactive Three.js coral material rendered through React Three Fiber"
    >
      <Canvas
        camera={{ position: [0, 0, 3.8], fov: 42 }}
        dpr={[dpr[0], dpr[1]]}
        frameloop={props.reducedMotion || props.paused ? 'demand' : 'always'}
        gl={{ antialias: false, powerPreference: 'high-performance', alpha: false }}
        fallback={<div className="fallback">WebGL is required for this R3F study.</div>}
      >
        <color attach="background" args={['#000508']} />
        <fog attach="fog" args={['#000508', 4.2, 7]} />
        <Coral controls={props.controls} quality={props.quality} paused={props.paused} reducedMotion={props.reducedMotion} />
        <Sparkles count={props.quality === 'eco' ? 24 : 52} scale={[5.4, 3.2, 3]} size={1.25} speed={props.reducedMotion ? 0 : 0.16} color={props.controls.glowColor} opacity={0.3} />
        <OrbitControls enablePan={false} minDistance={2.7} maxDistance={5.2} enableDamping={!props.reducedMotion} />
        <FrameTelemetry onFps={props.onFps} />
        <PerformanceMonitor flipflops={2} onDecline={props.onDecline} />
      </Canvas>
    </div>
  );
}
