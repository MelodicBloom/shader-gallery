import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const docs = path.join(root, "docs");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.json"), "utf8"));
const publicManifest = { ...manifest, shaders: [] };

for (const entry of manifest.shaders) {
  const destination = path.join(docs, entry.preview);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(path.join(root, entry.preview), destination);
  publicManifest.shaders.push({ ...entry, preview: entry.preview });
}

fs.writeFileSync(path.join(docs, "manifest.json"), JSON.stringify(publicManifest, null, 2) + "\n");
console.log(`Prepared docs with ${publicManifest.shaders.length} shader previews.`);
