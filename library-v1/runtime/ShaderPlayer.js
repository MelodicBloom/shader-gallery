const DEFAULT_VERTEX_SOURCE = `#version 300 es
precision highp float;

in vec2 a_position;
out vec2 v_uv;

void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const GLSL_TYPES = {
  0x1406: "float",
  0x1404: "int",
  0x8b56: "bool",
  0x8b50: "vec2",
  0x8b51: "vec3",
  0x8b52: "vec4",
  0x8b53: "ivec2",
  0x8b54: "ivec3",
  0x8b55: "ivec4",
  0x8b5a: "mat2",
  0x8b5b: "mat3",
  0x8b5c: "mat4",
  0x8b5e: "sampler2D"
};

function lineNumbered(source) {
  return source
    .split("\n")
    .map((line, index) => `${String(index + 1).padStart(4, " ")} | ${line}`)
    .join("\n");
}

function browserPixelRatio() {
  return typeof window === "undefined" ? 1 : window.devicePixelRatio || 1;
}

function nowSeconds() {
  if (typeof performance !== "undefined" && typeof performance.now === "function") {
    return performance.now() / 1000;
  }
  return Date.now() / 1000;
}

function isShaderPath(value) {
  return /^(https?:|blob:|data:|\/|\.\/|\.\.\/)/.test(value) || value.endsWith(".glsl");
}

async function resolveSource(sourceOrUrl) {
  if (typeof sourceOrUrl !== "string" || sourceOrUrl.trim() === "") {
    throw new TypeError("A non-empty shader source or URL is required.");
  }

  if (!isShaderPath(sourceOrUrl)) {
    return sourceOrUrl;
  }

  const response = await fetch(sourceOrUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch shader ${sourceOrUrl}: ${response.status} ${response.statusText}`);
  }
  return response.text();
}

function normalizeFragmentSource(source) {
  let normalized = source.replace(/\r\n/g, "\n").replace(/\bgl_FragColor\b/g, "outColor");
  const versionMatch = normalized.match(/^\s*#version\s+300\s+es\s*\n?/);
  if (versionMatch) normalized = normalized.slice(versionMatch[0].length);

  const declarations = [];
  if (!/precision\s+(lowp|mediump|highp)\s+float\s*;/.test(normalized)) {
    declarations.push("precision highp float;");
  }
  if (!/\bin\s+vec2\s+v_uv\s*;/.test(normalized)) {
    declarations.push("in vec2 v_uv;");
  }
  if (!/\bout\s+vec4\s+outColor\s*;/.test(normalized)) {
    declarations.push("out vec4 outColor;");
  }
  if (!/\buniform\s+float\s+u_time\s*;/.test(normalized)) {
    declarations.push("uniform float u_time;");
  }
  if (!/\buniform\s+vec2\s+u_resolution\s*;/.test(normalized)) {
    declarations.push("uniform vec2 u_resolution;");
  }
  if (!/\buniform\s+vec2\s+u_mouse\s*;/.test(normalized)) {
    declarations.push("uniform vec2 u_mouse;");
  }

  return `#version 300 es\n${declarations.join("\n")}\n${normalized}`;
}

function compileShader(gl, type, source, label) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error(`Unable to allocate ${label} shader.`);

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader) || "Unknown compile error";
    gl.deleteShader(shader);
    throw new Error(`${label} shader compile failed:\n${log}\n\n${lineNumbered(source)}`);
  }

  return shader;
}

function linkProgram(gl, vertexSource, fragmentSource) {
  const vertex = compileShader(gl, gl.VERTEX_SHADER, vertexSource, "Vertex");
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource, "Fragment");
  const program = gl.createProgram();

  if (!program) {
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    throw new Error("Unable to allocate WebGL program.");
  }

  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.bindAttribLocation(program, 0, "a_position");
  gl.linkProgram(program);

  gl.deleteShader(vertex);
  gl.deleteShader(fragment);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program) || "Unknown link error";
    gl.deleteProgram(program);
    throw new Error(`Program link failed:\n${log}`);
  }

  return program;
}

function createFullscreenQuad(gl) {
  const vao = gl.createVertexArray();
  const buffer = gl.createBuffer();
  if (!vao || !buffer) throw new Error("Unable to allocate fullscreen quad resources.");

  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
    gl.STATIC_DRAW
  );
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  return { vao, buffer };
}

