#!/usr/bin/env node
// Downloads the pinned Khronos GLB and refuses it unless SHA-256 matches the pin.
import fs from "node:fs"; import path from "node:path"; import crypto from "node:crypto"; import { fileURLToPath } from "node:url";
import { ASSET } from "./pins.mjs";
const dest = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "assets", "IridescenceAbalone.glb");
const hash = (b) => crypto.createHash("sha256").update(b).digest("hex");
if (fs.existsSync(dest) && hash(fs.readFileSync(dest)) === ASSET.sha256) { console.log(`asset ok (cached) ${ASSET.sha256}`); process.exit(0); }
const res = await fetch(ASSET.url);
if (!res.ok) { console.error(`BLOCKED: asset fetch ${res.status}`); process.exit(2); }
const buf = Buffer.from(await res.arrayBuffer());
if (hash(buf) !== ASSET.sha256) { console.error(`BLOCKED: asset hash mismatch ${hash(buf)}`); process.exit(3); }
fs.mkdirSync(path.dirname(dest), { recursive: true }); fs.writeFileSync(dest, buf);
console.log(`asset ok (downloaded) ${ASSET.sha256}`);
