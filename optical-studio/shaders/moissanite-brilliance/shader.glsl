#version 300 es
// Moissanite Brilliance — 8-cut faceted gemstone.
// - 8 analytic facet half-planes form the gem silhouette (table + crown + pavilion).
// - Up to 3 internal bounces per ray; per-channel IOR (artistic RGB offsets).
// - GGX specular highlights + sparkle density from hash lobes.
// - ACES-fit display encoding + artistic highlight halo on bright pixels.
// Real shader math; artistic optics model.
precision highp float;
in vec2 v_uv;
out vec4 outColor;
uniform vec2  u_resolution;
uniform float u_time;
uniform vec3  cameraOrbit;
uniform vec3  lightDirection;
uniform float grain;
uniform float paletteShift;     // facet hue shift
uniform float spectral;          // base fire strength (0..1)
uniform float roughness;         // specular roughness (0.08..0.95)
uniform float dispersionBoost;   // extra per-channel IOR (0..3)
uniform float facetEdges;        // bevel / facet sharpness (0..1)
uniform float sparkleDensity;    // sparkle lobe count (0..1)
uniform float bloomHalo;         // halo bloom (0..3)

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
vec3 keyLight(){return length(lightDirection)>.01?normalize(lightDirection):normalize(vec3(-.55+.65*sin(u_time*.25),.65,1.1));}

void camera(out vec3 eye,out vec3 ray){
 vec3 orbit=length(cameraOrbit)>.1?cameraOrbit:vec3(.35,.18,3.4);
 eye=orbit.z*vec3(sin(orbit.x)*cos(orbit.y),sin(orbit.y),cos(orbit.x)*cos(orbit.y));
 vec3 f=normalize(-eye),r=normalize(cross(f,vec3(0,1,0))),u=cross(r,f);
 vec2 p=(v_uv*2.-1.)*vec2(u_resolution.x/max(u_resolution.y,1.),1.);
 ray=normalize(f*2.3+r*p.x+u*p.y);
}

// 8 facet planes: 4 around the crown at radius .55 (slope tilt), 4 around the
// pavilion at radius .42 (deeper tilt), plus table cap z=+.22 and culet z=-.30.
void facetPlane(int i,out vec3 n,out float d){
 float k=float(i);
 if(i<4){
  float a=k*(TAU/4.);
  n=normalize(vec3(cos(a),.55,sin(a)));
  d=.55;
 }else if(i<8){
  float a=(k-4.)*(TAU/4.);
  n=normalize(vec3(cos(a),-.78,sin(a)));
  d=.42;
 }else if(i==8){
  n=vec3(0,1,0);d=.22;
 }else{
  n=vec3(0,-1,0);d=.30;
 }
}

bool prism(vec3 eye,vec3 ray,out float nearT,out float farT,out vec3 nearN,out vec3 farN){
 nearT=-1e6;farT=1e6;nearN=vec3(0);farN=vec3(0);
 for(int i=0;i<10;++i){
  vec3 n;float d;
  facetPlane(i,n,d);
  float den=dot(n,ray);
  if(abs(den)<1e-5){if(d-dot(n,eye)<0.)return false;continue;}
  float s=d-dot(n,eye);float t=s/den;
  if(den<0.){if(t>nearT){nearT=t;nearN=n;}}
  else{if(t<farT){farT=t;farN=n;}}
 }
 return farT>=max(nearT,0.);
}

float planeT(vec3 eye,vec3 ray,vec3 n,float d){float den=dot(n,ray);if(abs(den)<1e-5)return-1.;return(d-dot(n,eye))/den;}

float schlick(float cs,float F0){return F0+(1.-F0)*pow(1.-clamp(cs,0.,1.),5.);}
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

vec3 backdrop(vec3 eye,vec3 ray){
 vec3 sky=vec3(.014,.022,.034)+vec3(.32,.36,.4)*pow(max(0.,1.-ray.y),3.)*.15;
 if(ray.z>=-.001)return sky;
 float tt=(-2.6-eye.z)/ray.z;if(tt<0.)return sky;
 vec3 p=eye+ray*tt;
 float stripe=smoothstep(-.01,.01,sin(p.x*4.));
 vec3 c=mix(vec3(.025,.033,.048),vec3(.42,.46,.5),stripe);
 float ring=exp(-pow((length(p.xy-vec2(.0,.0))-1.0)*22.,2.));
 c+=vec3(.4,.44,.46)*ring;
 return sky*.4+c*.7;
}