export class ShaderPlayer {
  constructor(canvas, shader, options = {}) {
    if (typeof HTMLCanvasElement === "undefined" || !(canvas instanceof HTMLCanvasElement)) {
      throw new TypeError("ShaderPlayer requires an HTMLCanvasElement.");
    }

    this.canvas = canvas;
    this.shaderSourceOrUrl = shader;
    this.options = {
      pixelRatio: browserPixelRatio(),
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true,
      premultipliedAlpha: false,
      autoResize: true,
      trackPointer: true,
      autoStart: false,
      ...options
    };

    this.gl = null;
    this.program = null;
    this.uniforms = new Map();
    this.values = new Map();
    this.quad = null;
    this.running = false;
    this.raf = null;
    this.startTime = 0;
    this.fixedTime = null;
    this.mouse = [0.5, 0.5];
    this.resizeObserver = null;
    this.abortController = new AbortController();
  }

  async init() {
    this.gl = this.canvas.getContext("webgl2", {
      alpha: this.options.alpha,
      antialias: this.options.antialias,
      preserveDrawingBuffer: this.options.preserveDrawingBuffer,
      premultipliedAlpha: this.options.premultipliedAlpha
    });

    if (!this.gl) {
      throw new Error("WebGL2 is unavailable. Use a WebGL2-capable browser or provide a static preview.");
    }

    this.quad = createFullscreenQuad(this.gl);
    await this.replaceShader(this.shaderSourceOrUrl, { restart: false });
    this.#installObservers();
    this.resize();

    if (this.options.autoStart) this.start();
    return this;
  }

  async replaceShader(shader, { restart = this.running } = {}) {
    this.stop();

    const rawFragment = await resolveSource(shader);
    const fragmentSource = normalizeFragmentSource(rawFragment);
    const nextProgram = linkProgram(this.gl, DEFAULT_VERTEX_SOURCE, fragmentSource);

    if (this.program) this.gl.deleteProgram(this.program);
    this.program = nextProgram;
    this.shaderSourceOrUrl = shader;
    this.#cacheUniforms();

    for (const [name, value] of this.values) {
      this.setUniform(name, value);
    }

    if (restart) this.start();
    return this;
  }

  #cacheUniforms() {
    this.uniforms.clear();
    const gl = this.gl;
    const count = gl.getProgramParameter(this.program, gl.ACTIVE_UNIFORMS);

