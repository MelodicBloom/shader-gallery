import { FULLSCREEN_VERTEX, FIELD_FRAGMENT, PLANE_FRAGMENT, POINT_VERTEX, POINT_FRAGMENT } from './shaders.js';
function shader(gl,type,src){
 const sh=gl.createShader(type); gl.shaderSource(sh,src);gl.compileShader(sh);
 if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(sh));
 return sh;
}
function program(gl,vs,fs){
 const p=gl.createProgram(),v=shader(gl,gl.VERTEX_SHADER,vs),f=shader(gl,gl.FRAGMENT_SHADER,fs);
 gl.attachShader(p,v);gl.attachShader(p,f);gl.linkProgram(p);
 gl.deleteShader(v);gl.deleteShader(f);
 if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));
 return p;
}
export class KaleidoscopicRenderer {
 constructor(canvas){
  this.canvas=canvas;
  const gl=canvas.getContext('webgl2',{alpha:false,antialias:false,preserveDrawingBuffer:true,powerPreference:'high-performance'});
  if(!gl)throw Error('WebGL2 is required. Try a browser with hardware acceleration enabled.');
  this.gl=gl;this.programs={field:program(gl,FULLSCREEN_VERTEX,FIELD_FRAGMENT),plane:program(gl,FULLSCREEN_VERTEX,PLANE_FRAGMENT),points:program(gl,POINT_VERTEX,POINT_FRAGMENT)};
  this.textureSize=256;this.simStep=0;this.maxGrid=0;
  this.textures=[];this.fbos=[];
  for(let i=0;i<2;i++){
   const tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tex);
   gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA8,this.textureSize,this.textureSize,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
   const fbo=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,fbo);
   gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,tex,0);
   if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw Error('Field framebuffer incomplete');
   this.textures.push(tex);this.fbos.push(fbo);
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER,null);
  this.vao=gl.createVertexArray();
  this.pointVao=gl.createVertexArray();this.pointBuffer=gl.createBuffer();
  this.setGrid(216);this.reset();
 }
 setGrid(grid){
  const n=Math.round(grid);if(n===this.maxGrid)return;
  this.maxGrid=n;const data=new Float32Array(n*n*2);
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){
   let i=(y*n+x)*2;data[i]=x/(n-1);data[i+1]=y/(n-1);
  }
  const g=this.gl;g.bindVertexArray(this.pointVao);g.bindBuffer(g.ARRAY_BUFFER,this.pointBuffer);g.bufferData(g.ARRAY_BUFFER,data,g.STATIC_DRAW);g.enableVertexAttribArray(0);g.vertexAttribPointer(0,2,g.FLOAT,false,0,0);g.bindVertexArray(null);
 }
 reset(){
  const g=this.gl;this.simStep=0;this.read=0;
  for(let i=0;i<2;i++){g.bindFramebuffer(g.FRAMEBUFFER,this.fbos[i]);g.viewport(0,0,this.textureSize,this.textureSize);g.clearColor(.5,.5,.5,1);g.clear(g.COLOR_BUFFER_BIT);}
  g.bindFramebuffer(g.FRAMEBUFFER,null);
 }
 uniform(p,name,value){const g=this.gl,loc=g.getUniformLocation(p,name);if(loc===null)return;
  if(Number.isInteger(value)&&['uReset','uPrevious','uField'].includes(name))g.uniform1i(loc,value);
  else g.uniform1f(loc,value);
 }
 step(time,params,audio){
  const g=this.gl,write=1-this.read,p=this.programs.field;
  g.bindFramebuffer(g.FRAMEBUFFER,this.fbos[write]);g.viewport(0,0,this.textureSize,this.textureSize);
  g.disable(g.BLEND);g.disable(g.SCISSOR_TEST);g.useProgram(p);g.bindVertexArray(this.vao);
  g.activeTexture(g.TEXTURE0);g.bindTexture(g.TEXTURE_2D,this.textures[this.read]);
  this.uniform(p,'uPrevious',0);this.uniform(p,'uTime',time);this.uniform(p,'uSpeed',params.speed);
  this.uniform(p,'uPersistence',params.persistence);this.uniform(p,'uHit',audio.hit);this.uniform(p,'uReset',this.simStep===0?1:0);
  g.drawArrays(g.TRIANGLES,0,3);this.read=write;this.simStep++;
 }
 common(p,params,audio,time,schedule,aspect){
  const g=this.gl;g.activeTexture(g.TEXTURE0);g.bindTexture(g.TEXTURE_2D,this.textures[this.read]);
  for(const [n,v] of Object.entries({uField:0,uSegments:schedule.segments,uTime:time,uDisplacement:params.displacement*schedule.displacementMultiplier,uAudio:audio.motion,uAspect:aspect,uTilt:params.tilt,uPointSize:params.pointSize}))this.uniform(p,n,v);
 }
 render(params,audio,time,schedule){
  const g=this.gl,c=this.canvas;
  const dpr=Math.min(window.devicePixelRatio||1,2);
  const w=Math.max(2,Math.floor(c.clientWidth*dpr)),h=Math.max(2,Math.floor(c.clientHeight*dpr));
  if(c.width!==w||c.height!==h){c.width=w;c.height=h;}
  g.bindFramebuffer(g.FRAMEBUFFER,null);g.enable(g.SCISSOR_TEST);
  g.clearColor(.005,.009,.030,1);g.scissor(0,0,w,h);g.clear(g.COLOR_BUFFER_BIT);
  const split=Math.floor(w/2);const panels=[{x:0,width:split,mode:'plane'},{x:split,width:w-split,mode:'points'}];
  for(const panel of panels){
   g.viewport(panel.x,0,panel.width,h);g.scissor(panel.x,0,panel.width,h);
   const p=this.programs[panel.mode];g.useProgram(p);
   this.common(p,params,audio,time,schedule,panel.width/h);
   if(panel.mode==='plane'){g.disable(g.BLEND);g.bindVertexArray(this.vao);g.drawArrays(g.TRIANGLES,0,3);}
   else{
    g.enable(g.BLEND);g.blendFunc(g.SRC_ALPHA,g.ONE);g.bindVertexArray(this.pointVao);g.drawArrays(g.POINTS,0,this.maxGrid*this.maxGrid);
   }
  }
  g.disable(g.SCISSOR_TEST);g.disable(g.BLEND);g.bindVertexArray(null);
 }
}
