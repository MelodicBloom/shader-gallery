export const vertexShader = /* glsl */ `
  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;
  varying float vRidge;
  uniform float uTime;
  uniform float uDensity;
  uniform float uDisplacement;

  float hash31(vec3 p) {
    p = fract(p * 0.1031);
    p += dot(p, p.yzx + 33.33);
    return fract((p.x + p.y) * p.z);
  }

  float noise3(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash31(i), hash31(i + vec3(1,0,0)), f.x), mix(hash31(i + vec3(0,1,0)), hash31(i + vec3(1,1,0)), f.x), f.y),
      mix(mix(hash31(i + vec3(0,0,1)), hash31(i + vec3(1,0,1)), f.x), mix(hash31(i + vec3(0,1,1)), hash31(i + vec3(1)), f.x), f.y),
      f.z
    );
  }

  void main() {
    vec3 samplePoint = normalize(position) * uDensity + vec3(0.0, uTime * 0.08, uTime * 0.05);
    float primary = abs(noise3(samplePoint) - 0.5) * 2.0;
    float detail = abs(noise3(samplePoint * 2.08 + 2.7) - 0.5) * 0.52;
    float ridge = clamp(primary + detail, 0.0, 1.45);
    vec3 displaced = position + normal * ridge * uDisplacement;
    vec4 world = modelMatrix * vec4(displaced, 1.0);
    vWorldPosition = world.xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    vRidge = ridge;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

export const fragmentShader = /* glsl */ `
  precision highp float;
  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;
  varying float vRidge;
  uniform vec3 uBaseColor;
  uniform vec3 uGlowColor;
  uniform float uFresnel;
  uniform float uPulse;

  void main() {
    vec3 normal = normalize(vWorldNormal);
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    vec3 lightDirection = normalize(vec3(1.4, 2.2, 2.8));
    float diffuse = max(dot(normal, lightDirection), 0.0);
    float fresnel = pow(1.0 - max(dot(normal, viewDirection), 0.0), uFresnel);
    vec3 halfDirection = normalize(lightDirection + viewDirection);
    float specular = pow(max(dot(normal, halfDirection), 0.0), 56.0);
    float tissueMix = smoothstep(0.14, 1.2, vRidge);
    vec3 tissue = mix(uBaseColor, uGlowColor, tissueMix * 0.72);
    vec3 color = tissue * (0.16 + diffuse * 0.9);
    color += uGlowColor * fresnel * (1.0 + uPulse * 0.45);
    color += vec3(0.92, 0.98, 1.0) * specular * 0.72;
    color *= 0.82 + 0.18 * smoothstep(0.0, 1.2, vRidge);
    color = pow(color, vec3(0.88));
    gl_FragColor = vec4(color, 1.0);
  }
`;
