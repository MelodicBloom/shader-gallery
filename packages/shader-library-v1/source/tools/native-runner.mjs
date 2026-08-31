import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const source = path.join(root, "tools", "glsl-smoke.c");
const libraryModes = new Set(["system", "chromium"]);

function nativeLibraryConfiguration() {
  const mode = process.env.NATIVE_VALIDATOR_LIBRARY_MODE || "system";
  if (!libraryModes.has(mode)) {
    throw new Error(`Unsupported NATIVE_VALIDATOR_LIBRARY_MODE=${JSON.stringify(mode)}. Use "system" (default) or "chromium".`);
  }

  if (mode === "system") {
    return { mode, binary: path.join(os.tmpdir(), "melodicbloom-glsl-smoke-system"), libraries: ["-lEGL", "-lGLESv2"], environment: {} };
  }

  const chromiumDir = process.env.CHROMIUM_LIB_DIR || "/usr/lib/chromium";
  const bundledEgl = path.join(chromiumDir, "libEGL.so");
  const bundledGles = path.join(chromiumDir, "libGLESv2.so");
  if (!fs.existsSync(bundledEgl) || !fs.existsSync(bundledGles)) {
    throw new Error(`Native validator Chromium mode requires libEGL.so and libGLESv2.so in ${chromiumDir}. Use NATIVE_VALIDATOR_LIBRARY_MODE=system for the portable Mesa/EGL path.`);
  }
  return {
    mode,
    binary: path.join(os.tmpdir(), "melodicbloom-glsl-smoke-chromium"),
    libraries: [bundledEgl, bundledGles],
    environment: { LD_LIBRARY_PATH: [chromiumDir, process.env.LD_LIBRARY_PATH].filter(Boolean).join(":") }
  };
}

function commandFailure(label, result, command) {
  const detail = [
    `${label} failed.`,
    `Command: ${command.join(" ")}`,
    `Status: ${result.status ?? "none"}`,
    `Signal: ${result.signal ?? "none"}`,
    result.error ? `Launch error: ${result.error.message}` : "",
    result.stdout?.trim() ? `stdout:\n${result.stdout.trim()}` : "",
    result.stderr?.trim() ? `stderr:\n${result.stderr.trim()}` : ""
  ].filter(Boolean).join("\n");
  return new Error(detail);
}

export function ensureNativeValidator() {
  const configuration = nativeLibraryConfiguration();
  const needsBuild = !fs.existsSync(configuration.binary) || fs.statSync(configuration.binary).mtimeMs < fs.statSync(source).mtimeMs;
  if (!needsBuild) return { binary: configuration.binary, environment: configuration.environment, mode: configuration.mode };

  const command = ["gcc", "-O2", "-o", configuration.binary, source, ...configuration.libraries, "-ldl", "-lpthread", "-lm"];
  const compile = spawnSync(command[0], command.slice(1), { encoding: "utf8" });
  if (compile.status !== 0 || compile.error) {
    throw commandFailure(`Native shader validator build (${configuration.mode} libraries)`, compile, command);
  }
  return { binary: configuration.binary, environment: configuration.environment, mode: configuration.mode };
}

export function uniformArguments(meta, width, height) {
  const definitions = { ...(meta.uniforms || {}), u_time: { type: "float", default: meta.preview?.time ?? 1.2345 }, u_resolution: { type: "vec2", default: [width, height] }, u_mouse: { type: "vec2", default: [0.5, 0.5] } };
  const prefix = { float: "f", int: "i", bool: "b", vec2: "v2", vec3: "v3", vec4: "v4" };
  return Object.entries(definitions).map(([name, definition]) => {
    const value = Array.isArray(definition.default) ? definition.default.join(",") : Number(definition.default);
    return `${prefix[definition.type]}:${name}:${value}`;
  });
}

export function runShader({ entry, meta, width, height, output = "-" }) {
  const validator = ensureNativeValidator();
  const command = [validator.binary, path.join(root, "src/core/fullscreen.vert.glsl"), path.join(root, entry.shader), String(width), String(height), output, ...uniformArguments(meta, width, height)];
  const result = spawnSync(command[0], command.slice(1), { encoding: "utf8", env: { ...process.env, ...validator.environment }, maxBuffer: 10 * 1024 * 1024 });
  if (result.status !== 0 || result.error) {
    throw commandFailure(`Native shader validator run (${validator.mode} libraries)`, result, command);
  }
  return JSON.parse(result.stdout.trim().split("\n").at(-1));
}
