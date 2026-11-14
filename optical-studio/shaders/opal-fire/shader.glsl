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

// Opal-inspired play-of-color: fixed object-space domains and buried depth slices.
// This is an appearance model, not a silica diffraction/scattering solver.
void main(){
 vec3 eye,ray;camera(eye,ray);vec3 color=darkStage(eye,ray),p,n;float hit;
 if(ellipsoid(eye,ray,vec3(.92,.98,.64),hit,p,n)){
  vec3 v=-ray,l=keyLight(),h=normalize(v+l),t,b;frame(n,t,b);
  float nv=max(dot(n,v),0.),nl=max(dot(n,l),0.);
  vec3 inside=refract(ray,n,1./1.45);
  float cloudy=fbm(p*5.1);
  color=vec3(.018,.028,.036)*(.28+.55*nl)+vec3(.012,.023,.027)*cloudy;
  float scale=mix(5.5,13.,grain);
  for(int j=0;j<3;++j){
   float depth=.075+float(j)*.115;
   vec3 q=p+inside*depth;
   Cell cell=cells(q.xy*scale+vec2(q.z*2.3,float(j)*.7));
   vec3 random=hash33(vec3(cell.id,float(j)+7.));
   vec3 domainNormal=normalize(n+t*(random.x-.5)*1.25+b*(random.y-.5)*1.15);
   float alignment=max(dot(domainNormal,h),0.);
   float flash=exp(-(1.-alignment*alignment)/mix(.024,.12,roughness));
   float nm=430.+random.z*220.+(paletteShift-.32)*120.+(dot(v,h)-.85)*150.;
   vec3 chroma=wavelength(nm);
   float edge=smoothstep(.005,.11,cell.edge);
   float stipple=.75+.25*noise3(q*75.);
   float attenuation=exp(-depth*(2.2+cloudy*2.));
   color+=chroma*flash*edge*stipple*attenuation*spectral*3.3*(.18+.82*nl);
  }
  // Neutral surface cover stays distinct from buried color.
  vec3 detail=vec3(noise3(p*55.),noise3(p*55.+11.),noise3(p*55.+31.))-.5;
  vec3 coat=normalize(n+detail*grain*.015);
  float f=fresnel(nv,1.45);
  color=color*(1.-f)+studio(reflect(ray,coat),roughness*.55)*f;
 }
 outColor=vec4(display(color),1.);
}
