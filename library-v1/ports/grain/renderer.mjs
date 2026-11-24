import { parameters, BASE_RGB, SIZE } from "./contract.mjs";

/** Owns only this port's WebGL resources; no animation or shared runtime state. */
export function createGrainRenderer(canvas, fragmentSource) {
  canvas.width = canvas.height = SIZE;
  const gl = canvas.getContext("webgl2", { alpha: false, antialias: false, preserveDrawingBuffer: true });
  if (!gl) throw new Error("WebGL2 unavailable. The native SVG reference remains usable.");
  const shaders = [];
  let program, buffer, vao;
  function dispose() {
    if (buffer) gl.deleteBuffer(buffer);
    if (vao) gl.deleteVertexArray(vao);
    if (program) gl.deleteProgram(program);
    for (const shader of shaders) gl.deleteShader(shader);
  }
  function compile(type, source) {
    const shader = gl.createShader(type);
    if (!shader) throw new Error("Could not allocate grain shader.");
    shaders.push(shader);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) || "Grain shader compilation failed.");
    return shader;
  }
  try {
    const vertex = compile(gl.VERTEX_SHADER, `#version 300 es\nin vec2 position;\nvoid main(){gl_Position=vec4(position,0,1);}`);
    const fragment = compile(gl.FRAGMENT_SHADER, fragmentSource);
    program = gl.createProgram();
    if (!program) throw new Error("Could not allocate grain program.");
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.bindAttribLocation(program, 0, "position");
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) || "Grain program link failed.");
    vao = gl.createVertexArray();
    buffer = gl.createBuffer();
    if (!vao || !buffer) throw new Error("Could not allocate grain geometry.");
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    const uniforms = Object.fromEntries(["strength", "frequency", "octaves", "seed", "base"].map(name => [name, gl.getUniformLocation(program, `u_${name}`)]));
    return {
      render(input) {
        const p = parameters(input);
        if (gl.isContextLost()) throw new Error("WebGL context lost. The native SVG reference remains usable.");
        gl.useProgram(program);
        gl.bindVertexArray(vao);
        gl.viewport(0, 0, SIZE, SIZE);
        gl.disable(gl.DITHER);
        gl.uniform1f(uniforms.strength, p.strength);
        gl.uniform1f(uniforms.frequency, p.frequency);
        gl.uniform1i(uniforms.octaves, p.octaves);
        gl.uniform1ui(uniforms.seed, p.seed);
        gl.uniform3f(uniforms.base, ...BASE_RGB.map(value => value / 255));
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        if (gl.getError() !== gl.NO_ERROR) throw new Error("Grain draw failed.");
      },
      readPixels() {
        const pixels = new Uint8Array(SIZE * SIZE * 4);
        gl.readPixels(0, 0, SIZE, SIZE, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
        return pixels;
      },
      dispose
    };
  } catch (error) {
    dispose();
    throw error;
  }
}
