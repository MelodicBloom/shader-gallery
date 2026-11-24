// Mandala Glass — deterministic procedural glass mandala (three.js, WebGL2).
// No external assets: geometry, backdrop and studio environment are all generated in code.
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import filmPars from './shaders/thinFilm.pars.glsl?raw';
import filmApply from './shaders/thinFilm.apply.glsl?raw';

const TAU = Math.PI * 2;
const qs = new URLSearchParams(location.search);
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches || qs.has('reduced');
const $ = (id) => document.getElementById(id);
const overlay = $('overlay');
const statusEl = $('status');

// ---------- seeded PRNG (mulberry32) — used only at build time, never per frame ----------
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(Number(qs.get('seed') ?? 1708));

// ---------- state ----------
const state = {
  hueSpeed: reducedMotion ? 0.3 : 1,
  dispersion: 0.35, // slider 0..1 → three dispersion 0..5 + thin-film strength
  open: 0.55,
  autoRotate: !reducedMotion,
  material: 'glass', // 'glass' | 'gem'
};
if (qs.has('hue')) state.hueSpeed = +qs.get('hue');
if (qs.has('disp')) state.dispersion = +qs.get('disp');
if (qs.has('open')) state.open = +qs.get('open');
if (qs.has('mat')) state.material = qs.get('mat') === 'gem' ? 'gem' : 'glass';
if (qs.has('rotate')) state.autoRotate = qs.get('rotate') !== '0';
const frozenT = qs.has('t') ? +qs.get('t') : null; // deterministic capture time (seconds)

function showOverlay(html) { overlay.innerHTML = `<div class="card">${html}</div>`; overlay.hidden = false; }
function fallback(reason) {
  showOverlay(`<div class="css-mandala" aria-hidden="true"></div><h2>3D view unavailable</h2>
  <p>This piece needs WebGL2, which ${reason}. Try a current Chrome, Safari or Firefox with hardware acceleration enabled.</p>`);
  window.__mandala = { ready: true, fallback: true, reason };
}

function hasWebGL2() {
  try { const c = document.createElement('canvas'); return !!c.getContext('webgl2'); } catch { return false; }
}

if (qs.has('nowebgl') || !hasWebGL2()) {
  fallback(qs.has('nowebgl') ? 'was disabled for this test (?nowebgl)' : 'is not available in this browser');
} else {
  try { boot(); } catch (err) { console.warn(err); fallback('failed to initialise (' + (err && err.message) + ')'); }
}

