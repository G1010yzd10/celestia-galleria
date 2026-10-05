import * as THREE from "three";

// ─── Nukage-coolant water — full shader, zero textures ──────────────────────
// Fresnel env reflection + animated procedural normals + neon specular
// glints + edge foam + sparkle. The pool floor gets an additive caustics
// shader. Both are pure math: 0 bytes of VRAM.

const WATER_VERT = /* glsl */ `
  uniform float uTime;
  varying vec3 vWorld;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    // gentle swell (local +z is world +y after the -90deg X rotation)
    float w = sin(wp.x * 1.6 + uTime * 1.1) * 0.5 + sin(wp.z * 2.2 - uTime * 0.8) * 0.5;
    wp.y += w * 0.028;
    vWorld = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const WATER_FRAG = /* glsl */ `
  uniform float uTime;
  uniform vec3 uDeep;
  uniform vec3 uShallow;
  uniform vec3 uSky;
  uniform vec3 uAmber;
  uniform vec3 uTeal;
  uniform vec2 uHalf; // pool half extents for edge foam
  varying vec3 vWorld;

  float h(vec2 p) {
    float t = uTime;
    return sin(p.x * 2.1 + t * 1.3) * 0.5
         + sin(p.y * 2.7 - t * 1.1) * 0.5
         + sin((p.x + p.y) * 3.4 + t * 1.9) * 0.3
         + sin(dot(p, vec2(5.2, -4.1)) + t * 2.4) * 0.25
         + sin(dot(p, vec2(-8.0, 6.5)) + t * 3.1) * 0.15;
  }

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
  }

  void main() {
    vec2 p = vWorld.xz;
    // ---- animated normal (3 octaves, analytic gradient) ----
    float e = 0.14;
    float hx = h(p) - h(p + vec2(e, 0.0));
    float hz = h(p) - h(p + vec2(0.0, e));
    vec3 n = normalize(vec3(hx * 2.6, 0.62, hz * 2.6));

    vec3 V = normalize(cameraPosition - vWorld);
    vec3 R = reflect(-V, n);

    // ---- fresnel ----
    float fr = pow(1.0 - clamp(dot(V, n), 0.0, 1.0), 2.6);

    // ---- fake environment: vertical gradient reflection ----
    float up = clamp(R.y * 0.5 + 0.5, 0.0, 1.0);
    vec3 env = mix(uDeep, uSky, up * up);

    // ---- neon specular glints (analytic "light strip" reflections) ----
    vec3 L1 = normalize(vec3(0.35, 0.85, -0.25));
    vec3 L2 = normalize(vec3(-0.45, 0.75, 0.35));
    float sp1 = pow(max(dot(R, L1), 0.0), 120.0) * 2.4;
    float sp2 = pow(max(dot(R, L2), 0.0), 180.0) * 1.8;

    // ---- body color ----
    vec3 col = mix(uShallow, env, 0.35 + 0.65 * fr);
    col += uAmber * sp1 + uTeal * sp2;

    // ---- sparkle (fine-grained, subtle) ----
    vec2 cell = floor(p * 7.0) + floor(uTime * 4.0) * 0.37;
    float spark = step(0.992, hash(cell)) * clamp(fr * 1.6, 0.0, 1.0);
    col += vec3(0.9, 1.0, 0.95) * spark * 0.3;

    // ---- edge foam ----
    vec2 dEdge = abs(uHalf - abs(p));
    float edge = min(dEdge.x, dEdge.y);
    float foam = (1.0 - smoothstep(0.0, 0.42, edge)) * (0.55 + 0.45 * sin(uTime * 2.0 + h(p * 3.0) * 6.0));
    col = mix(col, vec3(0.75, 0.95, 0.9), foam * 0.3);

    gl_FragColor = vec4(col, 0.93);
    #include <colorspace_fragment>
  }
`;

const CAUSTIC_VERT = /* glsl */ `
  varying vec3 vWorld;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorld = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const CAUSTIC_FRAG = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColor;
  varying vec3 vWorld;
  void main() {
    vec2 p = vWorld.xz * 1.4;
    float t = uTime * 0.9;
    float a = sin(p.x * 2.6 + t) + sin(p.y * 3.1 - t * 1.3);
    float b = sin((p.x + p.y) * 2.0 + t * 0.7) + sin((p.x - p.y) * 2.8 - t);
    float c = pow(max(0.0, (a + b) * 0.25), 3.0);
    // second lattice rotated for richness
    float a2 = sin(p.x * -3.3 + t * 1.2) + sin(p.y * 2.4 + t);
    float c2 = pow(max(0.0, (a2 + b) * 0.25), 3.0);
    float v = c * 0.75 + c2 * 0.45;
    gl_FragColor = vec4(uColor * v, v * 0.85);
  }
`;

export interface WaterRig {
  water: THREE.Mesh;
  caustics: THREE.Mesh;
  update(t: number): void;
}

export function buildWater(
  cx: number,
  cz: number,
  w: number,
  d: number,
  waterY: number,
  poolFloorY: number
): WaterRig {
  const waterMat = new THREE.ShaderMaterial({
    vertexShader: WATER_VERT,
    fragmentShader: WATER_FRAG,
    uniforms: {
      uTime: { value: 0 },
      uDeep: { value: new THREE.Color(0x03181a) },
      uShallow: { value: new THREE.Color(0x0b4a42) },
      uSky: { value: new THREE.Color(0x155e56) },
      uAmber: { value: new THREE.Color(0xffb454) },
      uTeal: { value: new THREE.Color(0x53f5e5) },
      uHalf: { value: new THREE.Vector2(w / 2, d / 2) },
    },
    transparent: true,
  });

  const water = new THREE.Mesh(new THREE.PlaneGeometry(w, d, 48, 24), waterMat);
  water.rotation.x = -Math.PI / 2;
  water.position.set(cx, waterY, cz);

  const causticMat = new THREE.ShaderMaterial({
    vertexShader: CAUSTIC_VERT,
    fragmentShader: CAUSTIC_FRAG,
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(0x2dd4bf) },
    },
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const caustics = new THREE.Mesh(new THREE.PlaneGeometry(w, d), causticMat);
  caustics.rotation.x = -Math.PI / 2;
  caustics.position.set(cx, poolFloorY + 0.02, cz);

  return {
    water,
    caustics,
    update(t: number) {
      waterMat.uniforms.uTime.value = t;
      causticMat.uniforms.uTime.value = t;
    },
  };
}
