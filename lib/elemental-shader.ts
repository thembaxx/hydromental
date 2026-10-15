import { Color, Vector2 } from "three";

// 3D simplex noise by Ashima Arts and Ian McEwan, MIT license.
// https://github.com/ashima/webgl-noise
const simplex = `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314*r; }
float snoise(vec3 v) {
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 1.0/7.0;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
  vec3 p0 = vec3(a0.xy,h.x), p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z), p3 = vec3(a1.zw,h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m *= m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}`;

/** Create uniforms per canvas so multiple previews never share mutable state. */
export function createElementalUniforms() {
  return {
    uTime: { value: 0 },
    uColorA: { value: new Color("#73e2cd") },
    uColorB: { value: new Color("#128f85") },
    uIntensity: { value: 0.8 },
    uTouch: { value: new Vector2(0.5, 0.5) },
    uTouchStrength: { value: 0 },
    uAspect: { value: 1 },
  };
}
export const elementalVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
export const elementalFragmentShader = `
  uniform float uTime, uIntensity, uTouchStrength, uAspect;
  uniform vec3 uColorA, uColorB;
  uniform vec2 uTouch;
  varying vec2 vUv;
  ${simplex}
  void main() {
    vec2 uv = (vUv - 0.5) * vec2(uAspect, 1.0);
    float dist = length((vUv - uTouch) * vec2(uAspect, 1.0));
    float ripple = sin(dist * 38.0 - uTime * 6.0) * exp(-dist * 5.0) * uTouchStrength;
    float noise = snoise(vec3(uv * 3.2 + ripple * 0.3, uTime * 0.13));
    float mist = 1.0 - smoothstep(0.02, 0.7, length(uv));
    vec3 color = mix(uColorB, uColorA, clamp(noise * 0.5 + 0.5 + ripple, 0.0, 1.0));
    float alpha = mist * (0.055 + noise * 0.035) + abs(ripple) * 0.12;
    gl_FragColor = vec4(color, max(0.0, alpha) * uIntensity);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
export const coreVertexShader = `
  uniform float uTime, uTouchStrength;
  varying vec3 vNormal, vPosition;
  varying vec2 vScreenUv;
  ${simplex}
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    float displacement = snoise(position * 2.3 + uTime * 0.15) * (0.035 + uTouchStrength * 0.04);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position + normal * displacement, 1.0);
    vScreenUv = gl_Position.xy / gl_Position.w * 0.5 + 0.5;
  }
`;
export const coreFragmentShader = `
  uniform float uTime, uTouchStrength, uAspect;
  uniform vec2 uTouch;
  uniform vec3 uColorA, uColorB;
  varying vec3 vNormal, vPosition;
  varying vec2 vScreenUv;
  ${simplex}
  void main() {
    float dist = length((vScreenUv - uTouch) * vec2(uAspect, 1.0));
    float ripple = sin(dist * 38.0 - uTime * 6.0) * exp(-dist * 5.0) * uTouchStrength;
    float n = snoise(vPosition * 3.4 + vec3(ripple * 0.5, uTime * 0.12, ripple * 0.3));
    float fine = snoise(vPosition * 14.0 + n * 1.2 + uTime * 0.06);
    float veins = 1.0 - smoothstep(0.018, 0.075, abs(n + fine * 0.13));
    float fresnel = pow(1.0 - abs(vNormal.z), 2.8);
    float light = max(0.0, dot(vNormal, normalize(vec3(-0.5, 0.8, 1.0))));
    vec3 base = mix(uColorB * 0.07, uColorA * 0.3, light * 0.6 + n * 0.15);
    vec3 color = base + uColorA * veins * (0.5 + light * 0.8) + uColorA * fresnel * 1.15;
    color += uColorA * pow(max(0.0, dot(vNormal, normalize(vec3(-0.4, 0.7, 1.0)))), 32.0) * 1.6;
    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
