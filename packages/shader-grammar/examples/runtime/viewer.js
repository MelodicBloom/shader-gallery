const $=id=>document.getElementById(id),canvas=$('view');let gl,program,thickness,angle;
function compile(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){const message=gl.getShaderInfoLog(s);gl.deleteShader(s);throw Error(message);}return s;}
function draw(){
  $('thickness-value').value=$('thickness').value+' nm';$('angle-value').value=$('angle').value+'°';if(!program)return;
  const bounds=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.max(1,Math.round(bounds.width*dpr));canvas.height=Math.max(1,Math.round(canvas.width*9/16));
  gl.viewport(0,0,canvas.width,canvas.height);gl.useProgram(program);gl.uniform1f(thickness,Number($('thickness').value));gl.uniform1f(angle,Math.cos(Number($('angle').value)*Math.PI/180));gl.drawArrays(gl.TRIANGLES,0,3);
}
async function boot(){
  const r=await fetch('../glsl-thin-film.glsl');if(!r.ok)throw Error('GLSL source HTTP '+r.status);const source=await r.text();$('source').textContent=source;
  gl=canvas.getContext('webgl2',{alpha:false,antialias:false});if(!gl)throw Error('WebGL2 unavailable. The exact source remains inspectable below; no live draw is claimed.');
  const vs=compile(gl.VERTEX_SHADER,'#version 300 es\nout vec2 uv;void main(){vec2 p=vec2((gl_VertexID==1)?3.:-1.,(gl_VertexID==2)?3.:-1.);uv=p*.5+.5;gl_Position=vec4(p,0.,1.);}');
  const fs=compile(gl.FRAGMENT_SHADER,'#version 300 es\nprecision highp float;in vec2 uv;out vec4 color;uniform float u_thickness;uniform float u_cosTheta;\n'+source+'\nvoid main(){float t=max(0.,u_thickness+(uv.x-.5)*200.);color=vec4(thinFilmApprox(t,u_cosTheta),1.);}');
  program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);if(!gl.getProgramParameter(program,gl.LINK_STATUS)){program=null;throw Error('Shader link failed');}
  gl.bindVertexArray(gl.createVertexArray());thickness=gl.getUniformLocation(program,'u_thickness');angle=gl.getUniformLocation(program,'u_cosTheta');draw();$('status').textContent='Original example compiled and linked; static strip responds to thickness and angle controls.';
}
$('thickness').addEventListener('input',draw);$('angle').addEventListener('input',draw);window.addEventListener('resize',draw);canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();program=null;$('status').textContent='WebGL context lost. Reload to restore the example.';});boot().catch(e=>{$('status').textContent=e.message;});
