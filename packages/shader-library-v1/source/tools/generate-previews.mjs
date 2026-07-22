import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { runShader } from "./native-runner.mjs";
import { rgbaToPng } from "./png.mjs";

const root = process.cwd();
const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.json"), "utf8"));

for (const entry of manifest.shaders) {
  const meta = JSON.parse(fs.readFileSync(path.join(root, entry.meta), "utf8"));
  const width = meta.preview?.width ?? 512;
  const height = meta.preview?.height ?? 512;
  const rawPath = path.join(os.tmpdir(), `shader-${entry.slug.replaceAll("/", "-")}.rgba`);
  const result = runShader({ entry, meta, width, height, output: rawPath });
  const rgba = fs.readFileSync(rawPath);
  fs.rmSync(rawPath, { force: true });
  fs.writeFileSync(path.join(root, entry.preview), rgbaToPng(rgba, width, height));
  console.log(`✓ ${entry.preview} mean=${result.mean.toFixed(2)}`);
}
