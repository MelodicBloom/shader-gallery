import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const scriptDir = path.dirname(scriptPath);
const defaultPackageRoot = path.resolve(scriptDir, "..");
const defaultRepositoryRoot = path.resolve(defaultPackageRoot, "../../..");
const defaultOutputRoot = process.env.LIVE_PREVIEW_OUT
  ? path.resolve(process.env.LIVE_PREVIEW_OUT)
  : path.join(defaultRepositoryRoot, "library-v1");

function assertContainedPath(repositoryRoot, target, label) {
  const relative = path.relative(repositoryRoot, target);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Refusing to use ${label} outside the repository: ${target}`);
  }
}

function assertSafeOutput(repositoryRoot, outputRoot) {
  assertContainedPath(repositoryRoot, outputRoot, "an output path");
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

function validateRequiredAssets(packageRoot, manifest) {
  for (const file of ["index.html", "app.js", "styles.css"]) {
    requireFile(path.join(packageRoot, "live", file));
  }
  requireFile(path.join(packageRoot, "src/core/ShaderPlayer.js"));
  for (const entry of manifest.shaders) {
    for (const relativePath of [entry.shader, entry.meta, entry.preview]) {
      requireFile(path.join(packageRoot, relativePath));
    }
  }
}

function writePreviewTree({ packageRoot, outputRoot, manifest, reportOutput }) {
  fs.mkdirSync(outputRoot, { recursive: true });

  for (const file of ["index.html", "app.js", "styles.css"]) {
    copyFile(path.join(packageRoot, "live", file), path.join(outputRoot, file));
  }
  copyFile(path.join(packageRoot, "src/core/ShaderPlayer.js"), path.join(outputRoot, "runtime/ShaderPlayer.js"));
  copyJson(path.join(packageRoot, "manifest.json"), path.join(outputRoot, "manifest.json"));
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
    output: reportOutput,
    files: 7 + manifest.shaders.length * 3
  };
  fs.writeFileSync(path.join(outputRoot, "build-report.json"), `${JSON.stringify(report, null, 2)}\n`);
}

function replaceOutputTree({ outputRoot, stagingRoot, backupRoot, logger }) {
  let backupCreated = false;

  try {
    if (fs.existsSync(outputRoot)) {
      fs.renameSync(outputRoot, backupRoot);
      backupCreated = true;
    }
    fs.renameSync(stagingRoot, outputRoot);
  } catch (error) {
    if (!fs.existsSync(outputRoot) && backupCreated && fs.existsSync(backupRoot)) {
      fs.renameSync(backupRoot, outputRoot);
    }
    throw error;
  } finally {
    if (fs.existsSync(stagingRoot)) fs.rmSync(stagingRoot, { recursive: true, force: true });
  }

  if (backupCreated && fs.existsSync(backupRoot)) {
    try {
      fs.rmSync(backupRoot, { recursive: true, force: true });
    } catch (error) {
      logger.warn(`Built preview successfully, but could not remove backup ${backupRoot}: ${error.message}`);
    }
  }
}

export function buildLivePreview({
  packageRoot = defaultPackageRoot,
  repositoryRoot = defaultRepositoryRoot,
  outputRoot = defaultOutputRoot,
  logger = console
} = {}) {
  packageRoot = path.resolve(packageRoot);
  repositoryRoot = path.resolve(repositoryRoot);
  outputRoot = path.resolve(outputRoot);

  assertSafeOutput(repositoryRoot, outputRoot);
  const manifestPath = path.join(packageRoot, "manifest.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  if (!Array.isArray(manifest.shaders) || manifest.shaders.length !== 15) {
    throw new Error(`Expected exactly 15 manifest entries; received ${manifest.shaders?.length ?? "none"}.`);
  }

  validateRequiredAssets(packageRoot, manifest);

  const outputParent = path.dirname(outputRoot);
  fs.mkdirSync(outputParent, { recursive: true });
  const stagingRoot = fs.mkdtempSync(path.join(outputParent, ".library-v1-stage-"));
  const backupRoot = path.join(outputParent, `.library-v1-backup-${process.pid}-${Date.now()}`);
  assertContainedPath(repositoryRoot, stagingRoot, "a staging path");
  assertContainedPath(repositoryRoot, backupRoot, "a backup path");

  try {
    writePreviewTree({
      packageRoot,
      outputRoot: stagingRoot,
      manifest,
      reportOutput: path.relative(repositoryRoot, outputRoot)
    });
    replaceOutputTree({ outputRoot, stagingRoot, backupRoot, logger });
  } catch (error) {
    if (fs.existsSync(stagingRoot)) fs.rmSync(stagingRoot, { recursive: true, force: true });
    throw error;
  }

  logger.log(`Built live Shader Library v1 at ${outputRoot} with ${manifest.shaders.length} shaders.`);
  return { outputRoot, shaderCount: manifest.shaders.length };
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  buildLivePreview();
}
