import { chromium } from 'playwright'; import fs from 'node:fs';
const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
const out = []; const errs = [];
for (const vp of [{width:1280,height:720},{width:390,height:844}]) {
  const p = await b.newPage({ viewport: vp }); p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type()==='error' && errs.push(m.text()));
  await p.goto('http://localhost:4173/?q=4&t=6'); await p.waitForFunction(() => window.__mandala?.frames > 8, null, { timeout: 120000 });
  await p.screenshot({ path: `receipts/final-q4-lite-${vp.width}.png` });
  await p.goto('http://localhost:4173/?q=4'); await p.waitForFunction(() => window.__mandala?.frames > 8, null, { timeout: 120000 });
  out.push({ vp: `${vp.width}x${vp.height}`, ...(await p.evaluate(() => window.__mandala.bench(60, 300))) }); await p.close();
}
await b.close(); const r = { when: new Date().toString(), out, errs };
fs.writeFileSync('receipts/final-q4-bench.json', JSON.stringify(r, null, 2)); console.log(JSON.stringify(r));
