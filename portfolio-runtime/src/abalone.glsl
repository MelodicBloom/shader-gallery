#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 outColor;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;
uniform vec3 cameraOrbit;
uniform float grain;
uniform float paletteShift;
uniform float spectral;
uniform float roughness;
const float TAU = 6.28318530718;
vec3 palette(float phase) {
  return 0.5 + 0.5 * cos(TAU * (phase + vec3(0.02, 0.22 + paletteShift * 0.12, 0.52 - paletteShift * 0.08)));
}
void main() {
  vec2 screen = (v_uv * 2.0 - 1.0) * vec2(u_resolution.x / max(u_resolution.y, 1.0), 1.0);
  float yaw = cameraOrbit.x, pitch = cameraOrbit.y;
  vec3 eye = cameraOrbit.z * vec3(sin(yaw)*cos(pitch), sin(pitch), cos(yaw)*cos(pitch));
  vec3 forward = normalize(-eye), right = normalize(cross(forward, vec3(0.,1.,0.)));
  vec3 up = cross(right, forward);
  vec3 ray = normalize(forward * 2.3 + right * screen.x + up * screen.y);
  // Analytic asymmetric ellipsoid: no march loop or asset dependency.
  vec3 radii = vec3(1.03, 0.82, 0.58), center = vec3(0.06, 0.04, 0.);
  vec3 origin = (eye-center) / radii, direction = ray / radii;
  float a=dot(direction,direction), b=dot(origin,direction), c=dot(origin,origin)-1.;
  float discriminant = b*b-a*c;
  vec3 color = vec3(0.00035,0.0006,0.0008) + vec3(0.0003,0.0004,0.0005)*exp(-dot(screen,screen)*0.5);
  if (discriminant > 0.) {
    float hit = (-b-sqrt(discriminant))/a;
    vec3 p = eye + ray*hit-center;
    vec3 normal = normalize(p/(radii*radii));
    float layers = sin(p.x*8. + p.y*3. + sin(p.y*9. + p.z*5.)*0.55);
    float micro = sin(p.x*37.+sin(p.y*31.)*1.2)*sin(p.z*29.+p.y*17.);
    float phase = p.y*3.8+p.x*1.1+layers*0.24+micro*grain*0.09;
    normal = normalize(normal + grain*0.055*vec3(cos(p.x*37.+p.y*9.), sin(p.y*31.+p.z*11.), cos(p.z*29.)));
    float facing = max(dot(normal,-ray),0.);
    float fresnel = pow(1.-facing,3.);
    vec3 light = normalize(vec3(-0.55,0.8,1.2));
    float diffuse = max(dot(normal,light),0.);
    vec3 halfVector = normalize(light-ray);
    float highlight = pow(max(dot(normal,halfVector),0.),mix(120.,12.,roughness));
    float event = exp(-pow((p.x+0.28+sin(u_time*0.22)*0.12)*2.8,2.)-pow((p.y-0.12)*2.5,2.));
    vec3 interference = palette(phase + facing*0.62 + sin(u_time*0.12)*0.045);
    float band = pow(0.5+0.5*sin(phase*TAU),3.);
    color = vec3(0.012,0.023,0.028)*(0.35+diffuse*0.8);
    color += interference*spectral*(0.08+0.48*event)*band*(0.2+0.8*diffuse);
    float lamella = pow(0.5+0.5*sin(phase*TAU*7.),16.);
    color += palette(phase+0.12)*lamella*grain*spectral*event*0.075;
    color += palette(phase*0.3+0.4)*fresnel*spectral*0.22;
    color += vec3(0.68,0.82,0.78)*highlight*(0.14+event*0.65);
    color *= 0.8+0.2*(0.5+0.5*micro*grain);
  }
  // Display encoding; math above is in a linear approximation.
  outColor=vec4(pow(max(color,vec3(0.)),vec3(1./2.2)),1.);
}
