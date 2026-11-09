/**
 * Real browser WebGL2 run for HELIOS RELAY.
 * Launches system Chrome, compiles the page, saves screenshots and measurements.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT = "/workspace";
const OUT = path.join(ROOT, "artifacts");
const SHOTS = path.join(OUT, "screenshots");
const PORT = 8747;
const CDP = 9333;
fs.mkdirSync(SHOTS, { recursive: true });

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitFor(url, tries = 40, asJson = true) {
  let last = "";
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return asJson ? await res.json() : await res.text();
      last = String(res.status);
    } catch (err) {
      last = String(err);
    }
    await sleep(250);
  }
  throw new Error("Timed out waiting for " + url + " " + last);
}

const server = spawn("python3", ["-m", "http.server", String(PORT), "--bind", "127.0.0.1"], {
  cwd: ROOT,
  stdio: ["ignore", "pipe", "pipe"]
});

const chrome = spawn("google-chrome", [
  "--headless=new",
  "--no-sandbox",
  "--disable-dev-shm-usage",
  "--use-gl=angle",
  "--use-angle=swiftshader",
  "--enable-unsafe-swiftshader",
  "--enable-webgl",
  "--ignore-gpu-blocklist",
  `--remote-debugging-port=${CDP}`,
  "--user-data-dir=/tmp/helios-chrome-gl",
  "--window-size=1280,800",
  "--hide-scrollbars",
  "--force-color-profile=srgb",
  "about:blank"
], { stdio: ["ignore", "pipe", "pipe"] });

let chromeLog = "";
chrome.stderr.on("data", (d) => { chromeLog += d.toString(); });

function shutdown() {
  try { chrome.kill("SIGKILL"); } catch { /* gone */ }
  try { server.kill("SIGKILL"); } catch { /* gone */ }
}

const pending = new Map();
let ws;
let nextId = 0;

function send(method, params = {}, sessionId) {
  const id = ++nextId;
  const payload = { id, method, params };
  if (sessionId) payload.sessionId = sessionId;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify(payload));
  });
}

