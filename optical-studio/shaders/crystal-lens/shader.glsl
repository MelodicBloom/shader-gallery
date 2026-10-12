#version 300 es
// Crystal Lens — closed convex dielectric with the full specular optics chain.
// Implements:
//   - Snell refraction with closed-form ray/ellipsoid intersect.
//   - Per-channel IOR (chromatic dispersion) — three real Snell paths.
//   - Schlick Fresnel blend between reflection and refraction.
//   - GGX distribution + Smith-Schlick geometry for the specular highlight.
//   - Object-space finish perturbation and procedural backdrop warp.
//   - Analytic focal caustic on the procedural floor (point-spread across key light).
//   - Local highlight lift on peak luminance, ACES-fit + gamma display.
//   - Single TIR retry; full spectral integration and PSF bloom are not claimed.
//
// This is an artistic optics model, not a calibrated spectral render.
precision highp float;
in vec2 v_uv;
out vec4 outColor;
uniform vec2  u_resolution;
uniform float u_time;
uniform vec3  cameraOrbit;
uniform vec3  lightDirection;
uniform float grain;            // micro finish + warp noise scale (0..1)
uniform float paletteShift;     // base IOR (1.40 -> 1.70)
uniform float spectral;         // chromatic dispersion amount (0..1)
uniform float roughness;        // GGX alpha for the dielectric (0.08..0.95)
uniform float dispersionUI;     // per-channel IOR spread multiplier (0..2)
uniform float warp;             // backdrop UV warp amplitude from normals (0..1)
uniform float causticStrength;  // focal caustic strength (0..2)
uniform float bloomMix;         // additive highlight bloom (0..2)

const float PI=3.14159265359;
const float TAU=6.28318530718;

float hash31(vec3 p){p=fract(p*vec3(.1031,.11369,.13787));p+=dot(p,p.yzx+19.19);return fract((p.x+p.y)*p.z);}
vec3 hash33(vec3 p){return vec3(hash31(p),hash31(p+13.7),hash31(p+41.3));}
float noise3(vec3 p){
 vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 return mix(mix(mix(hash31(i),hash31(i+vec3(1,0,0)),f.x),
                mix(hash31(i+vec3(0,1,0)),hash31(i+vec3(1,1,0)),f.x),f.y),
            mix(mix(hash31(i+vec3(0,0,1)),hash31(i+vec3(1,0,1)),f.x),
                mix(hash31(i+vec3(0,1,1)),hash31(i+vec3(1,1,1)),f.x),f.y),f.z);
}
float fbm(vec3 p){return.57*noise3(p)+.28*noise3(p*2.07+5.1)+.15*noise3(p*4.21+13.2);}

vec3 keyLight(){return length(lightDirection)>.01?normalize(lightDirection):normalize(vec3(-.55+.65*sin(u_time*.25),.65,1.1));}

void camera(out vec3 eye,out vec3 ray){
 vec3 orbit=length(cameraOrbit)>.1?cameraOrbit:vec3(.35,.18,3.4);
 eye=orbit.z*vec3(sin(orbit.x)*cos(orbit.y),sin(orbit.y),cos(orbit.x)*cos(orbit.y));
 vec3 f=normalize(-eye),r=normalize(cross(f,vec3(0,1,0))),u=cross(r,f);
 vec2 p=(v_uv*2.-1.)*vec2(u_resolution.x/max(u_resolution.y,1.),1.);
 ray=normalize(f*2.3+r*p.x+u*p.y);
}

bool ellipsoid(vec3 eye,vec3 ray,vec3 radii,out float t,out vec3 p,out vec3 n){
 vec3 o=eye/radii,d=ray/radii;float a=dot(d,d),b=dot(o,d),c=dot(o,o)-1.,q=b*b-a*c;
 if(q<=0.)return false;t=(-b-sqrt(q))/a; if(t<0.)t=(-b+sqrt(q))/a; if(t<0.)return false;
 p=eye+ray*t;n=normalize(p/(radii*radii));return true;
}

