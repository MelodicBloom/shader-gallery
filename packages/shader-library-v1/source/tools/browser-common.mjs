import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import os from "node:os";

export function startServer(root, port = 4177) {
  const mime = {
    ".html":"text/html; charset=utf-8",
    ".js":"text/javascript; charset=utf-8",
    ".json":"application/json; charset=utf-8",
    ".glsl":"text/plain; charset=utf-8",
    ".png":"image/png"
  };

  const server = http.createServer((request, response) => {
    const urlPath = decodeURIComponent(new URL(request.url, `http://localhost:${port}`).pathname);
    const relative = urlPath === "/" ? "tools/browser-harness.html" : urlPath.replace(/^\/+/, "");
    const file = path.resolve(root, relative);
    if (!file.startsWith(path.resolve(root)) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      response.writeHead(404); response.end("Not found"); return;
    }
    response.setHeader("Content-Type", mime[path.extname(file)] || "application/octet-stream");
    response.end(fs.readFileSync(file));
  });

  return new Promise((resolve) => server.listen(port, "127.0.0.1", () => resolve(server)));
}

export async function withBrowser(callback, port = 4177) {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "shader-gallery-chromium-"));
  const executable = process.env.CHROME_BIN || "/usr/bin/chromium";
  const args = [
    "--headless=new",
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--enable-webgl",
    "--ignore-gpu-blocklist",
    "--enable-unsafe-swiftshader",
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--disable-gpu-sandbox",
    "--remote-debugging-port=9223",
    `--user-data-dir=${profile}`,
    "about:blank"
  ];
  const processHandle = spawn(executable, args, { stdio: ["ignore", "pipe", "pipe"] });

  try {
    const endpoint = await waitForEndpoint();
    const result = await callback(endpoint);
    return result;
  } finally {
    processHandle.kill("SIGTERM");
    await new Promise((resolve) => {
      const timer = setTimeout(resolve, 1500);
      processHandle.once("exit", () => { clearTimeout(timer); resolve(); });
    });
    for (let attempt = 0; attempt < 4; attempt += 1) {
      try { fs.rmSync(profile, { recursive: true, force: true }); break; }
      catch { await new Promise((resolve) => setTimeout(resolve, 200)); }
    }
  }
}

async function waitForEndpoint() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch("http://127.0.0.1:9223/json");
      if (response.ok) {
        const pages = await response.json();
        const page = pages.find((item) => item.type === "page");
        if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
      }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("Chromium DevTools endpoint did not become available.");
}

export async function cdp(webSocketUrl, fn) {
  const socket = new WebSocket(webSocketUrl);
  let id = 0;
  const pending = new Map();

  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });

  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (!message.id || !pending.has(message.id)) return;
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(message.error.message));
    else resolve(message.result);
  });

  function send(method, params = {}) {
    id += 1;
    const current = id;
    socket.send(JSON.stringify({ id: current, method, params }));
    return new Promise((resolve, reject) => pending.set(current, { resolve, reject }));
  }

  try {
    await send("Runtime.enable");
    await send("Page.enable");
    await new Promise((resolve) => setTimeout(resolve, 500));
    return await fn(send);
  } finally {
    socket.close();
  }
}
