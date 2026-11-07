import { DEFAULT_PARAMETERS, parameters, svgMarkup } from "./contract.mjs";
import { createGrainRenderer } from "./renderer.mjs";

const form = document.querySelector("#controls");
const svg = document.querySelector("#svg-preview");
const canvas = document.querySelector("#gl-preview");
const glStatus = document.querySelector("#gl-status");
const fallback = document.querySelector("#gl-fallback");
const inputStatus = document.querySelector("#input-status");
let current = DEFAULT_PARAMETERS;
let renderer = null;

function unavailable(message) {
  canvas.hidden = true;
  fallback.hidden = false;
  glStatus.textContent = message;
  document.documentElement.dataset.webgl = "unavailable";
}

function render() {
  svg.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgMarkup(current))}`;
  for (const key of ["strength", "frequency", "octaves"]) document.querySelector(`#${key}-value`).value = String(current[key]);
  if (renderer) {
    try { renderer.render(current); }
    catch (error) { unavailable(error.message); }
  }
}

svg.addEventListener("load", () => {
  document.querySelector("#svg-status").textContent = `Native SVG · seed ${current.seed}`;
  document.documentElement.dataset.svg = "ready";
});
svg.addEventListener("error", () => {
  document.querySelector("#svg-status").textContent = "SVG render failed. Open the preserved specimen below.";
  document.documentElement.dataset.svg = "failed";
});
form.addEventListener("submit", event => event.preventDefault());
form.addEventListener("input", () => {
  try {
    const input = Object.fromEntries(Object.keys(DEFAULT_PARAMETERS).map(key => [key, form.elements[key].value === "" ? NaN : Number(form.elements[key].value)]));
    current = parameters(input);
    inputStatus.textContent = "";
    render();
  } catch (error) { inputStatus.textContent = error.message; }
});
document.querySelector("#reset").addEventListener("click", () => {
  current = DEFAULT_PARAMETERS;
  for (const [key, value] of Object.entries(current)) form.elements[key].value = String(value);
  inputStatus.textContent = "";
  render();
});
canvas.addEventListener("webglcontextlost", event => {
  event.preventDefault();
  renderer = null;
  unavailable("WebGL context lost. Native SVG remains interactive.");
});
canvas.addEventListener("webglcontextrestored", () => initializeGL());

async function initializeGL() {
  try {
    if (new URL(location.href).searchParams.get("webgl") === "off") throw new Error("GLSL disabled for fallback inspection. Native SVG remains interactive.");
    const response = await fetch(new URL("./shader.glsl", import.meta.url));
    if (!response.ok) throw new Error(`Grain shader request failed (${response.status}).`);
    renderer = createGrainRenderer(canvas, await response.text());
    renderer.render(current);
    canvas.hidden = false;
    fallback.hidden = true;
    glStatus.textContent = "WebGL2 · seeded value noise";
    document.documentElement.dataset.webgl = "ready";
  } catch (error) { unavailable(error.message); }
}
render();
await initializeGL();
