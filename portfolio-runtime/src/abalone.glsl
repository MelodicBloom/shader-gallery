#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 outColor;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;
uniform vec3 cameraOrbit;
// Runtime-controlled directional-light vector.
uniform vec3 lightDirection;
uniform float grain;
uniform float layerSpacing;
uniform float paletteShift;
uniform float spectral;
uniform float fireStrength;
uniform float roughness;
const float TAU = 6.28318530718;
vec3 palette(float phase) {
  return 0.5 + 0.5 * cos(TAU * (phase + vec3(0.02, 0.22 + paletteShift * 0.12, 0.52 - paletteShift * 0.08)));
}
// Artistic buried-platelet response. No subsurface transport is simulated.
float fireLobe(vec3 n, vec3 h, vec3 l, float edge) {
  float alignment = max(dot(n, h), 0.0);
  float response = smoothstep(1.0-edge, 1.0, alignment);
  return response*smoothstep(-0.12, 0.35, dot(n,l));
}
vec3 display(vec3 c) {
  // Soft shoulder preserves hue in high-intensity flashes.
  c = c/(1.0 + max(max(c.r,c.g),c.b));
  return pow(max(c,vec3(0.0)),vec3(1.0/2.2));
}
void main() {
  vec2 screen = (v_uv * 2.0 - 1.0) * vec2(u_resolution.x / max(u_resolution.y, 1.0), 1.0);
  float yaw = cameraOrbit.x, pitch = cameraOrbit.y;
  vec3 eye = cameraOrbit.z * vec3(sin(yaw)*cos(pitch), sin(pitch), cos(yaw)*cos(pitch));
  vec3 forward = normalize(-eye), right = normalize(cross(forward, vec3(0.,1.,0.)));
  vec3 up = cross(right, forward);
  vec3 ray = normalize(forward * 2.3 + right * screen.x + up * screen.y);
  vec3 radii = vec3(1.03, 0.82, 0.58), center = vec3(0.06, 0.04, 0.);
  vec3 origin = (eye-center) / radii, direction = ray / radii;
  float a=dot(direction,direction), b=dot(origin,direction), c=dot(origin,origin)-1.;
  float discriminant = b*b-a*c;
  vec3 color = vec3(0.00035,0.0006,0.0008) + vec3(0.0003,0.0004,0.0005)*exp(-dot(screen,screen)*0.5);
  if (discriminant > 0.) {
    float hit = (-b-sqrt(discriminant))/a;
    vec3 p = eye + ray*hit-center;
    vec3 geometric = normalize(p/(radii*radii));
    float layers = sin(p.x*8. + p.y*3. + sin(p.y*9. + p.z*5.)*0.55);
    float micro = sin(p.x*37.+sin(p.y*31.)*1.2)*sin(p.z*29.+p.y*17.);
    float phase = p.y*3.8+p.x*1.1+layers*0.24+micro*grain*0.09;
    vec3 normal = normalize(geometric + grain*0.055*vec3(cos(p.x*37.+p.y*9.), sin(p.y*31.+p.z*11.), cos(p.z*29.)));
    vec3 v = -ray;
    float facing = max(dot(normal,v),0.);
    float fresnel = pow(1.-facing,3.);
    // The application supplies a deterministic directional-light orbit.
    vec3 light = normalize(lightDirection);
    vec3 fill = normalize(vec3(0.8,0.12,0.95));
    float diffuse = max(dot(normal,light),0.);
    vec3 halfVector = normalize(light+v);
    vec3 fillHalf = normalize(fill+v);
    float highlight = pow(max(dot(normal,halfVector),0.),mix(120.,12.,roughness));
    float event = exp(-pow((p.x+0.28)*2.8,2.)-pow((p.y-0.12)*2.5,2.));
    float opticalAngle = dot(v,halfVector);
    float interferencePhase = phase*layerSpacing + opticalAngle*(0.46+layerSpacing*0.49);
    vec3 interference = palette(interferencePhase);
    float band = pow(0.5+0.5*sin(interferencePhase*TAU),3.);
    color = vec3(0.012,0.023,0.028)*(0.35+diffuse*0.8);
    color += interference*spectral*(0.12+0.7*event)*band*(0.2+0.8*diffuse);
    float lamellaFrequency = mix(3.,11.,clamp(layerSpacing*0.625,0.,1.));
    float lamella = pow(0.5+0.5*sin(interferencePhase*TAU*lamellaFrequency),16.);
    color += palette(interferencePhase+0.12)*lamella*grain*spectral*event*0.12;
    color += palette(interferencePhase*0.3+0.4)*fresnel*spectral*0.22;
    color *= 0.8+0.2*(0.5+0.5*micro*grain);

    vec3 tangent = normalize(cross(abs(geometric.y)<0.9 ? vec3(0,1,0) : vec3(1,0,0),geometric));
    vec3 bitangent = cross(geometric,tangent);
    float width = mix(0.055,0.22,roughness);
    float edge = width*width;
    float disorder = 0.10+grain*0.18;
    float terraceBase = phase*TAU;
    float tangentSin = sin(terraceBase*0.67), tangentCos = cos(terraceBase*0.67);
    float disorderSin = sin(p.y*19.0), disorderCos = cos(p.y*19.0);
    float bitangentCos = cos(terraceBase*0.53), bitangentSin = sin(terraceBase*0.53);
    float crossCos = cos(p.x*23.0), crossSin = sin(p.x*23.0);
    float cascadeSin = sin(terraceBase*1.4+layers*2.0), cascadeCos = cos(terraceBase*1.4+layers*2.0);
    vec3 tangentLayers = vec3(tangentSin,
      tangentSin*0.293414241+tangentCos*0.955985399,
      tangentSin*-0.827816166+tangentCos*0.560999461);
    vec3 tangentDisorder = vec3(disorderSin,
      disorderSin*-0.737393716+disorderCos*0.675463181,
      disorderSin*0.087498983-disorderCos*0.996164609);
    vec3 bitangentLayers = vec3(bitangentCos,
      bitangentCos*-0.422501671-bitangentSin*0.906362145,
      bitangentCos*-0.642984676+bitangentSin*0.765879042);
    vec3 bitangentDisorder = vec3(crossCos,
      crossCos*0.540302306-crossSin*0.841470985,
      crossCos*-0.416146837-crossSin*0.909297427);
    vec3 cascadeLayers = vec3(cascadeSin,
      cascadeSin*-0.886258344+cascadeCos*0.463191265,
      cascadeSin*0.570907704-cascadeCos*0.821014247);
    vec3 firePalette = palette(interferencePhase+dot(v,halfVector)*1.12);
    // Three fixed layer orientations catch and release the light in succession.
    for (int j=0; j<3; ++j) {
      float depth = float(j);
      vec3 platelet = normalize(geometric
        + tangent*(0.30*tangentLayers[j]+disorder*tangentDisorder[j])
        + bitangent*(0.24*bitangentLayers[j]+disorder*bitangentDisorder[j]));
      vec3 fireBase = j==0 ? firePalette : (j==1 ? firePalette.gbr : firePalette.brg);
      vec3 fireColor = mix(fireBase,fireBase*fireBase,0.35);
      float cascadeWave = 0.5+0.5*cascadeLayers[j];
      float cascade = 0.28+0.72*cascadeWave*cascadeWave;
      float glintResponse = fireLobe(platelet,halfVector,light,edge);
      float secondaryResponse = fireLobe(platelet,fillHalf,fill,edge*0.72);
      float glint = glintResponse*glintResponse;
      float secondary = secondaryResponse*secondaryResponse*0.30;
      float buriedGlow = fireLobe(platelet,halfVector,light,edge*5.76)*0.12;
      color += fireColor * spectral * fireStrength * (glint+secondary+buriedGlow) * cascade * (10.0/(1.0+depth*0.48));
    }
    // A neutral top reflection gives the colored layers a polished cover.
    color += vec3(0.91,0.96,1.0)*highlight*(0.18+event*0.55);
  }
  outColor=vec4(display(color),1.);
}
