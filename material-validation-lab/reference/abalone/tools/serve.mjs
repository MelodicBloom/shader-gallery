#!/usr/bin/env node
// Zero-dependency static server for the trial page. Usage: npm run serve  -> http://127.0.0.1:4173/ (loopback only)
import http from "node:http"; import fs from "node:fs"; import path from "node:path"; import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const types = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".json": "application/json", ".glb": "model/gltf-binary", ".png": "image/png", ".jpg": "image/jpeg" };
export function start(port = Number(process.env.PORT) || 4173) {
  const server = http.createServer((req, res) => {
    const rel = decodeURIComponent(new URL(req.url, "http://x").pathname);
    const file = path.join(root, rel.endsWith("/") ? rel + "index.html" : rel);
    if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end("not found"); }
    res.writeHead(200, { "content-type": types[path.extname(file)] || "application/octet-stream" });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((r) => server.listen(port, "127.0.0.1", () => r(server))); // loopback only
}
if (process.argv[1] === fileURLToPath(import.meta.url)) start().then((s) => console.log(`MVT-ABALONE-001 trial page: http://127.0.0.1:${s.address().port}/`));
