#version 300 es
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
const float PI=3.14159265359;
const float TAU=6.28318530718;
float hash31(vec3 p){p=fract(p*vec3(.1031,.11369,.13787));p+=dot(p,p.yzx+19.19);return fract((p.x+p.y)*p.z);}
vec3 hash33(vec3 p){return vec3(hash31(p),hash31(p+13.7),hash31(p+41.3));}
float noise3(vec3 p){
 vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 return mix(mix(mix(hash31(i),hash31(i+vec3(1,0,0)),f.x),mix(hash31(i+vec3(0,1,0)),hash31(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash31(i+vec3(0,0,1)),hash31(i+vec3(1,0,1)),f.x),mix(hash31(i+vec3(0,1,1)),hash31(i+vec3(1,1,1)),f.x),f.y),f.z);
}
float fbm(vec3 p){return .57*noise3(p)+.28*noise3(p*2.07+5.1)+.15*noise3(p*4.21+13.2);}
vec3 keyLight(){return length(lightDirection)>.01?normalize(lightDirection):normalize(vec3(-.55+.65*sin(u_time*.25),.65,1.1));}
void camera(out vec3 eye,out vec3 ray){
 vec3 orbit=length(cameraOrbit)>.1?cameraOrbit:vec3(.35,.18,3.4);
 eye=orbit.z*vec3(sin(orbit.x)*cos(orbit.y),sin(orbit.y),cos(orbit.x)*cos(orbit.y));
 vec3 f=normalize(-eye),r=normalize(cross(f,vec3(0,1,0))),u=cross(r,f);
 vec2 p=(v_uv*2.-1.)*vec2(u_resolution.x/max(u_resolution.y,1.),1.);
 ray=normalize(f*2.3+r*p.x+u*p.y);
}
bool ellipsoid(vec3 eye,vec3 ray,vec3 radii,out float hit,out vec3 p,out vec3 n){
 vec3 o=eye/radii,d=ray/radii;float a=dot(d,d),b=dot(o,d),c=dot(o,o)-1.,q=b*b-a*c;
 if(q<=0.)return false;hit=(-b-sqrt(q))/a;if(hit<0.)return false;
 p=eye+ray*hit;n=normalize(p/(radii*radii));return true;
}
void frame(vec3 n,out vec3 t,out vec3 b){t=normalize(cross(abs(n.y)<.9?vec3(0,1,0):vec3(1,0,0),n));b=cross(n,t);}
float panel(vec3 r,vec3 d,vec2 extent,float blur){
 d=normalize(d);vec3 x=normalize(cross(vec3(0,1,0),d)),y=cross(d,x);float z=dot(r,d);
 vec2 p=vec2(dot(r,x),dot(r,y))/max(z,.001),q=1.-smoothstep(extent,extent+blur,abs(p));return q.x*q.y*smoothstep(.01,.15,z);
}
vec3 studio(vec3 r,float blur){
 vec3 c=vec3(.009,.013,.019)+vec3(.022,.025,.028)*max(r.y,0.);
 c+=vec3(1.,.96,.9)*panel(r,keyLight(),vec2(.19,.38),.025+blur*.45)*3.4;
 c+=vec3(.8,.91,1.)*panel(r,vec3(.9,.15,.55),vec2(.045,.72),.012+blur*.3)*1.7;
 c+=vec3(.7,.8,.88)*panel(r,vec3(-.2,.9,-.6),vec2(.7,.08),.04+blur*.4)*.7;return c;
}
float fresnel(float c,float n){float f=(n-1.)/(n+1.);f*=f;return f+(1.-f)*pow(1.-clamp(c,0.,1.),5.);}
// Authored RGB wavelength bumps: color proxies, not spectral observer integration.
vec3 wavelength(float nm){vec3 q=(vec3(620.,535.,455.)-nm)/vec3(42.,34.,32.);vec3 c=exp(-.5*q*q);return c/max(max(c.r,c.g),max(c.b,.001));}
vec3 display(vec3 c){c=max(c,vec3(0));c=c/(1.+max(max(c.r,c.g),c.b));return mix(c*12.92,1.055*pow(c,vec3(1./2.4))-.055,step(vec3(.0031308),c));}
vec3 darkStage(vec3 eye,vec3 ray){
 vec3 c=vec3(.0025,.004,.007);
 if(ray.y<-.001){float d=(-1.10-eye.y)/ray.y;vec3 p=eye+ray*d;float pool=exp(-dot(p.xz,p.xz)*.5);c+=vec3(.009,.018,.025)*pool;}
 return c;
}
struct Cell {vec2 id;vec2 local;float edge;};
Cell cells(vec2 p){
 vec2 i=floor(p);float d1=1e5,d2=1e5;vec2 id=vec2(0),local=vec2(0);
 for(int y=-1;y<=1;++y)for(int x=-1;x<=1;++x){vec2 q=i+vec2(float(x),float(y));vec2 r=q+hash33(vec3(q,9.2)).xy-p;float d=dot(r,r);if(d<d1){d2=d1;d1=d;id=q;local=-r;}else if(d<d2)d2=d;}
 return Cell(id,local,sqrt(d2)-sqrt(d1));
}

// Exact ray/convex-plane intersections; three wavelength-proxy paths.
// Each path refracts at entry and exit and permits up to three internal bounces.
// No caustic transport or calibrated spectral color integration is claimed.
vec3 planeNormal(int i){
 if(i<3){float a=-PI*.5+float(i)*TAU/3.;return vec3(cos(a),sin(a),0.);}
 return i==3?vec3(0,0,1):vec3(0,0,-1);
}
float planeDistance(int i){return i<3?.64:.42;}
bool prism(vec3 eye,vec3 ray,out float nearT,out float farT,out vec3 nearN,out vec3 farN){
 nearT=-1e6;farT=1e6;nearN=vec3(0);farN=vec3(0);
 for(int i=0;i<5;++i){vec3 n=planeNormal(i);float d=planeDistance(i),den=dot(n,ray),s=d-dot(n,eye);
  if(abs(den)<.00001){if(s<0.)return false;continue;}
  float t=s/den;
  if(den<0.){if(t>nearT){nearT=t;nearN=n;}}else if(t<farT){farT=t;farN=n;}
 }
 return farT>=max(nearT,0.);
}
vec3 backdrop(vec3 eye,vec3 ray){
 vec3 sky=vec3(.014,.022,.036)+studio(ray,roughness*.3)*.48;
 if(ray.z>=-.001)return sky;
 float t=(-2.6-eye.z)/ray.z;if(t<0.)return sky;
 vec3 p=eye+ray*t;
 // Explicit footprint is valid inside divergent internal-reflection paths.
 float edge=max(12.*t/u_resolution.y,.002);
 float stripe=smoothstep(-edge,edge,sin(p.x*6.));
 vec3 c=mix(vec3(.023,.031,.046),vec3(.47,.50,.51),stripe);
 float chart=1.-smoothstep(1.4,2.7,abs(p.y));
 c=mix(vec3(.012,.019,.030),c,chart);
 float ring=exp(-pow((length(p.xy-vec2(.2,.2))-1.35)*38.,2.));
 c+=vec3(.3,.35,.34)*ring;
 return c;
}
float channel(vec3 eye,vec3 ray,vec3 enterN,vec3 enterP,float index,int ch){
 float enterF=fresnel(abs(dot(ray,enterN)),index);
 vec3 ref=studio(reflect(ray,enterN),roughness)*.8;
 float result=ref[ch]*enterF;
 float weight=1.-enterF;vec3 d=refract(ray,enterN,1./index),o=enterP+d*.0001;
 for(int bounce=0;bounce<4;++bounce){
  float tn,tf;vec3 nn,nf;if(!prism(o,d,tn,tf,nn,nf)||tf<0.)break;
  vec3 q=o+d*tf;weight*=exp(-tf*.025);
  vec3 outgoing=refract(d,-nf,index);
  float f=dot(outgoing,outgoing)<.01?1.:fresnel(abs(dot(d,nf)),index);
  if(f<1.)result+=weight*(1.-f)*backdrop(q,outgoing)[ch];
  weight*=f;
  d=reflect(d,nf);o=q+d*.0001;
 }
 return result;
}
void main(){
 vec3 eye,ray;camera(eye,ray);vec3 color=backdrop(eye,ray);
 float nearT,farT;vec3 nearN,farN;
 if(prism(eye,ray,nearT,farT,nearN,farN)&&nearT>0.){
  vec3 p=eye+ray*nearT;
  // Very small authored finish perturbs reflection only, keeping closed path
  // geometry exact for the transmitted rays.
  vec3 finish=normalize(nearN+grain*.018*(hash33(floor(p*95.))-.5));
  float base=1.40+paletteShift*.30;
  vec3 n=base+spectral*vec3(-.055,0.,.08);
  color=vec3(channel(eye,ray,nearN,p,n.r,0),channel(eye,ray,nearN,p,n.g,1),channel(eye,ray,nearN,p,n.b,2));
  float edge=1e3;
  for(int i=0;i<5;++i){vec3 norm=planeNormal(i);if(abs(dot(norm,nearN))<.99)edge=min(edge,planeDistance(i)-dot(norm,p));}
  float bevel=exp(-max(edge,0.)*130.);
  color+=studio(reflect(ray,finish),roughness)*(.025+bevel*.10);
 }
 outColor=vec4(display(color),1.);
}