function boot() {
  const container = $('app');
  const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance', preserveDrawingBuffer: qs.has('capture') });
  renderer.toneMapping = THREE.NeutralToneMapping; // keeps hue/saturation better than ACES/AgX
  renderer.toneMappingExposure = 0.95;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const BG = new THREE.Color('#f3f1ee');
  scene.background = BG;

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 200);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.minDistance = 9; controls.maxDistance = 48;
  controls.minAzimuthAngle = -1.05; controls.maxAzimuthAngle = 1.05;
  controls.minPolarAngle = 0.55; controls.maxPolarAngle = 2.3;

  // ---------- studio environment (procedural RoomEnvironment → PMREM), no HDR file ----------
  let envRT = null;
  function buildEnv() {
    const pmrem = new THREE.PMREMGenerator(renderer);
    if (envRT) envRT.dispose();
    envRT = pmrem.fromScene(new RoomEnvironment(), 0.03);
    scene.environment = envRT.texture;
    pmrem.dispose();
  }
  buildEnv();
  scene.environmentIntensity = 1.05;
  const key = new THREE.DirectionalLight(0xffffff, 1.5); key.position.set(4, 7, 9); scene.add(key);
  const rim = new THREE.DirectionalLight(0xcfe6ff, 1.2); rim.position.set(-6, -3, 4); scene.add(rim);

  // ---------- procedural backdrop: gives the glass something to refract ----------
  function backdropTexture() {
    const S = 1024, c = document.createElement('canvas'); c.width = c.height = S;
    const g = c.getContext('2d');
    const rg = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S * 0.7);
    rg.addColorStop(0, '#ffffff'); rg.addColorStop(0.55, '#f4f2ef'); rg.addColorStop(1, '#e6e2dd');
    g.fillStyle = rg; g.fillRect(0, 0, S, S);
    // soft contact shadow under the floating mandala
    const sh = g.createRadialGradient(S / 2, S / 2 + 26, S * 0.05, S / 2, S / 2 + 26, S * 0.25);
    sh.addColorStop(0, 'rgba(60,50,80,0.16)'); sh.addColorStop(1, 'rgba(60,50,80,0)');
    g.fillStyle = sh; g.fillRect(0, 0, S, S);
    // faint pastel rays + rings (refraction cues)
    g.translate(S / 2, S / 2);
    const hues = [205, 330, 48, 190, 280, 20];
    for (let i = 0; i < 48; i++) {
      g.save(); g.rotate((i / 48) * TAU);
      g.fillStyle = `hsla(${hues[i % hues.length]},80%,62%,${0.05 + 0.04 * rand()})`;
      g.fillRect(-1.2, S * 0.08, 2.4, S * 0.42); g.restore();
    }
    for (let r = 60; r < S * 0.48; r += 34) {
      g.strokeStyle = `rgba(120,110,160,${0.05 + 0.03 * rand()})`; g.lineWidth = 1.2;
      g.beginPath(); g.arc(0, 0, r, 0, TAU); g.stroke();
    }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    return t;
  }
  const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(34, 34), new THREE.MeshBasicMaterial({ map: backdropTexture() }));
  backdrop.position.z = -3.2; scene.add(backdrop);

  // ---------- materials ----------
  const glassMats = []; // all transmissive materials that respond to dispersion / material toggle
  // shared uniforms for the hand-written thin-film GLSL layer (src/shaders/thinFilm.*.glsl)
  const film = { uFilm: { value: 0 }, uHue: { value: 0 }, uSpread: { value: 1.2 } };
  function injectFilm(shader) {
    Object.assign(shader.uniforms, film);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\n' + filmPars)
      .replace('#include <opaque_fragment>', filmApply + '\n#include <opaque_fragment>');
  }
  function glass(tint, opts = {}) {
    const m = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0xffffff).lerp(new THREE.Color(tint), opts.body ?? 0.45), metalness: 0, roughness: 0.02, transmission: 1, thickness: opts.thickness ?? 0.7,
      ior: 1.52, attenuationColor: new THREE.Color(tint), attenuationDistance: opts.att ?? 0.9,
      specularIntensity: 1, clearcoat: 0.25, clearcoatRoughness: 0.04, dispersion: 0,
      envMapIntensity: 1.25, side: THREE.FrontSide,
    });
    m.userData.base = { att: opts.att ?? 0.9, tint: new THREE.Color(tint), body: opts.body ?? 0.45 };
    m.onBeforeCompile = injectFilm; m.customProgramCacheKey = () => 'thinfilm-v1';
    glassMats.push(m); return m;
  }
  const gold = new THREE.MeshPhysicalMaterial({ color: new THREE.Color().setRGB(1.0, 0.6, 0.18), metalness: 1, roughness: 0.12, envMapIntensity: 1.1, clearcoat: 0.3, clearcoatRoughness: 0.05 });
  const creamTransmission = 0.3;
  const cream = new THREE.MeshPhysicalMaterial({ color: '#f7e3c0', roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.06, sheen: 0.6, sheenColor: new THREE.Color('#ffd9a0'), sheenRoughness: 0.4, transmission: creamTransmission, thickness: 0.5, attenuationColor: new THREE.Color('#ffcf8a'), attenuationDistance: 1.2, envMapIntensity: 1.0 });
  const coreMat = new THREE.MeshStandardMaterial({ color: '#0a2b33', emissive: new THREE.Color('#3ff4ff'), emissiveIntensity: 3.8, roughness: 0.3 });
  const blueDeep = glass('#0a63ff', { att: 0.2, thickness: 0.9, body: 0.6 });
  const blueSky = glass('#22b0ff', { att: 0.35, thickness: 0.6, body: 0.5 });
  const pinkMat = glass('#ff5aaa', { att: 0.55, thickness: 0.5, body: 0.6 });
  const yellowMat = glass('#ffe02e', { att: 0.6, thickness: 0.45, body: 0.65 });
  const shellMat = glass('#9ff4ff', { att: 1.6, thickness: 0.9, body: 0.15 });

  // ---------- geometry helpers ----------
  function faceted(geo) { const g = geo.index ? geo.toNonIndexed() : geo; g.computeVertexNormals(); return g; }
  function petalGeo(w, L, depth, bevel, seg) {
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    s.bezierCurveTo(w * 0.95, L * 0.22, w * 0.62, L * 0.82, 0, L);
    s.bezierCurveTo(-w * 0.62, L * 0.82, -w * 0.95, L * 0.22, 0, 0);
    const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel * 0.9, bevelSegments: 1, curveSegments: seg });
    g.translate(0, 0, -depth / 2);
    return faceted(g);
  }
  function rhombGeo(w, h, depth, bevel) {
    const s = new THREE.Shape(); s.moveTo(0, -h); s.lineTo(w, 0); s.lineTo(0, h); s.lineTo(-w, 0); s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 1 });
    g.translate(0, 0, -depth / 2); return faceted(g);
  }
  function brilliantGeo(r) {
    const pts = [new THREE.Vector2(0, -r * 1.05), new THREE.Vector2(r, 0), new THREE.Vector2(r, r * 0.08), new THREE.Vector2(r * 0.62, r * 0.5), new THREE.Vector2(0, r * 0.5)];
    return faceted(new THREE.LatheGeometry(pts, 8));
  }

  const mandala = new THREE.Group(); scene.add(mandala);
  const ringOf = (n, radius, geo, matFn, tiltBase, phase = 0) => {
    const items = [];
    for (let i = 0; i < n; i++) {
      const spin = new THREE.Group(); spin.rotation.z = (i / n) * TAU + phase;
      const pivot = new THREE.Group(); pivot.position.y = radius; spin.add(pivot);
      const mesh = new THREE.Mesh(geo, matFn(i)); pivot.add(mesh);
      mandala.add(spin); items.push({ pivot, tiltBase });
    }
    return items;
  };

  // core: emissive cyan heart inside a faceted glass shell
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.34, 2), coreMat); mandala.add(core);
  const shell = new THREE.Mesh(faceted(new THREE.IcosahedronGeometry(0.6, 0)), shellMat); mandala.add(shell);
  const coreLight = new THREE.PointLight('#5ff6ff', 1.5, 3, 2); mandala.add(coreLight);

  // fine gold circles
  const circle = (r, tube) => { const m = new THREE.Mesh(new THREE.TorusGeometry(r, tube, 8, 128), gold); mandala.add(m); return m; };
  circle(0.68, 0.025); circle(1.3, 0.035); circle(2.78, 0.03);

  // cream lotus (two offset rings)
  const lotusIn = ringOf(8, 0.55, petalGeo(0.36, 0.85, 0.05, 0.05, 12), () => cream, 1.0);
  const lotusOut = ringOf(8, 0.62, petalGeo(0.44, 1.12, 0.05, 0.05, 12), () => cream, 0.75, TAU / 16);
  // blue glass petals (deep + sky, offset)
  const blueA = ringOf(12, 1.32, petalGeo(0.62, 1.55, 0.14, 0.11, 5), () => blueDeep, 0.42);
  const blueB = ringOf(12, 1.36, petalGeo(0.38, 1.12, 0.12, 0.09, 5), () => blueSky, 0.62, TAU / 24);
  const petalSets = [[lotusIn, 1.0], [lotusOut, 0.75], [blueA, 0.45], [blueB, 0.62]];

  // gold filigree octagonal ring: two octagons 22.5° apart form a 16-point star, plus beads & loops
  const oct1 = new THREE.Mesh(new THREE.TorusGeometry(3.08, 0.11, 6, 8), gold); oct1.rotation.z = TAU / 16; mandala.add(oct1);
  const oct2 = new THREE.Mesh(new THREE.TorusGeometry(3.08, 0.05, 6, 8), gold); mandala.add(oct2);
  const beadGeo = new THREE.SphereGeometry(0.07, 16, 12);
  const beads = new THREE.InstancedMesh(beadGeo, gold, 40); const m4 = new THREE.Matrix4();
  for (let i = 0; i < 40; i++) { const a = (i / 40) * TAU; m4.makeTranslation(Math.cos(a) * 2.9, Math.sin(a) * 2.9, 0); beads.setMatrixAt(i, m4); }
  mandala.add(beads);
  const loopGeo = new THREE.TorusGeometry(0.2, 0.028, 6, 32, TAU * 0.82);
  const ringletGeo = new THREE.TorusGeometry(0.12, 0.026, 6, 24);
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * TAU + TAU / 32; // octagon vertices
    const r = i % 2 ? 3.08 : 3.08 / Math.cos(TAU / 16) * 0.985;
    const v = new THREE.Mesh(ringletGeo, gold); v.position.set(Math.cos(a) * r, Math.sin(a) * r, 0.02); mandala.add(v);
    const l = new THREE.Mesh(loopGeo, gold); const rl = 3.48; l.position.set(Math.cos(a) * rl, Math.sin(a) * rl, 0); l.rotation.z = a + Math.PI * 0.6; mandala.add(l);
  }

  // pink / yellow glass tiles (outer)
  ringOf(16, 3.95, rhombGeo(0.3, 0.52, 0.1, 0.07), (i) => (i % 2 ? yellowMat : pinkMat), 0, TAU / 32);
  ringOf(16, 4.62, rhombGeo(0.17, 0.3, 0.08, 0.05), (i) => (i % 2 ? pinkMat : yellowMat), 0);

  // satellite gems: brilliant cut, hue cycle pink → purple → blue
  const gems = [];
  const gemGeo = brilliantGeo(0.3);
  for (let i = 0; i < 8; i++) {
    const m = glass('#c04bff', { att: 0.3, thickness: 0.6, body: 0 }); m.userData.gem = true; m.emissive = new THREE.Color('#c04bff');
    const mesh = new THREE.Mesh(gemGeo, m);
    mesh.userData.tilt = (rand() - 0.5) * 0.6; mesh.userData.bob = rand() * TAU;
    scene.add(mesh); gems.push(mesh);
  }

  // ---------- post: bloom only above HDR threshold (core + spec glints), white bg stays below ----------
  const composerRT = new THREE.WebGLRenderTarget(2, 2, { type: THREE.HalfFloatType, samples: 4 });
  const composer = new EffectComposer(renderer, composerRT);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.55, 0.35, 1.5); // above backdrop (1.0) and lit cream lotus; core + emissive gems + hot spec only
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  // ---------- adaptive quality ----------
  const LEVELS = [
    { dpr: 2, samples: 4, bloom: true, tScale: 1 },
    { dpr: 1.5, samples: 2, bloom: true, tScale: 0.5 },
    { dpr: 1, samples: 0, bloom: true, tScale: 0.5 },
    { dpr: 0.75, samples: 0, bloom: false, tScale: 0.35 },
    { dpr: 0.75, samples: 0, bloom: false, tScale: 0.35, lite: true }, // last resort: no transmission pass
  ];
  const lockQ = qs.has('q') ? Math.max(0, Math.min(4, +qs.get('q'))) : null;
  const mobile = matchMedia('(pointer: coarse)').matches || Math.min(innerWidth, innerHeight) < 500;
  let qLevel = lockQ ?? (mobile ? 1 : 0);
  function applyQuality() {
    const L = LEVELS[qLevel];
    const dpr = Math.min(window.devicePixelRatio || 1, L.dpr);
    for (const target of [composer.renderTarget1, composer.renderTarget2]) {
      if (target.samples !== L.samples) {
        target.samples = L.samples;
        target.dispose(); // Reallocate even when the target dimensions stay the same.
      }
    }
    renderer.setPixelRatio(dpr); composer.setPixelRatio(dpr);
    bloom.enabled = L.bloom;
    renderer.transmissionResolutionScale = L.tScale;
    const lite = !!L.lite;
    cream.transmission = lite ? 0 : creamTransmission;
    for (const m of glassMats) if ((m.transmission === 0) !== lite) { m.transmission = lite ? 0 : 1; m.transparent = lite; m.opacity = lite ? 0.8 : 1; m.needsUpdate = true; }
    resize();
    statusEl.textContent = `quality ${qLevel} · dpr ${dpr.toFixed(2)}${L.bloom ? '' : ' · bloom off'}${L.lite ? ' · lite glass' : ''}`;
  }

  function resize() {
    const w = container.clientWidth || innerWidth, h = container.clientHeight || innerHeight;
    renderer.setSize(w, h, false); composer.setSize(w, h);
    bloom.resolution.set(w / 2, h / 2);
    camera.aspect = w / h;
    const portrait = w / h < 0.8;
    const R = portrait ? 5.0 : 5.6;
    const tanH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const dist = R / (tanH * Math.min(1, camera.aspect));
    if (!resize.done) { camera.position.set(0, 0.9, dist); resize.done = true; resize.home = dist; }
    else { camera.position.setLength(dist * camera.position.length() / resize.home); resize.home = dist; }
    controls.target.set(0, portrait ? -1.1 : 0, 0);
    controls.maxDistance = Math.max(48, dist * 1.6);
    camera.updateProjectionMatrix();
  }
  addEventListener('resize', () => resize());

  // ---------- material mode / dispersion ----------
  function applyMaterial() {
    const gem = state.material === 'gem';
    for (const m of glassMats) {
      m.ior = gem ? 2.05 : 1.52;
      m.dispersion = state.dispersion * 5 * (gem ? 1.6 : 1); // live uniform; three bumps program version only when crossing 0
      m.attenuationDistance = m.userData.base.att * (gem ? 0.45 : 1);
      m.roughness = gem ? 0.0 : 0.02;
    }
    film.uFilm.value = state.dispersion * (gem ? 0.9 : 0.6);
    film.uSpread.value = gem ? 2.4 : 1.2;
  }
  applyMaterial();

  // ---------- animation (pure function of time + state) ----------
  const tmp = new THREE.Color();
  let motionT = 0, hueT = 0;
  function animate(t, dt) {
    if (frozenT !== null) { motionT = state.autoRotate ? t : 0; hueT = t * state.hueSpeed; }
    else { if (state.autoRotate) motionT += dt; hueT += dt * state.hueSpeed; }
    const mt = reducedMotion ? 0 : motionT;
    mandala.rotation.z = (mt / 60) * TAU;
    mandala.rotation.y = 0.22 * Math.sin((mt / 24) * TAU);
    mandala.rotation.x = -0.12 + 0.08 * Math.sin((mt / 12) * TAU);
    const breathe = reducedMotion ? 0 : 0.05 * Math.sin((t / 12) * TAU);
    const open = THREE.MathUtils.clamp(state.open + breathe, 0, 1);
    for (const [set, k] of petalSets) for (const p of set) p.pivot.rotation.x = open * k - 0.05;
    const pulse = 1 + (reducedMotion ? 0 : 0.12 * Math.sin((t / 3) * TAU));
    const gemMode = state.material === 'gem';
    // Glass mode: bloom emphasis on the cyan core. Gem mode: core dims, gemstones glow.
    coreMat.emissiveIntensity = (gemMode ? 1.0 : 2.6) * pulse; coreLight.intensity = (gemMode ? 0.6 : 1.5) * pulse;
    const P = hueT / 6; // hue phase: one cycle per 6 s at 1×
    film.uHue.value = P;
    // petal/tile tints drift with the hue clock: subtle in Glass, strong in Gem
    const amp = gemMode ? 0.2 : 0.03;
    for (let j = 0; j < glassMats.length; j++) {
      const m = glassMats[j]; if (m.userData.gem) continue;
      const b = m.userData.base;
      tmp.copy(b.tint).offsetHSL(amp * Math.sin((P + j * 0.17) * TAU), 0, 0);
      m.attenuationColor.copy(tmp); m.color.setRGB(1, 1, 1).lerp(tmp, b.body);
    }
    shell.rotation.set(mt * 0.2, mt * 0.31, 0);
    for (let i = 0; i < gems.length; i++) {
      const g = gems[i], a = (i / gems.length) * TAU + (mt / 40) * TAU;
      g.position.set(Math.cos(a) * 5.15, Math.sin(a) * 5.15, 0.35 * Math.sin((mt / 8) * TAU + g.userData.bob));
      g.rotation.set(Math.PI / 2 + g.userData.tilt, (mt / 6) * TAU + i, 0);
      // hue: pink (0.92) → purple (0.78) → blue (0.62) and back, phase-offset per gem
      // Glass: pink→purple→blue band. Gem: full spectrum cycle.
      const h = gemMode ? (((P + i / gems.length) % 1) + 1) % 1 : 0.77 + 0.15 * Math.cos((P + i / gems.length) * TAU);
      tmp.setHSL(h, 0.9, 0.55); g.material.attenuationColor.copy(tmp); g.material.color.setRGB(1, 1, 1).lerp(tmp, 0.45);
      g.material.emissive.copy(tmp);
      g.material.emissiveIntensity = (gemMode ? 3.2 : 1.0) * (1 + 0.3 * Math.sin((P * 2 + i / 4) * TAU));
    }
  }

  // ---------- loop + instrumentation ----------
  let running = true, lost = false, last = performance.now(); const start = last;
  let frameId;
  const deltas = [], cpu = []; let frames = 0, slowWin = [], cooldown = 0;
  function frame(now) {
    if (!running) return;
    frameId = requestAnimationFrame(frame);
    const dt = Math.min(0.1, (now - last) / 1000); deltas.push(now - last); last = now;
    if (deltas.length > 2000) deltas.shift();
    const t = frozenT ?? (now - start) / 1000;
    const c0 = performance.now();
    animate(t, dt);
    controls.update();
    composer.render();
    cpu.push(performance.now() - c0); if (cpu.length > 2000) cpu.shift();
    frames++;
    // adaptive: after warm-up, step quality down if median frame interval > 40 ms over 90 frames
    if (lockQ === null && frames > 60) {
      slowWin.push(now - (frame.prev ?? now)); if (slowWin.length > 90) slowWin.shift();
      if (cooldown > 0) cooldown--;
      else if (slowWin.length === 90 && qLevel < 4) {
        const s = [...slowWin].sort((a, b) => a - b)[45];
        if (s > 40) { qLevel++; applyQuality(); cooldown = 120; slowWin = []; }
      }
    }
    frame.prev = now;
    if (frames === 3) window.__mandala.ready = true;
  }

  // ---------- context loss / restore ----------
  const canvas = renderer.domElement;
  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault(); lost = true; running = false;
    cancelAnimationFrame(frameId);
    showOverlay('<h2>Restoring graphics…</h2><p>The GPU context was lost (driver reset or memory pressure). It will resume automatically.</p>');
    window.__mandala.contextLost = (window.__mandala.contextLost || 0) + 1;
  });
  canvas.addEventListener('webglcontextrestored', () => {
    if (!lost) return;
    buildEnv(); // PMREM render target content does not survive a context loss
    if (qLevel < 2 && lockQ === null) { qLevel++; } // be conservative after a reset
    applyQuality();
    overlay.hidden = true; lost = false; running = true; last = performance.now();
    frameId = requestAnimationFrame(frame);
    window.__mandala.contextRestored = (window.__mandala.contextRestored || 0) + 1;
  });

  // ---------- UI ----------
  const bind = (id, out, key, fmt) => {
    const el = $(id), o = $(out); el.value = state[key]; o.textContent = fmt(state[key]);
    el.addEventListener('input', () => { state[key] = +el.value; o.textContent = fmt(state[key]); if (key === 'dispersion') applyMaterial(); });
  };
  bind('hue', 'hueOut', 'hueSpeed', (v) => v.toFixed(2) + '×');
  bind('disp', 'dispOut', 'dispersion', (v) => v.toFixed(2));
  bind('open', 'openOut', 'open', (v) => v.toFixed(2));
  const rot = $('rotate'); rot.checked = state.autoRotate; rot.addEventListener('change', () => (state.autoRotate = rot.checked));
  const setMat = (mode) => { state.material = mode; $('matGlass').setAttribute('aria-checked', mode === 'glass'); $('matGem').setAttribute('aria-checked', mode === 'gem'); applyMaterial(); };
  $('matGlass').onclick = () => setMat('glass'); $('matGem').onclick = () => setMat('gem'); setMat(state.material);
  $('resetView').onclick = () => { resize.done = false; resize(); controls.update(); };
  const panel = $('panel'), tog = $('panelToggle');
  const setCollapsed = (c) => { panel.classList.toggle('collapsed', c); tog.setAttribute('aria-expanded', !c); };
  setCollapsed(qs.has('panel') ? qs.get('panel') === '0' : innerWidth < 640);
  tog.onclick = () => setCollapsed(!panel.classList.contains('collapsed'));

  const pct = (a, p) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
  window.__mandala = {
    ready: false, fallback: false, state,
    get quality() { return qLevel; }, get frames() { return frames; },
    renderer: () => ({ gl: renderer.getContext().getParameter(renderer.getContext().VERSION), calls: renderer.info.render.calls, tris: renderer.info.render.triangles }),
    async bench(warm = 60, n = 300) {
      const f0 = frames; while (frames < f0 + warm) await new Promise(requestAnimationFrame);
      deltas.length = 0; cpu.length = 0; const f1 = frames;
      while (frames < f1 + n) await new Promise(requestAnimationFrame);
      const d = deltas.slice(-n), c = cpu.slice(-n);
      return { n: d.length, rafMedian: pct(d, 0.5), rafP95: pct(d, 0.95), cpuMedian: pct(c, 0.5), cpuP95: pct(c, 0.95), quality: qLevel };
    },
    loseContext() { const ext = renderer.getContext().getExtension('WEBGL_lose_context'); ext.loseContext(); return ext; },
    get lost() { return lost; },
  };
  applyQuality();
  frameId = requestAnimationFrame(frame);
}
