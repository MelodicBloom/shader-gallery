import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const binary = path.join(os.tmpdir(), "melodicbloom-glsl-smoke");
const source = path.join(root, "tools", "glsl-smoke.c");

export function ensureNativeValidator() {
  const needsBuild = !fs.existsSync(binary) || fs.statSync(binary).mtimeMs < fs.statSync(source).mtimeMs;
  if (!needsBuild) return binary;
  const chromiumDir = process.env.CHROMIUM_LIB_DIR || "/usr/lib/chromium";
  const bundledEgl = path.join(chromiumDir, "libEGL.so");
  const bundledGles = path.join(chromiumDir, "libGLESv2.so");
  const libraries = fs.existsSync(bundledEgl) && fs.existsSync(bundledGles) ? [bundledEgl,bundledGles] : ["-lEGL","-lGLESv2"];
  const compile = spawnSync("gcc",["-O2","-o",binary,source,...libraries,"-ldl","-lpthread","-lm"],{ encoding:"utf8" });
  if (compile.status !== 0) throw new Error(`Native shader validator build failed:\n${compile.stdout}\n${compile.stderr}`);
  return binary;
}

export function uniformArguments(meta,width,height) {
  const definitions = { ...(meta.uniforms || {}), u_time:{type:"float",default:meta.preview?.time ?? 1.2345}, u_resolution:{type:"vec2",default:[width,height]}, u_mouse:{type:"vec2",default:[0.5,0.5]} };
  const prefix = { float:"f", int:"i", bool:"b", vec2:"v2", vec3:"v3", vec4:"v4" };
  return Object.entries(definitions).map(([name,definition]) => {
    const value = Array.isArray(definition.default) ? definition.default.join(",") : Number(definition.default);
    return `${prefix[definition.type]}:${name}:${value}`;
  });
}

export function runShader({ entry,meta,width,height,output="-" }) {
  const executable = ensureNativeValidator();
  const chromiumDir = process.env.CHROMIUM_LIB_DIR || "/usr/lib/chromium";
  const environment = { ...process.env };
  if (fs.existsSync(path.join(chromiumDir,"libEGL.so"))) environment.LD_LIBRARY_PATH = [chromiumDir,process.env.LD_LIBRARY_PATH].filter(Boolean).join(":");
  const result = spawnSync(executable,[path.join(root,"src/core/fullscreen.vert.glsl"),path.join(root,entry.shader),String(width),String(height),output,...uniformArguments(meta,width,height)],{ encoding:"utf8",env:environment,maxBuffer:10*1024*1024 });
  if (result.status !== 0) throw new Error([result.stdout,result.stderr].filter(Boolean).join("\n").trim());
  return JSON.parse(result.stdout.trim().split("\n").at(-1));
}