    for (let index = 0; index < count; index += 1) {
      const info = gl.getActiveUniform(this.program, index);
      if (!info) continue;
      const name = info.name.replace(/\[0\]$/, "");
      this.uniforms.set(name, {
        location: gl.getUniformLocation(this.program, name),
        glType: info.type,
        type: GLSL_TYPES[info.type] || "unknown",
        size: info.size
      });
    }
  }

  #installObservers() {
    const signal = this.abortController.signal;

    if (this.options.autoResize && typeof ResizeObserver !== "undefined") {
      this.resizeObserver = new ResizeObserver(() => this.resize());
      this.resizeObserver.observe(this.canvas);
    }

    if (this.options.trackPointer) {
      this.canvas.addEventListener(
        "pointermove",
        (event) => {
          const rect = this.canvas.getBoundingClientRect();
          if (rect.width <= 0 || rect.height <= 0) return;
          this.mouse = [
            (event.clientX - rect.left) / rect.width,
            1 - (event.clientY - rect.top) / rect.height
          ];
        },
        { signal }
      );
    }
  }

  resize(width = this.canvas.clientWidth, height = this.canvas.clientHeight) {
    const ratio = Math.max(0.25, Number(this.options.pixelRatio) || 1);
    const nextWidth = Math.max(1, Math.round((width || this.canvas.width || 1) * ratio));
    const nextHeight = Math.max(1, Math.round((height || this.canvas.height || 1) * ratio));

    if (this.canvas.width !== nextWidth) this.canvas.width = nextWidth;
    if (this.canvas.height !== nextHeight) this.canvas.height = nextHeight;
    this.gl?.viewport(0, 0, nextWidth, nextHeight);
    return this;
  }

  setUniform(name, typeOrValue, maybeValue) {
    const value = arguments.length === 3 ? maybeValue : typeOrValue;
    const explicitType = arguments.length === 3 ? typeOrValue : null;
    this.values.set(name, value);

    if (!this.gl || !this.program) return this;
    const uniform = this.uniforms.get(name);
    if (!uniform || uniform.location === null) return this;

    const type = explicitType || uniform.type;
    const gl = this.gl;
    gl.useProgram(this.program);

    switch (type) {
      case "float": gl.uniform1f(uniform.location, Number(value)); break;
      case "int":
      case "bool": gl.uniform1i(uniform.location, type === "bool" ? (value ? 1 : 0) : Number(value)); break;
      case "vec2": gl.uniform2fv(uniform.location, value); break;
      case "vec3": gl.uniform3fv(uniform.location, value); break;
      case "vec4": gl.uniform4fv(uniform.location, value); break;
      case "ivec2": gl.uniform2iv(uniform.location, value); break;
      case "ivec3": gl.uniform3iv(uniform.location, value); break;
      case "ivec4": gl.uniform4iv(uniform.location, value); break;
      case "mat2": gl.uniformMatrix2fv(uniform.location, false, value); break;
      case "mat3": gl.uniformMatrix3fv(uniform.location, false, value); break;
      case "mat4": gl.uniformMatrix4fv(uniform.location, false, value); break;
      default:
        if (typeof value === "number") gl.uniform1f(uniform.location, value);
        else if (Array.isArray(value) || ArrayBuffer.isView(value)) {
          if (value.length === 2) gl.uniform2fv(uniform.location, value);
          if (value.length === 3) gl.uniform3fv(uniform.location, value);
          if (value.length === 4) gl.uniform4fv(uniform.location, value);
        }
    }

    return this;
  }

  renderOnce({ time = this.fixedTime ?? 0, clear = true } = {}) {
    if (!this.gl || !this.program || !this.quad) {
      throw new Error("Call init() before rendering.");
    }

    const gl = this.gl;
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.useProgram(this.program);

    if (clear) {
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }

    this.setUniform("u_time", "float", time);
    this.setUniform("u_resolution", "vec2", [gl.drawingBufferWidth, gl.drawingBufferHeight]);
    this.setUniform("u_mouse", "vec2", this.mouse);

    // Backward compatibility for the repository's original WebGL1 shaders.
    this.setUniform("u_res", "vec2", [gl.drawingBufferWidth, gl.drawingBufferHeight]);

    for (const [name, value] of this.values) {
      if (!["u_time", "u_resolution", "u_mouse", "u_res"].includes(name)) {
        this.setUniform(name, value);
      }
    }

    gl.bindVertexArray(this.quad.vao);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.bindVertexArray(null);
    return this;
  }

  start() {
    if (this.running) return this;
    this.running = true;
    this.startTime = nowSeconds();

    const frame = () => {
      if (!this.running) return;
      const time = this.fixedTime ?? nowSeconds() - this.startTime;
      this.renderOnce({ time });
      this.raf = requestAnimationFrame(frame);
    };

    this.raf = requestAnimationFrame(frame);
    return this;
  }

  stop() {
    this.running = false;
    if (this.raf !== null) cancelAnimationFrame(this.raf);
    this.raf = null;
    return this;
  }

  setFixedTime(time = null) {
    this.fixedTime = time === null ? null : Number(time);
    return this;
  }

  captureDataURL(type = "image/png", quality = 0.92) {
    return this.canvas.toDataURL(type, quality);
  }

  captureFrame(type = "image/png", quality = 0.92) {
    return new Promise((resolve, reject) => {
      this.canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Canvas capture returned no data."))),
        type,
        quality
      );
    });
  }

  destroy() {
    this.stop();
    this.resizeObserver?.disconnect();
    this.abortController.abort();

    if (this.gl) {
      if (this.program) this.gl.deleteProgram(this.program);
      if (this.quad?.buffer) this.gl.deleteBuffer(this.quad.buffer);
      if (this.quad?.vao) this.gl.deleteVertexArray(this.quad.vao);
    }

    this.program = null;
    this.quad = null;
    this.gl = null;
  }
}

export async function preview(canvas, shader, options = {}) {
  const player = new ShaderPlayer(canvas, shader, {
    autoResize: false,
    trackPointer: false,
    preserveDrawingBuffer: true,
    pixelRatio: 1,
    ...options
  });
  await player.init();
  player.resize(canvas.width || 512, canvas.height || 512);
  player.setFixedTime(options.time ?? 1.2345);
  player.renderOnce({ time: options.time ?? 1.2345 });
  return player;
}
