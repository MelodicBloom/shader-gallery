#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 outColor;
uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_orbitX;
uniform float u_orbitY;
uniform float u_zoom;
uniform int u_topology;
uniform float u_relief;
uniform float u_roughness;
uniform float u_ior;
uniform float u_clarity;
uniform float u_scatter;
uniform float u_fire;
uniform float u_domainScale;
uniform float u_spectralShift;
uniform float u_lightAngle;
uniform float u_lightHeight;
uniform float u_lightEnergy;
uniform float u_exposure;
uniform float u_reveal;

const float PI = 3.14159265359;
float hash13(vec3 p) { return fract(sin(dot(p, vec3(127.1,311.7,74.7)))*43758.5453); }
float noise3(vec3 p) {
  vec3 i=floor(p), f=fract(p);
  f=f*f*(3.0-2.0*f);
  float a=mix(hash13(i),hash13(i+vec3(1,0,0)),f.x);
  float b=mix(hash13(i+vec3(0,1,0)),hash13(i+vec3(1,1,0)),f.x);
  float c=mix(hash13(i+vec3(0,0,1)),hash13(i+vec3(1,0,1)),f.x);
  float d=mix(hash13(i+vec3(0,1,1)),hash13(i+vec3(1,1,1)),f.x);
  return mix(mix(a,b,f.y),mix(c,d,f.y),f.z);
}
mat2 rot(float a) { return mat2(cos(a), -sin(a), sin(a), cos(a)); }
vec3 local(vec3 p) {
  p.xz = rot(u_orbitY)*p.xz;
  p.yz = rot(u_orbitX)*p.yz;
  return p;
}
float baseSDF(vec3 p) {
  if (u_topology==1) {
    // Polished, softly flattened cabochon viewed from its crown.
    vec3 q=vec3(p.x/1.06,(p.y+0.04)/0.79,p.z/0.72);
    return (length(q)-0.92)*0.79;
  }
  if (u_topology==2) {
    // Superellipsoid: planar areas with smoothed rounded facets.
    vec3 q=abs(p)/vec3(0.92,0.94,0.9);
    return (pow(pow(q.x,8.0)+pow(q.y,8.0)+pow(q.z,8.0),0.125)-1.0)*0.86;
  }
  return length(p)-0.88;
}
float map(vec3 p) {
  vec3 q=local(p);
  float relief=(sin(q.x*17.0+sin(q.z*9.0))*sin(q.y*15.0+q.x*4.0))*0.5;
  relief+=sin(q.x*31.0+q.y*19.0)*sin(q.z*22.0)*0.13;
  return baseSDF(q)+relief*u_relief;
}
vec3 normalAt(vec3 p) {
  vec2 e=vec2(0.0015,0.0);
  return normalize(vec3(map(p+e.xyy)-map(p-e.xyy),map(p+e.yxy)-map(p-e.yxy),map(p+e.yyx)-map(p-e.yyx)));
}
vec3 spectral(float phase) {
  // Bounded RGB wavelength proxy: artistic structural-color mapping.
  return clamp(abs(fract(phase+vec3(0.0,0.666667,0.333333))*6.0-3.0)-1.0,0.0,1.0);
}
vec3 tonemap(vec3 c) {
  c=max(c,0.0);
  c=(c*(2.51*c+0.03))/(c*(2.43*c+0.59)+0.14);
  return pow(clamp(c,0.0,1.0),vec3(1.0/2.2));
}
void main(){
  vec2 uv=v_uv*2.0-1.0;
  uv.x*=u_resolution.x/max(u_resolution.y,1.0);
  vec2 pos=uv;
  vec3 ro=vec3(0.0,0.0,3.45);
  vec3 rd=normalize(vec3(uv/max(0.65,u_zoom)*1.16,-2.75));

  vec3 bg=mix(vec3(0.0005,0.0011,0.003),vec3(0.003,0.006,0.017),clamp((v_uv.y+0.2)*0.8,0.0,1.0));
  bg+=0.005*vec3(0.25,0.7,0.8)*exp(-5.0*length(pos-vec2(0.5,0.2)));
  float d=0.0;
  bool hit=false;
  vec3 p=ro;
  for (int i=0;i<80;i++) {
    p=ro+rd*d;
    float stepDistance=map(p);
    if(stepDistance<0.0014){hit=true;break;}
    if(d>7.0)break;
    d+=max(stepDistance*0.72,0.005);
  }
  if(!hit) {
    float glow=0.011*exp(-5.0*max(0.0,length(uv)-0.87));
    outColor=vec4(tonemap((bg+glow)*u_exposure),1.0);
    return;
  }

  vec3 n=normalAt(p);
  vec3 v=normalize(-rd);
  float ndv=clamp(dot(n,v),0.0,1.0);
  vec3 light=normalize(vec3(sin(u_lightAngle)*cos(u_lightHeight),sin(u_lightHeight),cos(u_lightAngle)*cos(u_lightHeight)));
  vec3 light2=normalize(vec3(-0.8,0.26,0.65));
  float ndl=max(dot(n,light),0.0);
  float fill=max(dot(n,light2),0.0);
  vec3 halfVec=normalize(light+v);
  float halfCos=max(dot(n,halfVec),0.0);
  float rough=clamp(u_roughness,0.025,0.8);
  float spec=pow(halfCos,mix(760.0,10.0,sqrt(rough)))*(1.0-rough*0.64);
  float secondary=pow(max(dot(n,normalize(light2+v)),0.0),65.0)*(1.0-rough);
  float f0=pow((u_ior-1.0)/(u_ior+1.0),2.0);
  float fresnel=f0+(1.0-f0)*pow(1.0-ndv,5.0);

  // One-surface refracted sampling, NOT a full multi-bounce volume transport solver.
  vec3 trans=refract(rd,n,1.0/u_ior);
  vec3 sampleCoord=local(p+trans*(0.52+0.18*u_clarity));
  float cloud=noise3(sampleCoord*4.8)+0.52*noise3(sampleCoord*10.8+4.1);
  float feather=noise3(sampleCoord*2.0+vec3(3.3,-1.1,5.2));
  float strands=pow(abs(sin(sampleCoord.y*19.0+cloud*5.0+sampleCoord.x*4.0)),8.0);
  float milky=clamp(u_scatter*(0.33+0.42*cloud),0.0,1.0);
  vec3 blueScatter=vec3(0.26,0.65,0.99)*milky;
  vec3 warmTransmit=vec3(1.0,0.78,0.67)*max(0.0,1.0-milky)*0.31;
  vec3 porcelain=vec3(0.48,0.79,0.9)*0.21+vec3(0.58,0.45,0.77)*0.075;
  vec3 body=porcelain+blueScatter*0.52+warmTransmit;
  body=mix(body,vec3(0.018,0.075,0.15)+blueScatter*0.12,clamp(u_clarity*0.83,0.0,0.78));

  // Localized, asymmetrical silica-domain analogs, strongly angle-dependent.
  vec3 cellCoord=sampleCoord*(u_domainScale*0.7);
  vec3 cell=floor(cellCoord);
  float h=noise3(cellCoord*0.5+2.0);
  float h2=noise3(cellCoord*1.25+17.0);
  float pocket=pow(smoothstep(0.30,0.88,noise3(sampleCoord*3.6+vec3(2.5,6.3,1.2))),1.5);
  float seams=pow(1.0-abs(noise3(cellCoord*2.4)-0.5)*2.0,2.0);
  float angular=dot(n,light)*0.32+ndv*0.22+dot(trans,normalize(vec3(0.36,0.62,0.83)))*0.36;
  float phase=h*0.82+h2*0.42+angular*0.42+u_spectralShift*0.14+0.07*cloud;
  vec3 fire=spectral(phase);
  vec3 fire2=spectral(phase+0.19+0.15*feather);
  float fireMask=pow(smoothstep(0.38,0.77,h2*0.45+cloud*0.46),1.7);
  fireMask*=0.45+0.55*max(ndl,fill);
  fireMask*=0.5+0.5*pocket;
  fireMask*=0.7+0.3*seams;
  float fireAmt=u_fire*(0.17+1.05*fireMask)*(0.75+0.25*u_clarity);
  vec3 chroma=pow(mix(fire,fire2,0.34+0.22*strands),vec3(1.25));
  chroma*=vec3(1.1,1.05,1.15);
  body+=chroma*fireAmt*1.32;

  // Inner luminous inclusions, not flat rainbow bands.
  float glint=pow(max(0.0,noise3(sampleCoord*26.0+6.5)-0.73)/0.27,2.0);
  vec3 glintTint=mix(vec3(0.38,0.95,0.9),vec3(1.0,0.62,0.9),h);
  body+=glintTint*(0.055+0.17*u_fire)*glint;
  body*=0.48+0.58*ndl+0.22*fill;
  body+=mix(vec3(0.24,0.44,0.69),vec3(0.8,0.85,1.0),ndl)*fresnel*0.42;
  body+=vec3(1.0,0.98,0.96)*spec*(0.85+fresnel)*u_lightEnergy;
  body+=vec3(0.28,0.77,0.98)*secondary*0.36;
  body+=vec3(0.38,0.65,0.9)*pow(1.0-ndv,2.3)*0.26;
  body+=pow(max(ndl,0.0),1.6)*vec3(0.06,0.09,0.11)*u_lightEnergy;
  // Story event amplifies material's internal fire without mutating optical constants.
  body+=u_reveal*chroma*fireMask*0.55;
  vec3 result=tonemap(body*u_exposure);
  outColor=vec4(result,1.0);
}
