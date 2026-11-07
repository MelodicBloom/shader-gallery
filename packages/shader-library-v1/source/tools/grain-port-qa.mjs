import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
const route = "/library-v1/ports/grain/";
const portRoot = path.join(repositoryRoot, route);
const output = process.env.GRAIN_QA_OUTPUT || fs.mkdtempSync(path.join(os.tmpdir(), "grain-port-qa-"));
fs.mkdirSync(output, { recursive: true });
const mime = { ".html": "text/html", ".mjs": "text/javascript", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".json": "application/json", ".glsl": "text/plain" };
const server = http.createServer((req, res) => {
  const candidate = path.resolve(repositoryRoot, `.${decodeURIComponent(new URL(req.url, "http://localhost").pathname)}`);
  if (!candidate.startsWith(repositoryRoot + path.sep)) return res.writeHead(403).end();
  const file = fs.existsSync(candidate) && fs.statSync(candidate).isDirectory() ? path.join(candidate, "index.html") : candidate;
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) return res.writeHead(404).end();
  res.setHeader("Content-Type", mime[path.extname(file)] || "application/octet-stream");
  fs.createReadStream(file).pipe(res);
});
await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${server.address().port}${route}`;
let browser;
const checks = [];
const receipt = {
  schemaVersion: 1, checkedAt: new Date().toISOString(),
  revision: execFileSync("git", ["rev-parse", "HEAD"], { cwd: repositoryRoot, encoding: "utf8" }).trim(),
  dirty: Boolean(execFileSync("git", ["status", "--porcelain", "--untracked-files=normal"], { cwd: repositoryRoot, encoding: "utf8" }).trim()),
  route, browser: null, checks,
  limits: ["Chromium software renderer only; no hardware GPU or real device", "No cross-backend pixel equivalence or cross-driver determinism", "No human material acceptance, deployed-route, calibration, physical-accuracy, accessibility-compliance, or performance certification"]
};
function digestTree(root) {
  const hash = createHash("sha256");
  function visit(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name < b.name ? -1 : 1)) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) visit(file);
      else hash.update(path.relative(root, file)).update("\0").update(fs.readFileSync(file)).update("\0");
    }
  }
  visit(root);
  return hash.digest("hex");
}
receipt.generatedPortSha256 = digestTree(portRoot);
receipt.canonicalPortSha256 = digestTree(path.join(repositoryRoot, "packages/shader-library-v1/source/ports/grain"));
assert.equal(receipt.generatedPortSha256, receipt.canonicalPortSha256, "Generated port must match canonical source");

try {
  browser = await chromium.launch({
    headless: true,
    ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}),
    args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"]
  });
  receipt.browser = browser.version();
  for (const viewport of [{ width: 1440, height: 1100 }, { width: 390, height: 844 }]) {
    const context = await browser.newContext({ viewport, deviceScaleFactor: 1, reducedMotion: "reduce" });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
    await page.goto(base, { waitUntil: "networkidle" });
    await page.waitForSelector('html[data-svg="ready"][data-webgl="ready"]');
    assert.equal(await page.title(), "Grain — SVG ↔ GLSL Comparison");
    assert.equal(await page.locator("h1").innerText(), "One surface.\nTwo ways to make it.");
    const layout = await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth - innerWidth, canvas: document.querySelector("canvas").getBoundingClientRect().toJSON() }));
    assert.ok(layout.overflow <= 1, "No horizontal overflow");
    assert.ok(layout.canvas.width > 100, "Visible, nonzero swatch");

    // Inspect actual raster output from independently constructed SVG/GL renderers.
    const pixels = await page.evaluate(async () => {
      const { parameters, BASE_RGB, SIZE } = await import("./contract.mjs");
      const { svgMarkup } = await import("./contract.mjs");
      const { createGrainRenderer } = await import("./renderer.mjs");
      const source = await (await fetch("./shader.glsl")).text();
      const canvas = document.createElement("canvas");
      const renderer = createGrainRenderer(canvas, source);
      const raster = document.createElement("canvas");
      raster.width = raster.height = SIZE;
      const ctx = raster.getContext("2d", { willReadFrequently: true });
      const hash = async bytes => Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))).map(x => x.toString(16).padStart(2, "0")).join("");
      async function svgPixels(p) {
        const image = new Image();
        image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgMarkup(p))}`;
        await image.decode();
        ctx.clearRect(0, 0, SIZE, SIZE);
        ctx.drawImage(image, 0, 0);
        return ctx.getImageData(0, 0, SIZE, SIZE).data;
      }
      function changed(a, b) { let count = 0; for (let i = 0; i < a.length; i += 4) if (a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2]) count++; return count; }
      function zeroError(bytes) { let max = 0; for (let i = 0; i < bytes.length; i++) max = Math.max(max, Math.abs(bytes[i] - (i % 4 === 3 ? 255 : BASE_RGB[i % 4]))); return max; }
      const p = parameters();
      renderer.render(p);
      const glDefault = renderer.readPixels();
      renderer.render(p);
      const glRepeat = renderer.readPixels();
      const svgDefault = await svgPixels(p);
      const svgRepeat = await svgPixels(p);
      renderer.render({ ...p, strength: 0 });
      const glZero = renderer.readPixels();
      const svgZero = await svgPixels({ ...p, strength: 0 });
      const sensitivity = {};
      for (const [key, value] of Object.entries({ strength: 0.3, frequency: 0.05, octaves: 1, seed: 8 })) {
        const variant = { ...p, [key]: value };
        renderer.render(variant);
        sensitivity[key] = { glsl: changed(glDefault, renderer.readPixels()), svg: changed(svgDefault, await svgPixels(variant)) };
      }
      const gl = canvas.getContext("webgl2");
      const ext = gl.getExtension("WEBGL_debug_renderer_info");
      const driver = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
      const result = {
        driver, glslHash: await hash(glDefault), svgHash: await hash(svgDefault),
        glslRepeatHash: await hash(glRepeat), svgRepeatHash: await hash(svgRepeat),
        zeroMaxError: { glsl: zeroError(glZero), svg: zeroError(svgZero) },
        nonzeroChangedPixels: { glsl: changed(glZero, glDefault), svg: changed(svgZero, svgDefault) },
        spatialVariation: { glsl: new Set(glDefault.filter((_, i) => i % 4 === 0)).size, svg: new Set(svgDefault.filter((_, i) => i % 4 === 0)).size },
        sensitivity
      };
      renderer.dispose();
      return result;
    });
    assert.equal(pixels.glslHash, pixels.glslRepeatHash, "GLSL repeats");
    assert.equal(pixels.svgHash, pixels.svgRepeatHash, "SVG repeats");
    for (const backend of ["glsl", "svg"]) {
      assert.equal(pixels.zeroMaxError[backend], 0, `${backend} zero-strength exact base RGBA`);
      assert.ok(pixels.nonzeroChangedPixels[backend] > 1000, `${backend} nonzero effect`);
      assert.ok(pixels.spatialVariation[backend] > 8, `${backend} spatial variation`);
      for (const key of Object.keys(pixels.sensitivity)) assert.ok(pixels.sensitivity[key][backend] > 1000, `${backend} ${key} sensitivity`);
    }
    const check = { viewport, reducedMotion: true, pageIdentity: "pass", layout: "pass", pixels, controls: "pending", contextRecovery: "pending", consoleErrors: errors };
    checks.push(check);
    // Keyboard input exercises the actual shared controls, with a rendered change.
    const before = await page.locator("#gl-preview").screenshot();
    await page.locator("#strength").focus();
    await page.keyboard.press("ArrowRight");
    assert.equal(await page.locator("#strength").inputValue(), "0.66");
    assert.equal(await page.locator("#strength-value").textContent(), "0.66");
    assert.notDeepEqual(await page.locator("#gl-preview").screenshot(), before);
    await page.locator("#seed").fill("8");
    await page.waitForFunction(() => document.querySelector("#svg-status").textContent.includes("seed 8"));
    const validSource = await page.locator("#svg-preview").getAttribute("src");
    await page.locator("#seed").fill("-1");
    assert.match(await page.locator("#input-status").textContent(), /seed must/);
    assert.equal(await page.locator("#svg-preview").getAttribute("src"), validSource);
    await page.locator("#reset").click();
    assert.equal(await page.locator("#seed").inputValue(), "7");
    assert.equal(await page.locator("#strength").inputValue(), "0.65");
    await page.waitForFunction(() => document.querySelector("#svg-status").textContent.includes("seed 7"));
    check.controls = "pass";
    await page.screenshot({ path: path.join(output, `grain-${viewport.width}.png`), fullPage: true });
    // Real context loss and restoration, followed by another control change.
    const loss = await page.evaluateHandle(() => document.querySelector("canvas").getContext("webgl2").getExtension("WEBGL_lose_context"));
    await loss.evaluate(extension => extension.loseContext());
    await page.waitForSelector('html[data-webgl="unavailable"]');
    assert.equal(await page.locator("#gl-fallback").isVisible(), true);
    await page.locator("#seed").fill("9");
    await page.waitForFunction(() => document.querySelector("#svg-status").textContent.includes("seed 9"));
    await loss.evaluate(extension => extension.restoreContext());
    await page.waitForSelector('html[data-webgl="ready"]');
    await page.locator("#reset").click();
    await page.waitForFunction(() => document.querySelector("#svg-status").textContent.includes("seed 7"));
    await loss.dispose();
    assert.deepEqual(errors, [], "No browser console or runtime errors");
    check.contextRecovery = "pass";
    console.log(`PASS grain ${viewport.width}×${viewport.height}: pixels, controls, layout, fallback/recovery`);
    await context.close();
  }
  const fallbackPage = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await fallbackPage.goto(`${base}?webgl=off`, { waitUntil: "networkidle" });
  await fallbackPage.waitForSelector('html[data-svg="ready"][data-webgl="unavailable"]');
  assert.equal(await fallbackPage.locator("#gl-preview").isVisible(), false);
  await fallbackPage.locator("#seed").fill("10");
  await fallbackPage.waitForFunction(() => document.querySelector("#svg-status").textContent.includes("seed 10"));
  await fallbackPage.screenshot({ path: path.join(output, "grain-fallback.png"), fullPage: true });
  checks.push({ forcedFallback: "pass", nativeSVGControls: "pass" });
  receipt.result = "pass";
} catch (error) {
  receipt.result = "fail";
  receipt.error = error.stack;
  throw error;
} finally {
  fs.writeFileSync(path.join(output, "receipt.json"), JSON.stringify(receipt, null, 2) + "\n");
  console.log(`Evidence: ${output}`);
  if (browser) await browser.close();
  await new Promise(resolve => server.close(resolve));
}
