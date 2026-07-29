import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(scriptDir, "..");
const repositoryRoot = path.resolve(packageRoot, "../../..");
const outputRoot = process.env.LIVE_PREVIEW_OUT
  ? path.resolve(process.env.LIVE_PREVIEW_OUT)
  : path.join(repositoryRoot, "library-v1");

function assertSafeOutput() {
  const relative = path.relative(repositoryRoot, outputRoot);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Refusing to write outside the repository: ${outputRoot}`);
  }
  if (path.basename(outputRoot) !== "library-v1") {
    throw new Error(`Expected an output directory named library-v1; received ${outputRoot}`);
  }
}

function copyFile(source, destination) {
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
}

function copyJson(source, destination) {
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  const value = JSON.parse(fs.readFileSync(source, "utf8"));
  fs.writeFileSync(destination, `${JSON.stringify(value, null, 2)}\n`);
}

function requireFile(file) {
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
    throw new Error(`Required live-preview asset is missing: ${file}`);
  }
}

assertSafeOutput();
const manifestPath = path.join(packageRoot, "manifest.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
if (!Array.isArray(manifest.shaders) || manifest.shaders.length !== 15) {
  throw new Error(`Expected exactly 15 manifest entries; received ${manifest.shaders?.length ?? "none"}.`);
}

// Validate all required assets exist before touching the output directory so
// that a missing file (e.g. a preview PNG that has not been generated yet)
// does not leave the output tree in a half-rebuilt state.
for (const file of ["index.html", "app.js", "styles.css"]) {
  requireFile(path.join(packageRoot, "live", file));
}
requireFile(path.join(packageRoot, "src/core/ShaderPlayer.js"));
for (const entry of manifest.shaders) {
  for (const relativePath of [entry.shader, entry.meta, entry.preview]) {
    requireFile(path.join(packageRoot, relativePath));
  }
}

fs.rmSync(outputRoot, { recursive: true, force: true });
fs.mkdirSync(outputRoot, { recursive: true });

for (const file of ["index.html", "app.js", "styles.css"]) {
  copyFile(path.join(packageRoot, "live", file), path.join(outputRoot, file));
}
copyFile(path.join(packageRoot, "src/core/ShaderPlayer.js"), path.join(outputRoot, "runtime/ShaderPlayer.js"));
copyJson(manifestPath, path.join(outputRoot, "manifest.json"));
fs.writeFileSync(path.join(outputRoot, ".nojekyll"), "");

for (const entry of manifest.shaders) {
  for (const relativePath of [entry.shader, entry.meta, entry.preview]) {
    const source = path.join(packageRoot, relativePath);
    const destination = path.join(outputRoot, relativePath);
    if (relativePath.endsWith(".json")) copyJson(source, destination);
    else copyFile(source, destination);
  }
}

const report = {
  schemaVersion: manifest.schemaVersion,
  shaderCount: manifest.shaders.length,
  output: path.relative(repositoryRoot, outputRoot),
  files: 7 + manifest.shaders.length * 3
};
fs.writeFileSync(path.join(outputRoot, "build-report.json"), `${JSON.stringify(report, null, 2)}\n`);
console.log(`Built live Shader Library v1 at ${outputRoot} with ${manifest.shaders.length} shaders.`);
