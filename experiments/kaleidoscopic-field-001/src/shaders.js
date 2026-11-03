export const FULLSCREEN_VERTEX=`#version 300 es
precision highp float;
out vec2 vUv;
void main(){
  vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);
  vUv=p;
  gl_Position=vec4(p*2.-1.,0.,1.);
}`;
export const FIELD_FRAGMENT=`#version 300 es
precision highp float;
in vec2 vUv;
out vec4 frag;
uniform sampler2D uPrevious;
uniform float uTime,uSpeed,uPersistence,uHit;
uniform int uReset;
float hash21(vec2 p){ p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float noise2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash21(i),hash21(i+vec2(1,0)),f.x),mix(hash21(i+vec2(0,1)),hash21(i+1.),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=0.5;for(int i=0;i<5;i++){v+=a*noise2(p);p=mat2(1.67,-1.13,1.13,1.67)*p+3.1;a*=.53;}return v;}
void main(){
 vec2 uv=clamp(vUv,vec2(0.),vec2(1.));
 vec2 p=(uv-.5)*4.5;
 float t=uTime*uSpeed;
 float n=fbm(p+vec2(t*.23,-t*.17));
 float spiral=sin(length(p)*8.1-atan(p.y,p.x)*6.0-t*1.2)*0.09;
 float target=clamp(.08+1.17*n+spiral,0.,1.);
 vec2 drift=vec2(cos(n*12.+t*1.3),sin(n*11.-t))*0.004*(.2+uHit);
 float prev=texture(uPrevious,clamp(uv+drift,vec2(0.001),vec2(0.999))).r;
 float h=uReset==1?target:mix(target,prev,uPersistence);
 h=clamp(h+uHit*0.007*sin(length(p)*13.-t*5.),0.,1.);
 frag=vec4(h,h,h,1.);
}`;
export const VISUAL_COMMON=`
const float PI=3.141592653589793;
uniform sampler2D uField;
uniform float uSegments,uTime,uDisplacement,uAudio,uAspect;
vec2 fold(vec2 p){float wedge=PI/uSegments;float a=mod(atan(p.y,p.x)+2.*PI,2.*wedge);a=a>wedge?2.*wedge-a:a;return vec2(cos(a),sin(a))*length(p);}
float field(vec2 p){vec2 mirrored=fold(p);return texture(uField,clamp(mirrored*.47+.5,vec2(.003),vec2(.997))).r;}
vec3 palette(float h,float edge,float r,float audio){
 vec3 midnight=vec3(.010,.019,.070);
 vec3 ultramarine=vec3(.092,.105,.49);
 vec3 violet=vec3(.55,.17,.84);
 vec3 turquoise=vec3(.01,.91,.78);
 vec3 coral=vec3(1.,.37,.27);
 vec3 c=mix(midnight,ultramarine,smoothstep(.13,.69,h));
 c=mix(c,violet,smoothstep(.42,.86,h)*.76);
 c+=turquoise*pow(edge,1.25)*1.15;
 c+=coral*pow(max(0.,sin(h*24.+r*12.+uTime*.55)),14.)*(.13+audio*.35);
 c+=vec3(.50,.65,1.)*pow(max(0.,1.-r),4.)*.08;
 return c;
}
`;
export const PLANE_FRAGMENT=`#version 300 es
precision highp float;
in vec2 vUv;out vec4 frag;
${VISUAL_COMMON}
void main(){
 vec2 p=(vUv-.5)*2.;p.x*=uAspect;
 float r=length(p);
 float h=field(p);
 float hx=field(p+vec2(.006,0.))-field(p-vec2(.006,0.));
 float hy=field(p+vec2(0.,.006))-field(p-vec2(0.,.006));
 float edge=clamp(length(vec2(hx,hy))*13.,0.,1.);
 float carved=pow(abs(sin(h*22.+r*8.)),18.)*.12;
 vec3 color=palette(h,edge+carved,r,uAudio);
 float vignette=1.-smoothstep(.83,1.30,r);
 color*=vignette;
 color+=vec3(.01,.03,.075)*(1.-vignette);
 frag=vec4(1.-exp(-color*1.45),1.);
}`;
export const POINT_VERTEX=`#version 300 es
precision highp float;
layout(location=0) in vec2 aUv;
${VISUAL_COMMON}
uniform float uTilt,uPointSize;
out float vHeight;out float vEdge;out float vRadius;
void main(){
 vec2 p=aUv*2.-1.;
 float h=field(p);
 float hx=field(p+vec2(.011,0.))-field(p-vec2(.011,0.));
 float hy=field(p+vec2(0.,.011))-field(p-vec2(0.,.011));
 float edge=clamp(length(vec2(hx,hy))*15.,0.,1.);
 float mask=1.-smoothstep(.8,1.22,length(p));
 float displacement=(h-.42)*uDisplacement*(1.+uAudio*.35)*mask;
 vec3 pos=vec3(p*1.23,displacement);
 float c=cos(uTilt),s=sin(uTilt);
 pos=vec3(pos.x,pos.y*c-pos.z*s,pos.y*s+pos.z*c);
 float cz=cos(uTime*.08),sz=sin(uTime*.08);
 pos.xy=mat2(cz,-sz,sz,cz)*pos.xy;
 pos.z-=3.65;
 float inv=-pos.z;
 gl_Position=vec4(pos.x*1.85/uAspect,pos.y*1.85,.3,inv);
 gl_PointSize=clamp(uPointSize*(3.8/inv)*(0.62+edge*1.1),1.,6.5);
 vHeight=h;vEdge=edge;vRadius=length(p);
}`;
export const POINT_FRAGMENT=`#version 300 es
precision highp float;
in float vHeight,vEdge,vRadius;out vec4 frag;
${VISUAL_COMMON}
void main(){
 vec2 d=gl_PointCoord*2.-1.;float rad=dot(d,d);if(rad>1.)discard;
 vec3 col=palette(vHeight,vEdge,vRadius,uAudio);
 float glow=pow(max(0.,1.-rad),1.65);
 frag=vec4(col*(.58+glow*1.45),glow*.78);
}`;
