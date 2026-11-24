import { chromium } from 'playwright';
import fs from 'node:fs';
const BASE = process.env.BASE || 'http://localhost:4173/';
const OUT = process.env.OUT || 'receipts';
const TAG = process.env.TAG || 'pass1';
const ONLY = process.env.ONLY || 'all';
fs.mkdirSync(OUT, { recursive: true });
const args = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
const results = { tag: TAG, base: BASE, when: new Date().toString(), shots: [], errors: [], bench: [], sims: {} };
const browser = await chromium.launch({ args });
async function open(url, vp) {
  const page = await browser.newPage({ viewport: vp });
  page.on('console', (m) => { if (m.type() === 'error') results.errors.push(`${url} ${vp.width}: ${m.text()}`); });
  page.on('pageerror', (e) => results.errors.push(`${url} ${vp.width} pageerror: ${e.message}`));
  await page.goto(BASE + url, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__mandala && window.__mandala.ready && (window.__mandala.fallback || window.__mandala.frames > 8), null, { timeout: 120000 });
  return page;
}
const vps = { desktop: { width: 1280, height: 720 }, mobile: { width: 390, height: 844 } };
const states = {
  hero: '?t=6&q=0',
  gem: '?t=14&mat=gem&disp=1.2&open=0.85&q=0',
  closed: '?t=21&open=0.12&panel=1&q=0',
};
if (ONLY === 'all' || ONLY === 'shots') for (const [vn, vp] of Object.entries(vps)) for (const [sn, q] of Object.entries(states)) {
  const page = await open(q, vp);
  const f = `${OUT}/${TAG}-${vn}-${sn}.png`;
  await page.screenshot({ path: f });
  const info = await page.evaluate(() => ({ q: window.__mandala.quality, r: window.__mandala.renderer() }));
  results.shots.push({ file: f, ...info }); await page.close();
}
if (ONLY === 'all' || ONLY === 'bench') for (const [vn, vp] of Object.entries(vps)) {
  for (const q of ['', '?q=2']) {
    const page = await open(q, vp);
    const b = await page.evaluate(() => window.__mandala.bench(60, 300));
    results.bench.push({ viewport: vn, url: q || '(adaptive)', ...b }); await page.close();
  }
}
if (ONLY === 'all' || ONLY === 'sims') {
  // 1. forced no-WebGL fallback
  let page = await open('?nowebgl', vps.mobile);
  await page.screenshot({ path: `${OUT}/${TAG}-sim-nowebgl.png` });
  results.sims.nowebglParam = await page.evaluate(() => ({ fallback: window.__mandala.fallback, overlay: !document.getElementById('overlay').hidden }));
  await page.close();
  // 2. browser launched with WebGL disabled
  const b2 = await chromium.launch({ args: ['--disable-webgl', '--disable-webgl2', '--disable-3d-apis'] });
  const p2 = await b2.newPage({ viewport: vps.desktop });
  await p2.goto(BASE, { waitUntil: 'load' });
  await p2.waitForFunction(() => window.__mandala && window.__mandala.ready, null, { timeout: 30000 });
  results.sims.webglDisabledBrowser = await p2.evaluate(() => ({ fallback: window.__mandala.fallback, reason: window.__mandala.reason }));
  await b2.close();
  // 3. context loss + restore
  page = await open('?t=6&q=0', vps.desktop);
  const r = await page.evaluate(async () => {
    const m = window.__mandala; const ext = m.loseContext();
    await new Promise((r) => setTimeout(r, 300)); const lostSeen = m.lost; const f0 = m.frames;
    ext.restoreContext(); await new Promise((r) => setTimeout(r, 2500));
    return { lostSeen, contextLost: m.contextLost, contextRestored: m.contextRestored, framesAfter: m.frames - f0, quality: m.quality };
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/${TAG}-sim-context-restored.png` });
  results.sims.contextLoss = r;
  // 4. resize desktop → portrait → desktop
  await page.setViewportSize(vps.mobile); await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/${TAG}-sim-resized-portrait.png` });
  await page.setViewportSize({ width: 1600, height: 900 }); await page.waitForTimeout(800);
  results.sims.resize = await page.evaluate(() => { const c = document.querySelector('canvas'); return { canvasCss: [c.clientWidth, c.clientHeight], buffer: [c.width, c.height] }; });
  await page.close();
  // 5. reduced motion
  const ctx = await browser.newContext({ viewport: vps.desktop, reducedMotion: 'reduce' });
  const p5 = await ctx.newPage(); await p5.goto(BASE, { waitUntil: 'load' });
  await p5.waitForFunction(() => window.__mandala && window.__mandala.frames > 8, null, { timeout: 120000 });
  results.sims.reducedMotion = await p5.evaluate(() => ({ autoRotate: window.__mandala.state.autoRotate, hueSpeed: window.__mandala.state.hueSpeed }));
  await ctx.close();
}
await browser.close();
fs.writeFileSync(`${OUT}/${TAG}-qa.json`, JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
