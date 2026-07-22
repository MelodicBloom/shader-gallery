export function buildRenderExpression({ vertexSource, fragmentSource, meta }) {
  return `(() => {
    const vertexSource = ${JSON.stringify(vertexSource)};
    const fragmentSource = ${JSON.stringify(fragmentSource)};
    const meta = ${JSON.stringify(meta)};
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    document.body.innerHTML = "";
    document.body.appendChild(canvas);
    const gl = canvas.getContext("webgl2", { preserveDrawingBuffer: true, premultipliedAlpha: false });
    if (!gl) return { ok: false, error: "WebGL2 unavailable" };

    function compile(type, source) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const error = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error(error || "shader compile failed");
      }
      return shader;
    }

    try {
      const vertex = compile(gl.VERTEX_SHADER, vertexSource);
      const fragment = compile(gl.FRAGMENT_SHADER, fragmentSource);
      const program = gl.createProgram();
      gl.attachShader(program, vertex);
      gl.attachShader(program, fragment);
      gl.bindAttribLocation(program, 0, "a_position");
      gl.linkProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(program) || "program link failed");
      }
      gl.useProgram(program);

      const vao = gl.createVertexArray();
      const buffer = gl.createBuffer();
      gl.bindVertexArray(vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

      function setUniform(name, def) {
        const location = gl.getUniformLocation(program, name);
        if (location === null) return;
        const value = def.default;
        switch (def.type) {
          case "float": gl.uniform1f(location, Number(value)); break;
          case "int": gl.uniform1i(location, Number(value)); break;
          case "bool": gl.uniform1i(location, value ? 1 : 0); break;
          case "vec2": gl.uniform2fv(location, value); break;
          case "vec3": gl.uniform3fv(location, value); break;
          case "vec4": gl.uniform4fv(location, value); break;
        }
      }

      for (const [name, def] of Object.entries(meta.uniforms || {})) setUniform(name, def);
      const timeLocation = gl.getUniformLocation(program, "u_time");
      const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
      const mouseLocation = gl.getUniformLocation(program, "u_mouse");
      if (timeLocation !== null) gl.uniform1f(timeLocation, meta.preview?.time ?? 1.2345);
      if (resolutionLocation !== null) gl.uniform2f(resolutionLocation, 512, 512);
      if (mouseLocation !== null) gl.uniform2f(mouseLocation, 0.5, 0.5);

      gl.viewport(0, 0, 512, 512);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      gl.finish();

      const pixels = new Uint8Array(4 * 64 * 64);
      gl.readPixels(224, 224, 64, 64, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
      let sum = 0;
      let sumSquares = 0;
      let alphaSum = 0;
      for (let i = 0; i < pixels.length; i += 4) {
        const luminance = pixels[i] + pixels[i + 1] + pixels[i + 2];
        sum += luminance;
        sumSquares += luminance * luminance;
        alphaSum += pixels[i + 3];
      }
      const count = pixels.length / 4;
      const mean = sum / count;
      const variance = sumSquares / count - mean * mean;
      const alphaMean = alphaSum / count;
      const dataURL = canvas.toDataURL("image/png");
      gl.deleteBuffer(buffer);
      gl.deleteVertexArray(vao);
      gl.deleteProgram(program);
      return { ok: mean > 0.5 || alphaMean > 0.5, mean, variance, alphaMean, dataURL };
    } catch (error) {
      return { ok: false, error: error.stack || String(error) };
    }
  })()`;
}