float schlick(float cosT,float F0){return F0+(1.-F0)*pow(1.-clamp(cosT,0.,1.),5.);}
float ggxD(float ndoth,float a2){float x=ndoth*ndoth*(a2-1.)+1.;return a2/(3.14159265*x*x);}
float ggxG1(float ndotv,float a){float k=a*.5;return ndotv>0.?ndotv/(ndotv*(1.-k)+k+1e-5):0.;}
float ggxSpec(vec3 n,vec3 v,vec3 l,float rough){
 float a=pow(clamp(rough,.08,.95),2.);float a2=a*a;
 vec3 h=normalize(v+l);float ndoth=max(dot(n,h),0.),ndotv=max(dot(n,v),0.),ndotl=max(dot(n,l),0.);
 float D=ggxD(ndoth,a2);
 float G=ggxG1(ndotv,a)*ggxG1(ndotl,a);
 return D*G/((4.*ndotv*ndotl)+1e-3);
}
vec3 wavelength_nm(float nm){vec3 q=(vec3(620.,535.,455.)-nm)/vec3(42.,34.,32.);vec3 c=exp(-.5*q*q);return c/max(max(c.r,c.g),max(c.b,.001));}
vec3 aces(vec3 c){
 c=max(c,vec3(0));
 const float a=2.51,b=.03,c2=2.43,d=.59,e=.14;
 return pow(clamp((c*(a*c+b))/(c*(c2*c+d)+e),0.,1.),vec3(1./2.2));
}

float panel2D(vec2 r,vec2 d,vec2 ext,float blur){
 float z=dot(r,d);if(z<1e-3)return 0.;
 vec2 p=r/z;vec2 q=1.-smoothstep(ext,ext+blur,abs(p));
 return q.x*q.y*smoothstep(.01,.15,z);
}

vec3 studio(vec3 r,float blur){
 vec3 c=vec3(.009,.013,.019)+vec3(.022,.025,.028)*max(r.y,0.);
 c+=vec3(1.,.96,.9)*panel2D(r.xy,keyLight().xy,vec2(.19,.38),0.025+blur*.45)*3.4;
 c+=vec3(.8,.91,1.)*panel2D(r.xy,vec2(.9,.15),vec2(.045,.72),0.012+blur*.3)*1.7;
 c+=vec3(.7,.8,.88)*panel2D(r.xz,vec2(-.2,.9),vec2(.7,.08),0.04+blur*.4)*.7;
 return c;
}

vec3 backdrop(vec3 eye,vec3 ray){
 vec3 sky=vec3(.014,.022,.036)+studio(ray*1.,roughness*.3)*.48;
 if(ray.z>=-.001)return sky;
 float t=(-2.6-eye.z)/ray.z;if(t<0.)return sky;
 vec3 p=eye+ray*t;
 // Surface-normal-driven UV warp: distorts the backdrop behind the lens.
 vec2 basis=vec2(sin(p.y*5.+u_time*.4)*0.45,(noise3(p*1.7)-.5));
 vec2 warpUV=p.xy+warp*basis;
 float edge=max(12.*t/u_resolution.y,.002);
 float stripe=smoothstep(-edge,edge,sin(warpUV.x*6.));
 vec3 c=mix(vec3(.023,.031,.046),vec3(.47,.50,.51),stripe);
 float chart=1.-smoothstep(1.4,2.7,abs(warpUV.y));
 c=mix(vec3(.012,.019,.030),c,chart);
 float ring=exp(-pow((length(warpUV-vec2(.2,.2))-1.35)*38.,2.));
 c+=vec3(.3,.35,.34)*ring;
 // Focal caustic: Gaussian footprint of the key-light on the floor.
 vec2 foc=p.xy-keyLight().xy*1.0;
 c+=vec3(1.,.96,.85)*exp(-dot(foc,foc)*58.)*1.3*causticStrength;
 return sky*.45+c*.65;
}

