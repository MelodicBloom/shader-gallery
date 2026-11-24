import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
const errs = []; const res = {};
for (const vp of [{width:1280,height:720},{width:390,height:844}]) {
  const p = await b.newPage({ viewport: vp }); p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type()==='error' && errs.push(m.text()));
  await p.goto('https://mandala-glass.vercel.app/?t=6'); await p.waitForFunction(() => window.__mandala?.frames > 8, null, { timeout: 180000 });
  await p.screenshot({ path: `receipts/live-vercel-${vp.width}.png` });
  res[vp.width] = await p.evaluate(() => ({ q: window.__mandala.quality, fallback: window.__mandala.fallback }));
}
await b.close(); console.log(JSON.stringify({ when: new Date().toString(), res, errs }));
