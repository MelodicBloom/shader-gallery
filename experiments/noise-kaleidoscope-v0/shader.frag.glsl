#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 outColor;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_sectors;
uniform float u_scale;
uniform float u_speed;
uniform float u_rotation;
uniform float u_warp;
uniform float u_palette;
uniform float u_contrast;
uniform float u_seed;
const float TAU = 6.283185307179586;
float hash21(vec2 p) {
  p=fract(p*vec2(123.34,345.45));p+=dot(p,p+34.345);return fract(p.x*p.y);
}
float noise2(vec2 p) {
  vec2 i=floor(p),f=fract(p),w=f*f*(3.0-2.0*f);
  return mix(mix(hash21(i),hash21(i+vec2(1.,0.)),w.x),
             mix(hash21(i+vec2(0.,1.)),hash21(i+vec2(1.,1.)),w.x),w.y);
}
float fbm(vec2 p) {
  float v=0.,amp=.5;
  mat2 turn=mat2(.8,-.6,.6,.8);
  for(int j=0;j<4;j++){v+=amp*noise2(p);p=turn*p*2.02+2.3;amp*=.5;}
  return v/.9375;
}
void main(){
  vec2 p=2.0*(v_uv-.5)*vec2(u_resolution.x/max(1.,u_resolution.y),1.);
  float theta=atan(p.y,p.x)+u_rotation+u_time*u_speed*.16;
  float wedge=TAU/max(3.,u_sectors);
  float a=mod(theta,wedge),f=min(a,wedge-a);
  float r=length(p);
  r+=u_warp*.12*sin(r*8.-u_time*u_speed+cos(f*u_sectors)*2.);
  vec2 q=r*vec2(cos(f),sin(f));
  vec2 domain=q*u_scale+vec2(u_seed*.01131,u_seed*.00737)+u_time*u_speed*vec2(.23,-.17);
  vec2 drift=vec2(fbm(domain*.54+11.),fbm(domain*.54-13.))-.5;
  float n=fbm(domain+u_warp*drift*2.4);
  float fine=fbm(domain*1.8+vec2(9.4,2.1));
  float band=sin(12.*n+4.*fine+length(q)*4.+u_time*u_speed*.25);
  float field=clamp((n*.7+fine*.3-.5)*u_contrast+.5,0.,1.);
  float glint=pow(max(0.,band*.5+.5),16.)*.3;
  vec3 color=.5+.5*cos(TAU*(vec3(.12,.38,.66)+u_palette+vec3(1.,.95,1.1)*field));
  color*=.4+.8*smoothstep(.1,.92,field);
  color+=glint*vec3(.54,.86,1.);
  outColor=vec4(clamp(color,0.,1.),1.);
}