vec3 channel(vec3 eye,vec3 ray,vec3 enterP,vec3 enterN,float ior){
 float cosIn=abs(dot(ray,enterN));
 float F0=(ior-1.)/(ior+1.);F0*=F0;
 float refl=schlick(cosIn,F0);
 vec3 acc=backdrop(eye,reflect(ray,enterN))*refl;
 vec3 d=refract(ray,enterN,1./ior);
 if(dot(d,d)<.001)return acc;
 vec3 o=enterP+d*.0006;
 float weight=1.-refl;
 for(int b=0;b<3;++b){
  float tn,tf;vec3 nn,nf;
  if(!prism(o,d,tn,tf,nn,nf)||tf<0.)break;
  vec3 q=o+d*tf;
  weight*=exp(-tf*.06);
  vec3 outDir=refract(d,-nf,ior);
  float f2=dot(outDir,outDir)<.001?1.:schlick(abs(dot(d,nf)),F0);
  if(f2<1.){acc+=weight*(1.-f2)*backdrop(q,outDir);}
  weight*=f2;
  d=reflect(d,nf);o=q+d*.0006;
 }
 return acc;
}

void main(){
 vec3 eye,ray;camera(eye,ray);
 vec3 color=backdrop(eye,ray);
 float tN,tF;vec3 nN,nF;
 if(prism(eye,ray,tN,tF,nN,nF)&&tN>0.){
  vec3 pN=eye+ray*tN;
  // Finish noise on entry normal (small distort).
  vec3 jit=(hash33(floor(pN*120.))-.5);
  vec3 nW=normalize(nN+jit*grain*.012*facetEdges);
  vec3 l=keyLight(),v=-ray;
  // Per-channel authored dispersion (not measured Abbe or colorimetry).
  float baseIOR=2.45+paletteShift*.25; // illustrative values, not calibrated
  float k=spectral*dispersionBoost;
  float nR=baseIOR-0.13*k;
  float nG=baseIOR;
  float nB=baseIOR+0.18*k;
  vec3 cR=channel(eye,ray,pN,nW,nR);
  vec3 cG=channel(eye,ray,pN,nW,nG);
  vec3 cB=channel(eye,ray,pN,nW,nB);
  vec3 dispersed=vec3(cR.r,cG.g,cB.b);
  // Surface Schlick with diamond-grade F0.
  float cosT=max(dot(nW,-ray),0.);
  float Fs=(baseIOR-1.)/(baseIOR+1.);Fs*=Fs;
  // Reflected energy is already accounted for in channel().
  // Multiple sparkle lobes from hash-driven microfacets.
  float spec=ggxSpec(nW,v,l,roughness);
  vec3 sparkle=vec3(0);
  for(int i=0;i<5;++i){
   vec3 r=hash33(vec3(float(i),floor(pN.x*4.)+floor(pN.y*4.)*11.,1.))*2.-1.;
   vec3 ln=normalize(vec3(r.x*.55+nW.x,r.y*.45+nW.y,nW.z));
   float sp=ggxSpec(ln,v,l,.05)*6.;
   sparkle+=wavelength_nm(440.+float(i)*55.)*sp*sparkleDensity;
  }
  vec3 hi=vec3(1.,.98,.95)*spec*4.+sparkle;
  color=dispersed+hi*Fs;
  // Bevel highlight: ridge along facet edges.
  float margin=1e3;
  for(int j=0;j<10;++j){vec3 fn;float fd;facetPlane(j,fn,fd);
   if(dot(fn,nN)<.995)margin=min(margin,fd-dot(fn,pN));}
  float bevel=exp(-max(margin,0.)*mix(140.,30.,facetEdges));
  color+=wavelength_nm(580.)*bevel*.6*facetEdges;
  // Bloom halo on brightest pixels.
  float lum=max(max(color.r,color.g),color.b);
  color+=wavelength_nm(530.)*smoothstep(.7,1.2,lum)*.85*bloomHalo;
 }
 outColor=vec4(aces(color),1.);
}
