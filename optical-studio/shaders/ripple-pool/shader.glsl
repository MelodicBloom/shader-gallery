#version 300 es
// Ripple Pool v1.2 — analytic heightfield approximation; no textures.
// Height is defined in WORLD xz, ray/height intersection is iteratively refined,
// normals come from central differences, transmitted rays reach a real floor plane.
// Focusing uses a finite-difference light-ray Jacobian (not a global energy solver).
// All dispersion is authored RGB approximation, not calibrated spectroscopy.
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
uniform float rippleAmp;
uniform float rippleWavelength;
uniform float zoomBlur;
uniform float causticBoost;
const float PI=3.14159265359;
const float FLOOR_Y=-1.25;
float hash21(vec2 p){p=fract(p*vec2(123.34,345.45));p+=dot(p,p+34.345);return fract(p.x*p.y);}
float noise2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash21(i),hash21(i+vec2(1,0)),f.x),mix(hash21(i+vec2(0,1)),hash21(i+vec2(1,1)),f.x),f.y);}
float fbm2(vec2 p){return .5*noise2(p)+.3*noise2(p*2.1)+.2*noise2(p*4.3);}
vec3 keyLight(){return length(lightDirection)>.01?normalize(lightDirection):normalize(vec3(-.55+.65*sin(u_time*.25),.65,1.1));}
void camera(out vec3 eye,out vec3 ray){
 vec3 orbit=length(cameraOrbit)>.1?cameraOrbit:vec3(.35,.18,3.4);
 eye=orbit.z*vec3(sin(orbit.x)*cos(orbit.y),sin(orbit.y),cos(orbit.x)*cos(orbit.y));
 vec3 f=normalize(-eye),r=normalize(cross(f,vec3(0,1,0))),u=cross(r,f);
 vec2 p=(v_uv*2.-1.)*vec2(u_resolution.x/max(u_resolution.y,1.),1.);
 ray=normalize(f*2.3+r*p.x+u*p.y);
}
float surfaceHeight(vec2 xz){
 float k=max(.15,rippleWavelength)*3.0;
 float wave=sin(xz.x*k+u_time*1.4)*cos(xz.y*k*.83-u_time*1.05);
 float second=.17*sin(xz.x*k*2.7+xz.y*.8+u_time*1.9);
 float small=(fbm2(xz*3.+vec2(u_time*.16,-u_time*.1))-.5)*.32*grain;
 return rippleAmp*(wave*.55+second+small);
}
vec3 surfaceNormal(vec2 xz){
 float e=.009;
 vec2 g=vec2(surfaceHeight(xz+vec2(e,0))-surfaceHeight(xz-vec2(e,0)),surfaceHeight(xz+vec2(0,e))-surfaceHeight(xz-vec2(0,e)))/(2.*e);
 return normalize(vec3(-g.x,1.,-g.y));
}
bool hitSurface(vec3 eye,vec3 ray,out vec3 p){
 if(eye.y<=.45||ray.y>=-.015)return false;
 float t=-eye.y/ray.y;
 for(int i=0;i<5;++i){vec3 q=eye+ray*t;t=(surfaceHeight(q.xz)-eye.y)/ray.y;}
 if(t<=0.||t>80.)return false;
 p=eye+ray*t;
 return length(p.xz)<24.;
}
float schlick(float ct,float F0){return F0+(1.-F0)*pow(1.-clamp(ct,0.,1.),5.);}
float ggxSpec(vec3 n,vec3 v,vec3 l,float rough){
 float nv=max(dot(n,v),0.),nl=max(dot(n,l),0.);
 if(nv<.0001||nl<.0001)return 0.;
 float a=pow(max(rough,.06),2.);float a2=a*a;
 vec3 h=normalize(v+l);float nh=max(dot(n,h),0.);
 float m=nh*nh*(a2-1.)+1.;float D=a2/(PI*m*m);
 float k=a*.5;float G=(nv/(nv*(1.-k)+k))*(nl/(nl*(1.-k)+k));
 return D*G/(4.*nv*nl+.001);
}
vec3 aces(vec3 c){c=max(c,vec3(0));return pow(clamp((c*(2.51*c+.03))/(c*(2.43*c+.59)+.14),0.,1.),vec3(1./2.2));}
vec3 backdrop(vec3 eye,vec3 ray){
 vec3 sky=vec3(.016,.028,.046)+vec3(.05,.07,.08)*pow(max(ray.y,0.),2.);
 if(ray.z>=-.001)return sky;
 float t=(-4.-eye.z)/ray.z;if(t<0.)return sky;
 vec3 p=eye+ray*t;
 float v=.5+.5*sin(p.x*4.+sin(p.y*3.)*2.);
 vec3 c=mix(vec3(.025,.035,.052),vec3(.32,.43,.52),v);
 float ring=exp(-pow((length(p.xy-vec2(0.,.2))-1.8)*16.,2.));
 return sky*.4+c*.7+vec3(.45,.3,.24)*ring*.38;
}
vec3 bottomColor(vec2 xz){
 float checker=step(0.,sin(xz.x*2.)*sin(xz.y*2.));
 float rim=exp(-pow((length(xz-vec2(.1,.4))-1.6)*8.,2.));
 return mix(vec3(.035,.06,.072),vec3(.21,.24,.23),checker)+rim*vec3(.33,.31,.25);
}
vec3 lightFloorHit(vec2 xz){
 vec3 p=vec3(xz.x,surfaceHeight(xz),xz.y);
 vec3 d=refract(-keyLight(),surfaceNormal(xz),1./1.333);
 float t=(FLOOR_Y-p.y)/min(-.001,d.y);
 return p+d*max(t,0.);
}
// Finite difference of the map from surface xz to focal location on the bottom.
// A contracting map gives a brighter focal region; clipped to avoid singularities.
float causticFocus(vec2 xz){
 float e=.018;
 vec2 px=(lightFloorHit(xz+vec2(e,0)).xz-lightFloorHit(xz-vec2(e,0)).xz)/(2.*e);
 vec2 pz=(lightFloorHit(xz+vec2(0,e)).xz-lightFloorHit(xz-vec2(0,e)).xz)/(2.*e);
 float jac=abs(px.x*pz.y-px.y*pz.x);
 return clamp((1./max(jac,.11)-.65)*.26,0.,1.8);
}
vec3 bottomBlur(vec2 xz,float radius){
 vec3 accum=bottomColor(xz)*.36;
 accum+=bottomColor(xz+vec2(radius,0.))*.16;
 accum+=bottomColor(xz+vec2(-radius,0.))*.16;
 accum+=bottomColor(xz+vec2(0.,radius))*.16;
 accum+=bottomColor(xz+vec2(0.,-radius))*.16;
 return accum;
}
vec3 transmission(vec3 p,vec3 ray,vec3 n,float ior){
 vec3 d=refract(ray,n,1./ior);
 if(dot(d,d)<.0001||d.y>=-.0001)return vec3(0.);
 float t=(FLOOR_Y-p.y)/d.y;
 if(t<=0.)return vec3(0.);
 vec3 floorP=p+d*t;
 vec3 bottom=bottomBlur(floorP.xz,zoomBlur*.28*(.3+t*.17));
 // Caustic concentration is evaluated at the intersected surface domain.
 float focus=causticFocus(p.xz);
 bottom+=vec3(.58,.82,.86)*focus*causticBoost;
 // Beer-Lambert applies ONLY to the transmitted path, not to reflections.
 vec3 absorb=vec3(.10,.043,.022)*mix(.55,1.8,spectral);
 return bottom*exp(-absorb*t);
}
void main(){
 vec3 eye,ray,p;camera(eye,ray);
 vec3 color=backdrop(eye,ray);
 if(hitSurface(eye,ray,p)){
  vec3 n=surfaceNormal(p.xz);
  vec3 l=keyLight(),v=-ray;
  float reflectance=schlick(max(dot(n,v),0.),pow((1.333-1.)/(1.333+1.),2.));
  float shift=paletteShift*spectral;
  vec3 red=transmission(p,ray,n,1.333-.005*shift);
  vec3 green=transmission(p,ray,n,1.333);
  vec3 blue=transmission(p,ray,n,1.333+.007*shift);
  vec3 transmitted=vec3(red.r,green.g,blue.b);
  vec3 reflected=backdrop(p,reflect(ray,n));
  color=mix(transmitted,reflected,reflectance);
  float spec=ggxSpec(n,v,l,roughness);
  color+=vec3(.87,.96,1.)*spec*.42;
 }
 outColor=vec4(aces(color),1.);
}
