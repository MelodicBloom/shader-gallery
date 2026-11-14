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

// Oriented plate domains in a dark host. Artistic Schiller response,
// not a mineral optical-constant or lamellar diffraction calculation.
void main(){
 vec3 eye,ray;camera(eye,ray);vec3 color=darkStage(eye,ray),p,n;float hit;
 if(ellipsoid(eye,ray,vec3(1.03,.85,.55),hit,p,n)){
  vec3 v=-ray,l=keyLight(),h=normalize(v+l),t,b;frame(n,t,b);
  vec2 uv=mat2(.92,-.39,.39,.92)*p.xy;
  Cell cell=cells(vec2(uv.x*2.9,uv.y*7.5)+noise3(p*5.)*.32);
  vec3 rnd=hash33(vec3(cell.id,13.));
  float grainField=fbm(p*27.);
  float fractures=(1.-smoothstep(.001,.017,cell.edge))*.28;
  float striation=.5+.5*sin((uv.x*170.+noise3(p*12.)*2.1));
  vec3 plate=normalize(vec3((rnd.x-.5)*.54+.06,(rnd.y-.5)*.30+.31,1.));
  // Domains share a preferred internal orientation, so a broad flash travels
  // across the stone instead of following a colored silhouette.
  float alignment=max(dot(plate,h),0.);
  float flash=exp(-(1.-alignment*alignment)/mix(.006,.040,roughness));
  float nm=419.+rnd.z*43.+paletteShift*115.+(dot(v,h)-.92)*160.;
  vec3 schiller=wavelength(nm);
  float nl=max(dot(n,l),0.),nv=max(dot(n,v),0.);
  color=mix(vec3(.012,.020,.025),vec3(.048,.055,.052),grainField)*(.28+.6*nl);
  float terraces=mix(1.,.58+.42*striation,grain);
  float inclusions=smoothstep(.27,.60,fbm(p*18.+vec3(2,9,3)));
  color+=schiller*flash*spectral*(1.5+rnd.y*2.9)*terraces*(.3+.7*nl)*(1.-fractures*.87)*(.32+.68*inclusions);
  color*=1.-fractures*.75;
  vec3 coat=normalize(n+grain*.009*(t*sin(uv.x*150.)+b*cos(uv.y*130.)));
  float f=fresnel(nv,1.5);
  color=color*(1.-f)+studio(reflect(ray,coat),roughness)*f;
 }
 outColor=vec4(display(color),1.);
}