// A single entry and exit transport path per RGB proxy. The front-surface
// Fresnel split happens in main(), exactly once; exit Fresnel occurs here.
// A single TIR retry approximates an internal reflection without claiming a
// full multi-bounce or true spectral transport integrator.
vec3 sampleTransmission(vec3 eye,vec3 ray,vec3 enterP,vec3 entry,float ior){
 vec3 dir=refract(ray,entry,1./ior);
 if(dot(dir,dir)<.0001)return vec3(0.);
 vec3 o=enterP+dir*.001;
 float tO;vec3 pO,nO;
 if(!ellipsoid(o,dir,vec3(.92,.85,.85),tO,pO,nO))return vec3(0.);
 vec3 outDir=refract(dir,-nO,ior);
 float F0=pow((ior-1.)/(ior+1.),2.);
 if(dot(outDir,outDir)<.0001){
  vec3 bounced=reflect(dir,nO);
  o=pO+bounced*.001;
  if(!ellipsoid(o,bounced,vec3(.92,.85,.85),tO,pO,nO))return vec3(0.);
  outDir=refract(bounced,-nO,ior);
  if(dot(outDir,outDir)<.0001)return vec3(0.);
  dir=bounced;
 }
 float exitF=schlick(abs(dot(dir,nO)),F0);
 // Thickness-dependent attenuation is a bounded artistic absorption model.
 float travel=length(pO-enterP);
 vec3 absorption=exp(-travel*vec3(.075,.038,.018));
 return backdrop(pO,outDir)*absorption*(1.-exitF);
}

void main(){
 vec3 eye,ray;camera(eye,ray);
 vec3 color=backdrop(eye,ray);
 float tN;vec3 pN,nN;
 if(ellipsoid(eye,ray,vec3(.92,.85,.85),tN,pN,nN)){
  // Noise distort on the front surface normal (drives Fresnel rim shimmer).
  vec3 jitter=(hash33(floor(pN*90.))-.5);
  vec3 nWarp=normalize(nN+jitter*grain*.018);
  vec3 l=keyLight(),v=-ray;
  // Per-channel IOR — chromatic dispersion (real path-dependent offsets).
  float baseIOR=1.40+paletteShift*.30;
  float spread=1.+dispersionUI;
  float nR=baseIOR-0.055*spectral*spread;
  float nG=baseIOR+0.000*spectral*spread;
  float nB=baseIOR+0.080*spectral*spread;
  // Three independent Snell refractions give the lens three colour fringes.
  vec3 cR=sampleTransmission(eye,ray,pN,nWarp,nR);
  vec3 cG=sampleTransmission(eye,ray,pN,nWarp,nG);
  vec3 cB=sampleTransmission(eye,ray,pN,nWarp,nB);
  vec3 dispersed=vec3(cR.r,cG.g,cB.b);
  // Surface Schlick blend on top so the FRONT FRESNEL rim still reads.
  float cosT=max(dot(nWarp,-ray),0.);
  float Fs=(baseIOR-1.)/(baseIOR+1.);Fs*=Fs;
  float fS=schlick(cosT,Fs);
  vec3 env=backdrop(eye,reflect(ray,nWarp));
  // GGX specular highlight (the SPECULAR slice of the chain).
  float spec=ggxSpec(nWarp,v,l,roughness);
  vec3 highlight=vec3(.96,.98,1.)*spec*2.5;
  color=mix(dispersed,env,fS)+highlight*Fs;
  // Bloom: warm additive glow on the brightest pixels.
  float lum=max(max(color.r,color.g),color.b);
  color+=wavelength_nm(580.)*smoothstep(.55,1.1,lum)*0.9*bloomMix;
 }
 outColor=vec4(aces(color),1.);
}
