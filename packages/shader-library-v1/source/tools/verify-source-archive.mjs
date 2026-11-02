import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const sourceRoot = path.resolve(scriptDir, "..");
const repositoryRoot = path.resolve(sourceRoot, "../../..");
const archivePath = path.join(repositoryRoot, "packages/shader-library-v1/melodicbloom-shader-library-v1-source.zip");

function listFiles(root, current = root) {
  return fs.readdirSync(current, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(current, entry.name);
    if (entry.isDirectory()) return listFiles(root, absolute);
    if (!entry.isFile()) return [];
    return [path.relative(root, absolute).split(path.sep).join("/")];
  });
}

function readArchiveMember(member) {
  return execFileSync("unzip", ["-p", archivePath, member]);
}

assert.ok(fs.existsSync(archivePath), `Missing source archive: ${archivePath}`);

const sourceFiles = listFiles(sourceRoot).sort();
const archiveFiles = execFileSync("unzip", ["-Z1", archivePath], { encoding: "utf8" })
  .trim()
  .split(/\r?\n/)
  .filter((member) => member && !member.endsWith("/"))
  .sort();

assert.deepEqual(
  archiveFiles,
  sourceFiles,
  "The distributable source archive must contain exactly the current source files. Regenerate it from packages/shader-library-v1/source/."
);

for (const relativePath of sourceFiles) {
  const source = fs.readFileSync(path.join(sourceRoot, relativePath));
  assert.deepEqual(readArchiveMember(relativePath), source, `Archive member differs from source: ${relativePath}`);
}

const manifest = JSON.parse(fs.readFileSync(path.join(sourceRoot, "manifest.json"), "utf8"));
assert.ok(Array.isArray(manifest.shaders) && manifest.shaders.length > 0, "Source manifest must contain shader entries.");
for (const entry of manifest.shaders) {
  assert.ok(archiveFiles.includes(entry.shader), `Archive is missing manifest shader: ${entry.shader}`);
  assert.ok(archiveFiles.includes(entry.meta), `Archive is missing manifest metadata: ${entry.meta}`);
}

console.log(`✓ source archive matches ${sourceFiles.length} source files and ${manifest.shaders.length} manifest shaders`);
