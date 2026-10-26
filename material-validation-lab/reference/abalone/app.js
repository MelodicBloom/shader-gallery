// MVT-ABALONE-001 isolated Three.js reference lane. No gallery dependency.
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

export const ASSET_SHA256 = "d15ab000d3b04f177e101b2a36aacbf1c99490fc9bfe3868d481d75736946bab";
export const FIXTURES = {
  neutral: { polar: 20, azimuth: 45, exposure: 0 },
  grazing: { polar: 75, azimuth: 45, exposure: 0 },
  "light-sweep": { polar: 20, azimuth: 180, exposure: 0, sweep: [0, 90, 180, 270] },
};
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const $ = (id) => document.getElementById(id);
const state = { mode: "treatment", mapSource: "asset", geometry: "shell", polar: 20, azimuth: 45, iridescence: 1, tmin: 600, tmax: 800, exposure: 0 };
const api = { ready: false, error: null, state };
window.__mvt = api;

function fallback(reason) {
  api.error = reason;
  $("view").hidden = true; $("fallback").hidden = false;
  $("runtime").textContent = `Live view unavailable (${reason}). Showing recorded static capture.`;
}

async function sha256(buf) {
  const d = await crypto.subtle.digest("SHA-256", buf);
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function main() {
  const canvas = $("view");
  const gl = canvas.getContext("webgl2", { preserveDrawingBuffer: true, antialias: false });
  if (!gl) return fallback("WebGL2 not available");
  const renderer = new THREE.WebGLRenderer({ canvas, context: gl });
  renderer.setPixelRatio(1);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const dbg = gl.getExtension("WEBGL_debug_renderer_info");
  api.environment = {
    three: THREE.REVISION,
    userAgent: navigator.userAgent,
    glVersion: gl.getParameter(gl.VERSION),
    glslVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
    vendor: dbg ? gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR),
    renderer: dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
  };
  $("runtime").textContent = `WebGL2 · three r${THREE.REVISION} · ${api.environment.renderer}`;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0c0f14);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  const key = new THREE.DirectionalLight(0xffffff, 2.0);
  scene.add(key);
  const camera = new THREE.PerspectiveCamera(35, canvas.width / canvas.height, 0.01, 100);

  const res = await fetch("./assets/IridescenceAbalone.glb");
  if (!res.ok) return fallback(`asset missing (${res.status}); run npm run fetch-asset`);
  const buf = await res.arrayBuffer();
  const hash = await sha256(buf);
  api.assetSha256 = hash;
  if (hash !== ASSET_SHA256) return fallback("asset hash mismatch — refusing unpinned asset");
  const gltf = await new GLTFLoader().parseAsync(buf, "./assets/");
  let mesh; gltf.scene.traverse((o) => { if (o.isMesh && !mesh) mesh = o; });
  scene.add(gltf.scene);

  const box = new THREE.Box3().setFromObject(gltf.scene);
  const center = box.getCenter(new THREE.Vector3());
  const radius = box.getSize(new THREE.Vector3()).length() / 2;

  const treatment = mesh.material;
  const authored = {
    iridescence: treatment.iridescence,
    range: [...treatment.iridescenceThicknessRange],
    iridescenceMap: treatment.iridescenceMap, thicknessMap: treatment.iridescenceThicknessMap,
  };
  state.tmin = authored.range[0]; state.tmax = authored.range[1]; state.iridescence = authored.iridescence;
  const control = treatment.clone();
  control.iridescence = 0; control.iridescenceMap = null; control.iridescenceThicknessMap = null;
  const rOnly = treatment.clone(); rOnly.iridescenceThicknessMap = null;
  const gOnly = treatment.clone(); gOnly.iridescenceMap = null;
  const materials = { treatment, control, "r-only": rOnly, "g-only": gOnly };

  // Synthetic isolated R/G test maps (authored in-repo by tools/make-synthetic-maps.mjs), packed like the asset map.
  const loadTex = async (file) => { const t = await new THREE.TextureLoader().loadAsync(`./assets/synthetic/${file}`);
    t.colorSpace = THREE.NoColorSpace; t.flipY = false; t.needsUpdate = true; return t; };
  const mapSources = {
    asset: authored.iridescenceMap,
    "synth-r": await loadTex("r-gradient-const-g.png"),
    "synth-g": await loadTex("g-gradient-const-r.png"),
    "synth-g-r1": await loadTex("g-gradient-const-r1.png"),
  };
  // C-09 sensitivity fixture (pre-registered in receipts/BUILD_HANDOFF-MVT-ABALONE-001-C09.md): flat plane, UV 0..1,
  // metalness 1, roughness 0 (metalness/roughness/normal maps removed so the overrides take effect), thickness 600-800 nm.
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(radius * 1.2, radius * 1.2));
  plane.position.copy(center); plane.visible = false; scene.add(plane);
  const sens = (m) => { const c = m.clone(); c.metalness = 1.0; c.roughness = 0.0; c.metalnessMap = null; c.roughnessMap = null; c.normalMap = null; c.side = THREE.DoubleSide; return c; };
  const planeMaterials = { treatment: sens(treatment), control: sens(control), "r-only": sens(rOnly), "g-only": sens(gOnly) };
  planeMaterials.control.iridescence = 0; planeMaterials.control.iridescenceMap = null; planeMaterials.control.iridescenceThicknessMap = null;
  let appliedSource = "asset";
  function applyMapSource() {
    if (state.mapSource === appliedSource) return;
    const iMap = mapSources[state.mapSource];
    const gMap = state.mapSource === "asset" ? authored.thicknessMap : iMap;
    treatment.iridescenceMap = iMap; treatment.iridescenceThicknessMap = gMap;
    rOnly.iridescenceMap = iMap; gOnly.iridescenceThicknessMap = gMap;
    const pm = planeMaterials; pm.treatment.iridescenceMap = iMap; pm.treatment.iridescenceThicknessMap = gMap;
    pm["r-only"].iridescenceMap = iMap; pm["r-only"].iridescenceThicknessMap = null; pm["g-only"].iridescenceMap = null; pm["g-only"].iridescenceThicknessMap = gMap;
    for (const m of [treatment, rOnly, gOnly, pm.treatment, pm["r-only"], pm["g-only"]]) m.needsUpdate = true;
    appliedSource = state.mapSource;
    drawChannels(iMap?.image);
  }
  api.synthMapReceipt = Object.fromEntries(["synth-r", "synth-g", "synth-g-r1"].map((k) => [k, { colorSpace: mapSources[k].colorSpace, flipY: mapSources[k].flipY }]));

  api.mapReceipt = {
    iridescenceMap: { present: !!authored.iridescenceMap, colorSpace: authored.iridescenceMap?.colorSpace, channel: "R" },
    iridescenceThicknessMap: { present: !!authored.thicknessMap, colorSpace: authored.thicknessMap?.colorSpace, channel: "G" },
    sameTexture: authored.iridescenceMap === authored.thicknessMap,
    authoredIridescence: authored.iridescence, authoredThicknessRangeNm: authored.range,
    noColorSpaceConstant: THREE.NoColorSpace,
  };
  drawChannels(authored.iridescenceMap?.image);

  function apply() {
    applyMapSource();
    const onPlane = state.geometry === "plane";
    gltf.scene.visible = !onPlane; plane.visible = onPlane;
    mesh.material = materials[state.mode]; plane.material = planeMaterials[state.mode];
    for (const mat of [treatment, rOnly, gOnly, planeMaterials.treatment, planeMaterials["r-only"], planeMaterials["g-only"]]) {
      mat.iridescence = state.iridescence;
      mat.iridescenceThicknessRange = [state.tmin, state.tmax];
    }
    control.iridescence = 0; planeMaterials.control.iridescence = 0;
    renderer.toneMappingExposure = Math.pow(2, state.exposure);
    const p = THREE.MathUtils.degToRad(state.polar);
    camera.position.set(center.x, center.y + Math.sin(p) * radius * 3, center.z + Math.cos(p) * radius * 3);
    camera.lookAt(center);
    const a = THREE.MathUtils.degToRad(state.azimuth);
    key.position.set(center.x + Math.cos(a) * radius * 4, center.y + radius * 2, center.z + Math.sin(a) * radius * 4);
    key.target.position.copy(center); key.target.updateMatrixWorld();
    renderer.render(scene, camera);
    syncUI();
  }
  function read() {
    const w = gl.drawingBufferWidth, h = gl.drawingBufferHeight, px = new Uint8Array(w * h * 4);
    gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px);
    return px;
  }
  // Diff restricted to shell pixels (mask = control pixels that differ from the background clear colour).
  let mask = null;
  function buildMask(ctrl) { const bg = [12, 15, 20]; mask = new Uint8Array(ctrl.length / 4); for (let i = 0, j = 0; i < ctrl.length; i += 4, j++) mask[j] = (Math.abs(ctrl[i]-bg[0]) + Math.abs(ctrl[i+1]-bg[1]) + Math.abs(ctrl[i+2]-bg[2])) > 6 ? 1 : 0; }
  function meanAbsDiff(a, b) { let s = 0, n = 0, big = 0; for (let i = 0, j = 0; i < a.length; i += 4, j++) { if (mask && !mask[j]) continue; const d = (Math.abs(a[i]-b[i]) + Math.abs(a[i+1]-b[i+1]) + Math.abs(a[i+2]-b[i+2])) / 3; s += d; n++; if (d > 8) big++; } return { mean: +(s / n).toFixed(3), fractionOver8: +(big / n).toFixed(4), pixels: n }; }

  api.set = (patch) => { Object.assign(state, patch); apply(); return { ...state }; };
  api.fixture = (name) => { const f = FIXTURES[name]; api.set({ polar: f.polar, azimuth: f.azimuth, exposure: f.exposure }); };
  // Pixel-difference outcomes per fixture (machine metric, not perceptual review).
  api.measure = (name, mapSource = "asset", geometry = "shell") => {
    api.set({ mapSource, geometry });
    api.fixture(name);
    const shots = {};
    for (const mode of Object.keys(materials)) { api.set({ mode }); shots[mode] = read(); }
    api.set({ mode: "treatment" });
    buildMask(shots.control);
    const out = {
      treatmentVsControl: meanAbsDiff(shots.treatment, shots.control),
      treatmentVsROnly: meanAbsDiff(shots.treatment, shots["r-only"]),
      treatmentVsGOnly: meanAbsDiff(shots.treatment, shots["g-only"]),
      rOnlyVsGOnly: meanAbsDiff(shots["r-only"], shots["g-only"]),
    };
    if (FIXTURES[name].sweep) {
      out.sweep = FIXTURES[name].sweep.map((azimuth) => {
        api.set({ azimuth, mode: "treatment" }); const t = read();
        api.set({ mode: "control" }); const c = read(); buildMask(c);
        return { azimuth, treatmentVsControl: meanAbsDiff(t, c) };
      });
      api.fixture(name); api.set({ mode: "treatment" });
    }
    return out;
  };
  // Label-inert UV/mask diagnostic (pre-registered in receipts/BUILD_HANDOFF-MVT-ABALONE-001-UVDIAG.md). Never touches metrics or labels.
  const uvMat = new THREE.RawShaderMaterial({ glslVersion: THREE.GLSL3, uniforms: { synth: { value: null } },
    vertexShader: `in vec3 position; in vec2 uv; uniform mat4 modelViewMatrix; uniform mat4 projectionMatrix; out vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `precision highp float; uniform sampler2D synth; in vec2 vUv; out vec4 o;
      void main() { o = vec4(clamp(vUv, 0.0, 1.0), texture(synth, vUv).r, 1.0); }`, toneMapped: false });
  api.uvDiag = (name) => {
    api.set({ mapSource: "synth-r", geometry: "shell" }); api.fixture(name);
    api.set({ mode: "control" }); buildMask(read());
    const tex = mapSources["synth-r"]; uvMat.uniforms.synth.value = tex;
    const prevBg = scene.background, prevMat = mesh.material, prevTM = renderer.toneMapping;
    scene.background = new THREE.Color(0, 0, 0); mesh.material = uvMat; renderer.toneMapping = THREE.NoToneMapping;
    renderer.render(scene, camera); const px = read();
    scene.background = prevBg; mesh.material = prevMat; renderer.toneMapping = prevTM; api.set({ mode: "treatment" });
    const u = [], v = [], r = []; let n = 0, covered = 0;
    for (let i = 0, j = 0; i < px.length; i += 4, j++) { if (!mask[j]) continue; n++; if (px[i + 3] !== 255) continue; covered++; u.push(px[i] / 255); v.push(px[i + 1] / 255); r.push(px[i + 2] / 255); }
    return { maskPixelCount: n, frameW: gl.drawingBufferWidth, frameH: gl.drawingBufferHeight, coveredMaskPixels: covered,
      uvAttribute: !!mesh.geometry.attributes.uv, iridescenceMapChannel: tex.channel, textureWrap: [tex.wrapS, tex.wrapT], u, v, r };
  };
  api.materialState = () => {
    const m = state.geometry === "plane" ? plane.material : mesh.material;
    return { geometry: state.geometry, mode: state.mode, iridescence: m.iridescence, iridescenceThicknessRangeNm: [...m.iridescenceThicknessRange],
      mapSource: state.mapSource, iridescenceMap: !!m.iridescenceMap, iridescenceThicknessMap: !!m.iridescenceThicknessMap, metalness: m.metalness, roughness: m.roughness };
  };
  api.cameraPosition = () => camera.position.toArray();
  api.lightPosition = () => key.position.toArray();

  // UI wiring
  const ids = ["polar", "azimuth", "iridescence", "tmin", "tmax", "exposure"];
  function syncUI() { document.querySelectorAll("input[name=mapSource]").forEach((r) => { r.checked = r.value === state.mapSource; }); document.querySelectorAll("input[name=geometry]").forEach((r) => { r.checked = r.value === state.geometry; }); for (const k of ids) { $(k).value = state[k]; $("o-" + k).textContent = state[k]; } }
  for (const k of ids) $(k).addEventListener("input", (e) => api.set({ [k]: Number(e.target.value) }));
  document.querySelectorAll("input[name=mode]").forEach((r) => r.addEventListener("change", (e) => api.set({ mode: e.target.value })));
  document.querySelectorAll("input[name=geometry]").forEach((r) => r.addEventListener("change", (e) => api.set({ geometry: e.target.value })));
  document.querySelectorAll("input[name=mapSource]").forEach((r) => r.addEventListener("change", (e) => api.set({ mapSource: e.target.value })));
  document.querySelectorAll("[data-fixture]").forEach((b) => b.addEventListener("click", () => api.fixture(b.dataset.fixture)));
  let raf = 0;
  $("sweep").addEventListener("click", () => {
    if (reduceMotion) return;
    if (raf) { cancelAnimationFrame(raf); raf = 0; return; }
    const tick = () => { api.set({ azimuth: (state.azimuth + 1) % 360 }); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
  });
  canvas.addEventListener("webglcontextlost", (e) => { e.preventDefault(); fallback("WebGL context lost"); });
  apply();
  api.ready = true;
}

function drawChannels(img) {
  if (!img) return;
  for (const [id, ch] of [["ch-r", 0], ["ch-g", 1]]) {
    const c = $(id), x = c.getContext("2d", { colorSpace: "srgb" });
    x.drawImage(img, 0, 0, c.width, c.height);
    const d = x.getImageData(0, 0, c.width, c.height);
    for (let i = 0; i < d.data.length; i += 4) { const v = d.data[i + ch]; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; }
    x.putImageData(d, 0, 0);
  }
}

fetch("./receipts/receipt.json").then((r) => r.ok ? r.json() : null).then((r) => {
  $("status-label").textContent = r ? `Result: ${r.label} — ${r.labelReason}` : "Result: no receipt recorded yet";
}).catch(() => { $("status-label").textContent = "Result: no receipt recorded yet"; });

main().catch((e) => fallback(String(e?.message || e)));
