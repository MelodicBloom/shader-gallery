// TouchDesigner GLSL TOP pixel shader. Noise TOP to input 0. No #version (TD preamble).
layout(location = 0) out vec4 fragColor;
uniform float uTime,uSides,uScale,uSpeed,uRotation,uWarp,uPalette,uContrast;
const float TAU=6.283185307179586;
void main(){
vec2 res=uTDOutputInfo.res.zw;
vec2 p=2.0*(vUV.st-.5)*vec2(res.x/max(res.y,1.),1.);
float theta=atan(p.y,p.x)+uRotation+uTime*uSpeed*.16;
float wedge=TAU/max(3.,uSides),a=mod(theta,wedge),f=min(a,wedge-a);
float r=length(p);
r+=uWarp*.12*sin(r*8.-uTime*uSpeed+cos(f*uSides)*2.);
vec2 q=r*vec2(cos(f),sin(f));
vec2 uv=fract(q*uScale*.17+vec2(.49,.53)+uTime*uSpeed*vec2(.03,-.023));
float n=texture(sTD2DInputs[0],uv).r;
float field=clamp((n-.5)*uContrast+.5,0.,1.);
vec3 color=.5+.5*cos(TAU*(vec3(.12,.38,.66)+uPalette+vec3(1.,.95,1.1)*field));
color*=.4+.8*smoothstep(.1,.92,field);
fragColor=TDOutputSwizzle(vec4(clamp(color,0.,1.),1.));
}