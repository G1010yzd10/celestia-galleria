import * as THREE from "three";

// ─── Celestial lagoon — BUDGET BROKEN EDITION ────────────────────────────────
// The lagoon now drinks from the SAME real-time planar mirror as the marble
// floor: the reflected temple (pillars, god rays, halos, ceiling) is sampled
// through the ripple-warped normal field. Layered under it: pearl-sky fresnel,
// golden sun speculars, iridescent thin-film sheen, edge foam, divine sparkle.
// The pool floor still gets additive aqua-and-gold caustics. Pure math + one
// shared render target: zero texture bytes of its own.

const WATER_VERT = /* glsl */ `
  uniform float uTime;
  uniform mat4 uTexMat;
  varying vec3 vWorld;
  varying vec4 vMirror;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    // gentle swell (local +z is world +y after the -90deg X rotation)
    float w = sin(wp.x * 1.6 + uTime * 1.1) * 0.5 + sin(wp.z * 2.2 - uTime * 0.8) * 0.5;
    wp.y += w * 0.028;
    vWorld = wp.xyz;
    vMirror = uTexMat * wp;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const WATER_FRAG = /* glsl */ `
  uniform float uTime;
  uniform float uMirror;      // 0 = analytic pearl only (LITE tier), 1 = full glory
  uniform sampler2D tDiffuse; // shared planar-mirror render target
  uniform vec3 uDeep;
  uniform vec3 uShallow;
  uniform vec3 uSky;
  uniform vec3 uSun;
  uniform vec3 uAqua;
  uniform vec2 uHalf; // pool half extents for edge foam
  varying vec3 vWorld;
  varying vec4 vMirror;

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

    // ---- pearl-sky environment reflection (base layer) ----
    float up = clamp(R.y * 0.5 + 0.5, 0.0, 1.0);
    vec3 env = mix(uDeep, uSky, up * up);

    // ---- TRUE planar reflection, warped by the living ripples ----
    // projective mirror coords, offset in the normal's XZ before the w-divide
    vec4 m = vMirror;
    m.xy += vec2(n.x, n.z) * m.w * 0.062;
    vec3 temple = texture2DProj(tDiffuse, m).rgb;

    // ---- golden sun + aqua strip speculars (analytic glints) ----
    vec3 L1 = normalize(vec3(0.12, 0.92, -0.18)); // sun through the oculus
    vec3 L2 = normalize(vec3(-0.45, 0.75, 0.35));
    float sp1 = pow(max(dot(R, L1), 0.0), 90.0) * 4.2;
    float sp2 = pow(max(dot(R, L2), 0.0), 190.0) * 1.8;

    // ---- body: pearl base, then the reflected temple laid over it ----
    vec3 col = mix(uShallow, env, 0.30 + 0.70 * fr);
    col = mix(col, temple * vec3(1.05, 1.01, 0.99), (0.40 + 0.52 * fr) * uMirror);
    col += uSun * sp1 + uAqua * sp2;

    // ---- iridescent thin-film sheen at grazing angles ----
    vec3 iri =
        vec3(0.95, 0.55, 0.72) * pow(fr, 4.0) * 0.09
      + vec3(0.55, 0.75, 0.95) * pow(fr, 6.0) * 0.07;
    col += iri;

    // ---- divine sparkle: gold-white glints ----
    vec2 cell = floor(p * 7.0) + floor(uTime * 4.0) * 0.37;
    float sp = hash(cell);
    float spark = step(0.985, sp) * clamp(fr * 1.8, 0.0, 1.0);
    col += mix(vec3(1.0, 0.9, 0.65), vec3(0.85, 1.0, 0.96), hash(cell + 3.1)) * spark * 0.55;

    // ---- edge foam ----
    vec2 dEdge = abs(uHalf - abs(p));
    float edge = min(dEdge.x, dEdge.y);
    float foam = (1.0 - smoothstep(0.0, 0.42, edge)) * (0.55 + 0.45 * sin(uTime * 2.0 + h(p * 3.0) * 6.0));
    col = mix(col, vec3(0.92, 0.99, 0.96), foam * 0.32);

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
  uniform vec3 uGold;
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
    // aqua caustics with a warm gold undertone (sun through the oculus)
    vec3 col = uColor * v + uGold * v * 0.42;
    gl_FragColor = vec4(col, v * 0.85);
  }
`;

export interface WaterRig {
  water: THREE.Mesh;
  caustics: THREE.Mesh;
  update(t: number): void;
  /** blend weight for the planar mirror (LITE tier runs analytic-only) */
  setMirror(on: boolean): void;
}

export function buildWater(
  cx: number,
  cz: number,
  w: number,
  d: number,
  waterY: number,
  poolFloorY: number,
  /** shared mirror render target (owned by the level) */
  mirrorTex: THREE.Texture,
  /** shared mirror projection matrix — updated in place every frame */
  texMat: THREE.Matrix4
): WaterRig {
  const waterMat = new THREE.ShaderMaterial({
    vertexShader: WATER_VERT,
    fragmentShader: WATER_FRAG,
    uniforms: {
      uTime: { value: 0 },
      uMirror: { value: 1 },
      tDiffuse: { value: mirrorTex },
      uTexMat: { value: texMat },
      uDeep: { value: new THREE.Color(0x0a3244) },
      uShallow: { value: new THREE.Color(0x27b8ac) },
      uSky: { value: new THREE.Color(0xaadbe6) },
      uSun: { value: new THREE.Color(0xffd98c) },
      uAqua: { value: new THREE.Color(0x8ff5e8) },
      uHalf: { value: new THREE.Vector2(w / 2, d / 2) },
    },
    transparent: true,
  });

  // budget-broken tessellation: 96×48 segments so the swell rolls like silk
  const water = new THREE.Mesh(new THREE.PlaneGeometry(w, d, 96, 48), waterMat);
  water.rotation.x = -Math.PI / 2;
  water.position.set(cx, waterY, cz);

  const causticMat = new THREE.ShaderMaterial({
    vertexShader: CAUSTIC_VERT,
    fragmentShader: CAUSTIC_FRAG,
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(0x5fe8d2) },
      uGold: { value: new THREE.Color(0xffe3a0) },
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
    setMirror(on: boolean) {
      waterMat.uniforms.uMirror.value = on ? 1 : 0;
    },
  };
}
