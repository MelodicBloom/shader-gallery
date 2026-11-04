#version 300 es
// Abalone Inner Fire — optical appearance hypothesis v0.1.
// Nacre-inspired alternating layer interference, object-space growth texture,
// multiple buried optical contributions, and stable half-vector microfacet glints.
// Wavelength samples are coarse RGB observer proxies, not calibrated reflectance.
// No measured aragonite/organic optical constants or subsurface random walk.
precision highp float;
in vec2 v_uv;
out vec4 outColor;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec3 cameraOrbit;
uniform vec3 lightDirection;
uniform float grain;
uniform float paletteShift;
uniform float spectral;
uniform float roughness;
uniform float layerDepth;
uniform float glintStrength;
uniform float fireDensity;
uniform float debugPass;
const float PI=3.14159265359;
float hash31(vec3 p){p=fract(p*vec3(.1031,.11369,.13787));p+=dot(p,p.yzx+19.19);return fract((p.x+p.y)*p.z);}
vec3 hash33(vec3 p){return vec3(hash31(p),hash31(p+17.5),hash31(p+37.2));}
float noise3(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 return mix(mix(mix(hash31(i),hash31(i+vec3(1,0,0)),f.x),mix(hash31(i+vec3(0,1,0)),hash31(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash31(i+vec3(0,0,1)),hash31(i+vec3(1,0,1)),f.x),mix(hash31(i+vec3(0,1,1)),hash31(i+vec3(1,1,1)),f.x),f.y),f.z);
}
float fbm(vec3 p){return .58*noise3(p)+.29*noise3(p*2.09+7.3)+.13*noise3(p*4.19+13.4);}
vec3 lightDir(){return length(lightDirection)>.01?normalize(lightDirection):normalize(vec3(-.55+.65*sin(u_time*.25),.65,1.1));}
void camera(out vec3 eye,out vec3 ray){
 vec3 orbit=cameraOrbit;
 eye=orbit.z*vec3(sin(orbit.x)*cos(orbit.y),sin(orbit.y),cos(orbit.x)*cos(orbit.y));
 vec3 f=normalize(-eye),r=normalize(cross(f,vec3(0,1,0))),u=cross(r,f);
 vec2 p=(v_uv*2.-1.)*vec2(u_resolution.x/max(u_resolution.y,1.),1.);
 ray=normalize(f*2.3+r*p.x+u*p.y);
}
bool ellipsoid(vec3 eye,vec3 ray,out vec3 p,out vec3 n){
 vec3 size=vec3(1.05,.83,.46),o=eye/size,d=ray/size;
 float a=dot(d,d),b=dot(o,d),c=dot(o,o)-1.,q=b*b-a*c;
 if(q<=0.)return false;
 float t=(-b-sqrt(q))/a; if(t<=0.)return false;
 p=eye+ray*t;n=normalize(p/(size*size));return true;
}
void basis(vec3 n,out vec3 t,out vec3 b){t=normalize(cross(abs(n.y)<.9?vec3(0,1,0):vec3(1,0,0),n));b=cross(n,t);}
float schlick(float c,float ior){float f=pow((ior-1.)/(ior+1.),2.);return f+(1.-f)*pow(1.-clamp(c,0.,1.),5.);}
vec3 wavelength(float lambda){
 // Broad non-negative RGB proxy weights, normalized only over the six bands below.
 vec3 q=(vec3(615.,535.,455.)-lambda)/vec3(57.,46.,43.);
 return exp(-.5*q*q);
}
vec3 studio(vec3 r,vec3 l){
 float strip=pow(max(dot(r,normalize(vec3(.86,.22,.53))),0.),40.);
 float soft=pow(max(dot(r,l),0.),18.);
 float upper=pow(max(dot(r,normalize(vec3(-.3,.92,.2))),0.),12.);
 return vec3(.012,.020,.033)+strip*vec3(2.,2.6,3.)+soft*vec3(3.7,3.1,2.4)+upper*vec3(.5,.8,1.0);
}
vec3 aces(vec3 c){c=max(c,vec3(0));return pow(clamp((c*(2.51*c+.03))/(c*(2.43*c+.59)+.14),0.,1.),vec3(1./2.2));}
void main(){
 vec3 eye,ray,p,n;camera(eye,ray);
 vec3 color=vec3(.003,.008,.013)+studio(ray,lightDir())*.14;
 if(ellipsoid(eye,ray,p,n)){
  vec3 t,b;basis(n,t,b);
  vec3 v=-ray,l=lightDir(),h=normalize(v+l);
  float nl=max(dot(n,l),0.),nv=max(dot(n,v),0.);
  // Static growth-line coordinates; NOT attached to screen space or animation time.
  float growth=p.y*10.+p.x*2.6+sin(p.x*8.3+p.y*3.2)*1.55+fbm(p*3.)*2.0;
  float ribs=pow(.5+.5*cos(growth*3.+sin(p.x*7.)*.45),1.8);
  float nacre=fbm(p*mix(13.,42.,grain));
  float fractures=pow(max(0.,.5+.5*sin(growth*19.+nacre*8.)),7.)*.16*grain;
  vec3 body=mix(vec3(.005,.021,.036),vec3(.032,.064,.076),nacre);
  body+=(vec3(.014,.046,.042)*ribs+vec3(.006,.012,.024))*(.18+.82*nl);
  body*=1.-fractures;
  vec3 interference=vec3(0.),glints=vec3(0.);
  vec3 inside=refract(ray,n,1./1.56);
  for(int layer=0;layer<3;++layer){
   float z=float(layer);
   float depth=.052+z*.105*mix(.4,1.9,layerDepth);
   vec3 q=p+inside*depth;
   // Elongated, growth-aligned lamella zones prevent square Voronoi tiles.
   float ribbon=q.y*9.+q.x*2.6+sin(q.x*8.3+q.y*3.2)*1.55+fbm(q*3.)*2.;
   vec3 domain=vec3(floor(ribbon*mix(1.5,5.2,fireDensity)),floor(q.x*mix(3.5,11.,fireDensity)+ribbon*.16),z);
   vec3 rnd=hash33(domain+vec3(1.7,8.6,3.3));
   vec3 lamella=normalize(n+t*(rnd.x-.5)*.50+b*(rnd.y-.5)*.52);
   // Snell inside a representative effective nacre medium.
   float incidence=clamp(dot(v,lamella),.02,1.);
   float sinSq=(1.-incidence*incidence)/(1.56*1.56);
   float cosInside=sqrt(max(.001,1.-sinSq));
   // Representative optical thickness, authored nanometres: periodic response
   // at 430–680 nm. It varies WITH THE OBJECT SPACE DOMAIN, not over time.
   float thicknessNm=mix(155.,300.,paletteShift)+(rnd.z-.5)*112.+(nacre-.5)*35.+ribs*35.;
   float orientation=pow(max(dot(lamella,h),0.),mix(110.,19.,roughness));
   float visibility=mix(.035,1.,orientation)*(.08+.92*nl);
   float atten=exp(-depth*(3.5+nacre*2.)) * exp(-z*.65);
   vec3 bandColor=vec3(0.);
   for(int k=0;k<6;++k){
    float lambda=430.+float(k)*50.;
    float phase=4.*PI*1.56*thicknessNm*cosInside/lambda;
    float reflected=pow(.5+.5*cos(phase),6.0);
    bandColor+=wavelength(lambda)*reflected;
   }
   // Tone-sorted interference bands: dominant wavelengths stay chromatic,
   // and weak cross-channel energy no longer washes the whole shell white.
   bandColor=pow(bandColor*.75,vec3(2.2));
   interference+=bandColor*(spectral*.66)*visibility*atten;
   // Separate sparse, coherent glints: local normals fixed to 3D shell domains.
   vec3 micro=normalize(lamella+t*(rnd.z-.5)*.5+b*(rnd.x-.5)*.4);
   float flash=pow(max(dot(micro,h),0.),mix(240.,42.,roughness));
   float presence=smoothstep(.18,.9,rnd.y)*smoothstep(.17,.85,fireDensity);
   glints+=bandColor*flash*presence*atten*glintStrength*2.8;
  }
  float cover=schlick(nv,1.56);
  vec3 coating=studio(reflect(ray,n),l)*cover;
  color=body+interference*(1.-cover)+glints*(1.-cover)+coating;
  if(debugPass>.5&&debugPass<1.5)color=body;
  else if(debugPass>=1.5&&debugPass<2.5)color=interference;
  else if(debugPass>=2.5&&debugPass<3.5)color=glints;
  else if(debugPass>=3.5)color=coating;
 }
 outColor=vec4(aces(color),1.);
}