try {
  await waitFor(`http://127.0.0.1:${PORT}/index.html`, 40, false);
  const version = await waitFor(`http://127.0.0.1:${CDP}/json/version`);
  ws = new WebSocket(version.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve);
    ws.addEventListener("error", () => reject(new Error("CDP socket failed")));
  });
  ws.addEventListener("message", (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(JSON.stringify(msg.error)));
      else resolve(msg.result);
    }
  });

  const target = await send("Target.createTarget", { url: "about:blank" });
  const session = await send("Target.attachToTarget", { targetId: target.targetId, flatten: true });
  const sessionId = session.sessionId;
  await send("Page.enable", {}, sessionId);
  await send("Runtime.enable", {}, sessionId);
  await send("Emulation.setDeviceMetricsOverride", {
    width: 960,
    height: 640,
    deviceScaleFactor: 1,
    mobile: false
  }, sessionId);

  const url = `http://127.0.0.1:${PORT}/index.html?dpr=1&play=0`;
  await send("Page.navigate", { url }, sessionId);
  let ready = null;
  for (let i = 0; i < 40; i++) {
    await sleep(250);
    const ev = await send("Runtime.evaluate", {
      expression: "({ready: document.body && document.body.dataset.ready, error: document.getElementById('error') && document.getElementById('error').textContent, helios: !!(window.HELIOS && window.HELIOS.ready)})",
      returnByValue: true
    }, sessionId);
    ready = ev.result.value;
    if (ready && (ready.ready === "1" || ready.ready === "0")) break;
  }
  fs.writeFileSync(path.join(OUT, "boot.json"), JSON.stringify({ ready, chromeTail: chromeLog.slice(-2000) }, null, 2));
  if (!ready || ready.ready !== "1") {
    console.log("BOOT_FAIL", JSON.stringify(ready));
    console.log(chromeLog.slice(-1500));
    shutdown();
    process.exit(2);
  }

  async function evalJson(expression, timeout = 120000) {
    const ev = await send("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
      timeout
    }, sessionId);
    if (ev.exceptionDetails) {
      throw new Error(JSON.stringify(ev.exceptionDetails).slice(0, 2000));
    }
    return ev.result.value;
  }

  const quick = process.argv.includes("--quick");
  const info = await evalJson("({compile: HELIOS.compileInfo, gl: HELIOS.glInfo(), state: HELIOS.getState(), buffer: {w: view.width, h: view.height}})");
  console.log("COMPILE", JSON.stringify(info.compile));
  console.log("GL", JSON.stringify(info.gl));
  console.log("BUFFER", info.buffer.w, info.buffer.h);

  if (process.argv.includes("--probe")) {
    async function benchAt(label, width, height, warmup, frames) {
      await send("Emulation.setDeviceMetricsOverride", {
        width, height, deviceScaleFactor: 1, mobile: height > width
      }, sessionId);
      await evalJson("new Promise(r => requestAnimationFrame(() => { HELIOS.resize(); HELIOS.setPlaying(false); HELIOS.setState({a:0.45,e:0.55,yaw:0,t:1.5,steps:64,glow:1}); r(); }))");
      const result = await evalJson(`HELIOS.bench(${warmup}, ${frames})`);
      console.log("PROBE", label, JSON.stringify({ cpu: result.cpu, raf: result.raf, gpu: result.gpu, buffer: result.buffer }));
    }
    await benchAt("390x844", 390, 844, 30, 40);
    await benchAt("1280x720", 1280, 720, 30, 40);
    shutdown();
    process.exit(0);
  }

  if (quick) {
    console.log("QUICK_SELFTEST");
    const report = await evalJson("HELIOS.selfTest()");
    fs.writeFileSync(path.join(OUT, "selftest.json"), JSON.stringify(report, null, 2));
    console.log("SELFTEST", report.pass, "/", report.pass + report.fail);
    for (const c of report.checks) {
      if (!c.pass) console.log("FAIL", c.name, JSON.stringify(c.detail).slice(0, 500));
    }
    shutdown();
    process.exit(report.fail ? 1 : 0);
  }

  async function saveShot(name, setup) {
    if (setup) await evalJson(setup);
    await evalJson("HELIOS.renderOnce()");
    const data = await evalJson("HELIOS.snapshot()");
    const buf = Buffer.from(data.split(",")[1], "base64");
    const file = path.join(SHOTS, name + ".png");
    fs.writeFileSync(file, buf);
    console.log("SHOT", name, buf.length);
  }

  await saveShot("default", "HELIOS.setState({a:0.45,e:0.55,yaw:0,t:0,steps:64,glow:1})");
  await saveShot("closed", "HELIOS.setState({a:0,e:0.55,yaw:0,t:0,steps:64,glow:1})");
  await saveShot("open", "HELIOS.setState({a:1,e:0.7,yaw:0,t:0,steps:64,glow:1})");
  await saveShot("phase-00", "HELIOS.setState({a:0.45,e:0.85,yaw:0,t:0,steps:64,glow:1})");
  await saveShot("phase-25", "HELIOS.setState({a:0.45,e:0.85,yaw:0,t:3,steps:64,glow:1})");
  await saveShot("phase-50", "HELIOS.setState({a:0.45,e:0.85,yaw:0,t:6,steps:64,glow:1})");
  await saveShot("phase-75", "HELIOS.setState({a:0.45,e:0.85,yaw:0,t:9,steps:64,glow:1})");
  await saveShot("glow-off", "HELIOS.setState({a:0.45,e:0.55,yaw:0.35,t:1.2,steps:64,glow:0})");
  await saveShot("hero", "HELIOS.setState({a:0.62,e:0.9,yaw:0.45,t:1.7,steps:64,glow:1})");

  const pageShot = await send("Page.captureScreenshot", { format: "png" }, sessionId);
  fs.writeFileSync(path.join(SHOTS, "ui-960x640.png"), Buffer.from(pageShot.data, "base64"));
  console.log("SHOT ui");

  console.log("SELFTEST_START");
  let report = null;
  try {
    report = await evalJson("HELIOS.selfTest()");
    fs.writeFileSync(path.join(OUT, "selftest.json"), JSON.stringify(report, null, 2));
    console.log("SELFTEST", report.pass, "/", report.pass + report.fail);
    for (const c of report.checks) {
      if (!c.pass) console.log("FAIL", c.name, JSON.stringify(c.detail).slice(0, 700));
      else console.log("PASS", c.name);
    }
  } catch (err) {
    fs.writeFileSync(path.join(OUT, "selftest-error.txt"), String(err.stack || err));
    console.log("SELFTEST_THROW", String(err).slice(0, 800));
  }

  await send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true
  }, sessionId);
  await evalJson("new Promise(r => requestAnimationFrame(() => { HELIOS.resize(); r(); }))");
  const portrait = await send("Page.captureScreenshot", { format: "png" }, sessionId);
  fs.writeFileSync(path.join(SHOTS, "ui-portrait.png"), Buffer.from(portrait.data, "base64"));
  const portraitBuf = await evalJson("({w:view.width,h:view.height,css:[view.clientWidth,view.clientHeight]})");
  console.log("PORTRAIT", JSON.stringify(portraitBuf));

  await send("Emulation.setDeviceMetricsOverride", {
    width: 1600,
    height: 600,
    deviceScaleFactor: 1,
    mobile: false
  }, sessionId);
  await evalJson("new Promise(r => requestAnimationFrame(() => { HELIOS.resize(); r(); }))");
  const wide = await send("Page.captureScreenshot", { format: "png" }, sessionId);
  fs.writeFileSync(path.join(SHOTS, "ui-ultrawide.png"), Buffer.from(wide.data, "base64"));
  console.log("ULTRAWIDE", JSON.stringify(await evalJson("({w:view.width,h:view.height})")));

  async function benchAt(label, width, height, warmup, frames) {
    await send("Emulation.setDeviceMetricsOverride", {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: height > width
    }, sessionId);
    await evalJson("new Promise(r => requestAnimationFrame(() => { HELIOS.resize(); HELIOS.setPlaying(false); HELIOS.setState({a:0.45,e:0.55,yaw:0,t:1.5,steps:64,glow:1}); r(); }))");
    const result = await evalJson(`HELIOS.bench(${warmup}, ${frames})`);
    const summary = {
      label,
      warmup,
      frames,
      cpu: result.cpu,
      raf: result.raf,
      gpu: result.gpu,
      gpuMissing: result.gpuMissing,
      disjoint: result.disjoint,
      timer: result.timer,
      buffer: result.buffer,
      gl: result.gl
    };
    console.log("BENCH", label, JSON.stringify({ cpu: summary.cpu, raf: summary.raf, gpu: summary.gpu, buffer: summary.buffer }));
    return { summary, samples: result.samples };
  }

  const probe = await benchAt("probe-960", 960, 640, 8, 12);
  const full = true;
  const measured = [probe.summary];
  const sampleRows = [];
  const pushSamples = (label, samples) => {
    if (!samples) return;
    for (let i = 0; i < samples.raf.length; i++) {
      sampleRows.push([label, i, samples.raf[i], samples.cpu[i], samples.gpu[i] ?? ""]);
    }
  };
  pushSamples("probe-960", probe.samples);
  if (full) {
    for (const spec of [
      ["css-390x844", 390, 844],
      ["css-1280x720", 1280, 720]
    ]) {
      const run = await benchAt(spec[0], spec[1], spec[2], 120, 600);
      measured.push(run.summary);
      pushSamples(spec[0], run.samples);
    }
  } else {
    console.log("FULL_BENCH_SKIPPED median", probe.summary.raf && probe.summary.raf.median);
    for (const spec of [
      ["css-390x844-short", 390, 844],
      ["css-1280x720-short", 1280, 720]
    ]) {
      const run = await benchAt(spec[0], spec[1], spec[2], 10, 30);
      measured.push(run.summary);
      pushSamples(spec[0], run.samples);
    }
  }
  fs.writeFileSync(path.join(OUT, "bench-summary.json"), JSON.stringify({ fullProtocol: full, measured }, null, 2));
  fs.writeFileSync(path.join(OUT, "bench-samples.csv"), ["label,index,raf_ms,cpu_submit_ms,gpu_ms", ...sampleRows.map((r) => r.join(","))].join("\n"));

  await send("Emulation.setDeviceMetricsOverride", {
    width: 960,
    height: 640,
    deviceScaleFactor: 1,
    mobile: false
  }, sessionId);
  await send("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-reduced-motion", value: "reduce" }]
  }, sessionId);
  await send("Page.navigate", { url: `http://127.0.0.1:${PORT}/index.html?dpr=1` }, sessionId);
  let reduced = null;
  for (let i = 0; i < 40; i++) {
    await sleep(200);
    const ev = await send("Runtime.evaluate", {
      expression: "window.HELIOS ? ({ready: document.body.dataset.ready, state: HELIOS.getState(), reduced: true}) : null",
      returnByValue: true
    }, sessionId);
    if (ev.result.value && ev.result.value.ready === "1") {
      reduced = ev.result.value;
      break;
    }
  }
  if (reduced) {
    const after = await evalJson("HELIOS.setState({a:0.2,e:0.8,yaw:0.5}); HELIOS.getState()");
    const played = await evalJson("HELIOS.setPlaying(true); HELIOS.getState()");
    await sleep(250);
    const later = await evalJson("HELIOS.getState()");
    reduced = { boot: reduced.state, afterControl: after, played, later };
  }
  fs.writeFileSync(path.join(OUT, "reduced-motion.json"), JSON.stringify(reduced, null, 2));
  console.log("REDUCED", JSON.stringify(reduced));
  const reducedShot = await send("Page.captureScreenshot", { format: "png" }, sessionId);
  fs.writeFileSync(path.join(SHOTS, "ui-reduced-motion.png"), Buffer.from(reducedShot.data, "base64"));

  console.log("DONE_STAGE");
  fs.writeFileSync(path.join(OUT, "stage.txt"), "rendered\n");
} catch (err) {
  console.error("RUN_ERROR", err);
  fs.writeFileSync(path.join(OUT, "run-error.txt"), String(err.stack || err) + "\n" + chromeLog.slice(-2000));
  shutdown();
  process.exit(1);
}

shutdown();
process.exit(0);
