import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { buildLivePreview } from "./build-live-preview.mjs";

const silentLogger = { log() {}, warn() {} };

function write(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

function makeFixture() {
  const repositoryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "shader-live-preview-test-"));
  const packageRoot = path.join(repositoryRoot, "packages/shader-library-v1/source");
  const outputRoot = path.join(repositoryRoot, "library-v1");
  const shaders = [];

  for (let index = 1; index <= 15; index += 1) {
    const id = `shader-${String(index).padStart(2, "0")}`;
    const root = `shaders/${id}`;
    shaders.push({
      id,
      shader: `${root}/shader.glsl`,
      meta: `${root}/meta.json`,
      preview: `${root}/preview.png`
    });
    write(path.join(packageRoot, root, "shader.glsl"), "void main() {}\n");
    write(path.join(packageRoot, root, "meta.json"), `${JSON.stringify({ id })}\n`);
    write(path.join(packageRoot, root, "preview.png"), Buffer.from("89504e470d0a1a0a", "hex"));
  }

  write(path.join(packageRoot, "manifest.json"), `${JSON.stringify({ schemaVersion: 1, shaders }, null, 2)}\n`);
  write(path.join(packageRoot, "live/index.html"), "<!doctype html><title>test</title>\n");
  write(path.join(packageRoot, "live/app.js"), "console.log('test');\n");
  write(path.join(packageRoot, "live/styles.css"), "html {}\n");
  write(path.join(packageRoot, "src/core/ShaderPlayer.js"), "export class ShaderPlayer {}\n");

  return { repositoryRoot, packageRoot, outputRoot, shaders };
}

function assertNoTransactionDebris(repositoryRoot) {
  const debris = fs.readdirSync(repositoryRoot).filter(name =>
    name.startsWith(".library-v1-stage-") || name.startsWith(".library-v1-backup-")
  );
  assert.deepEqual(debris, []);
}

const fixture = makeFixture();
try {
  write(path.join(fixture.outputRoot, "sentinel.txt"), "original\n");

  const missingPreview = path.join(fixture.packageRoot, fixture.shaders[0].preview);
  fs.rmSync(missingPreview);
  assert.throws(
    () => buildLivePreview({ ...fixture, logger: silentLogger }),
    /Required live-preview asset is missing/
  );
  assert.equal(fs.readFileSync(path.join(fixture.outputRoot, "sentinel.txt"), "utf8"), "original\n");
  assertNoTransactionDebris(fixture.repositoryRoot);
  write(missingPreview, Buffer.from("89504e470d0a1a0a", "hex"));

  const malformedMeta = path.join(fixture.packageRoot, fixture.shaders[1].meta);
  write(malformedMeta, "{ invalid json\n");
  assert.throws(
    () => buildLivePreview({ ...fixture, logger: silentLogger }),
    SyntaxError
  );
  assert.equal(fs.readFileSync(path.join(fixture.outputRoot, "sentinel.txt"), "utf8"), "original\n");
  assertNoTransactionDebris(fixture.repositoryRoot);
  write(malformedMeta, `${JSON.stringify({ id: fixture.shaders[1].id })}\n`);

  buildLivePreview({ ...fixture, logger: silentLogger });
  assert.equal(fs.existsSync(path.join(fixture.outputRoot, "sentinel.txt")), false);
  assert.equal(JSON.parse(fs.readFileSync(path.join(fixture.outputRoot, "build-report.json"), "utf8")).shaderCount, 15);
  assert.equal(fs.existsSync(path.join(fixture.outputRoot, fixture.shaders[14].preview)), true);
  assertNoTransactionDebris(fixture.repositoryRoot);

  console.log("✓ live-preview build preserves the previous tree on preflight and staging failures");
} finally {
  fs.rmSync(fixture.repositoryRoot, { recursive: true, force: true });
}
