import * as THREE from "three";
import { parseMap, CELL, type LevelGrid } from "./types";
import { texWall, texCeil, texPedestal, texSign, texGlow, texBeam } from "./textures";
import { trackedCanvasTexture, mem } from "./memory";
import { buildWater, type WaterRig } from "./water";

// ─── CELESTIA GALLERIA — the atrium between worlds, BUDGET BROKEN ed. ──────
// Ivory marble, gilded coffered ceiling with an open oculus, god-ray light
// shafts falling onto a celestial lagoon, a true planar-mirror marble floor —
// and now a PMREM sky probe so every gold surface drinks the heavens.
// The 4 MB Doom club was left behind on purpose; the method stayed.

export const WALL_H = 4.2;
export const PED_SIZE = 0.9;
export const PED_TOP = 0.96;
export const FLOOR_Y = 0;
export const WATER_Y = -0.32;
export const POOL_FLOOR_Y = -1.1;

export interface PedestalInfo {
  col: number;
  row: number;
  pos: THREE.Vector3;
  facing: number;
  top: number;
}

export interface LevelRig {
  group: THREE.Group;
  grid: LevelGrid;
  pedestals: PedestalInfo[];
  pool: { cx: number; cz: number; w: number; d: number };
  spawn: { x: number; z: number; yaw: number };
  /** PMREM-baked pearl-sky cubemap — set as scene.environment by the engine */
  envTexture: THREE.Texture;
  /** owning RT for envTexture (disposed by the engine) */
  envRT: THREE.WebGLRenderTarget;
  update(t: number, dt: number): void;
  /** render the scene into the floor's mirror target (call before main pass) */
  renderReflection(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    hidden: THREE.Object3D[]
  ): void;
  /** toggle the mirror blend (lite quality tier runs marble-only) */
  setMirror(on: boolean): void;
}

// ── sky dome: animated pearl heavens, zero texture bytes ──
const SKY_VERT = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
  }
`;

const SKY_FRAG = /* glsl */ `
  uniform vec3 uZenith;
  uniform vec3 uHorizon;
  uniform vec3 uSunDir;
  uniform vec3 uSunCol;
  uniform float uTime;
  varying vec3 vDir;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
  float vnoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 4; i++) { v += a * vnoise(p); p = p * 2.03 + 17.1; a *= 0.5; }
    return v;
  }

  void main() {
    vec3 d = normalize(vDir);
    float h = clamp(d.y, -0.15, 1.0);
    vec3 col = mix(uHorizon, uZenith, pow(max(h, 0.0), 0.6));

    // sun + divine glare (restrained so bloom doesn't white-out)
    float s = max(dot(d, normalize(uSunDir)), 0.0);
    col += uSunCol * (pow(s, 400.0) * 1.6 + pow(s, 32.0) * 0.35 + pow(s, 7.0) * 0.10);

    // slow drifting pearl clouds
    vec2 cuv = vec2(atan(d.z, d.x) * 0.85, d.y * 2.6);
    float cl = fbm(cuv * 1.6 + vec2(uTime * 0.008, uTime * 0.0022));
    cl = smoothstep(0.48, 0.82, cl) * smoothstep(0.02, 0.30, d.y);
    col = mix(col, vec3(1.0, 0.985, 0.95), cl * 0.6);

    // faint golden shimmer band near horizon
    col += vec3(0.30, 0.22, 0.08) * pow(1.0 - abs(d.y), 9.0) * 0.5;

    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;

// ── god-ray shafts: fake volumetric light cylinders ──
const SHAFT_VERT = /* glsl */ `
  varying vec3 vNormalW;
  varying vec3 vWorld;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorld = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const SHAFT_FRAG = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uIntensity;
  varying vec3 vNormalW;
  varying vec3 vWorld;
  varying vec2 vUv;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
  float vnoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  void main() {
    vec3 V = normalize(cameraPosition - vWorld);
    vec3 N = normalize(vNormalW);
    float facing = abs(dot(N, V));          // fade at silhouette edges
    float body = pow(facing, 1.7);
    float vert = mix(0.30, 1.05, vUv.y);    // brighter toward heaven (top)
    float shimmer = 0.55 + 0.45 * vnoise(vec2(vUv.x * 9.0, vUv.y * 4.0 - uTime * 0.22));
    float a = body * vert * shimmer * uIntensity;
    gl_FragColor = vec4(uColor, a);
  }
`;

// ── mirror marble floor: PROCEDURAL pearl marble + true planar reflection ──
const FLOOR_VERT = /* glsl */ `
  uniform mat4 uTexMat;
  varying vec3 vWorld;
  varying vec4 vMirror;
  #include <fog_pars_vertex>
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorld = wp.xyz;
    vMirror = uTexMat * wp;
    vec4 mvPosition = viewMatrix * wp;
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`;

const FLOOR_FRAG = /* glsl */ `
  uniform sampler2D tDiffuse;
  uniform float uTime;
  uniform float uMirror;
  uniform vec3 uPoolCenter;
  uniform vec2 uPoolHalf;
  varying vec3 vWorld;
  varying vec4 vMirror;
  #include <fog_pars_fragment>

  float fhash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
  float fnoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(fhash(i), fhash(i + vec2(1.0, 0.0)), u.x),
      mix(fhash(i + vec2(0.0, 1.0)), fhash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }
  float ffbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 4; i++) { v += a * fnoise(p); p = p * 2.03 + 17.1; a *= 0.5; }
    return v;
  }

  void main() {
    vec2 mw = vWorld.xz;
    // ---- procedural pearl marble (infinite detail, zero VRAM) ----
    vec3 base = vec3(0.83, 0.85, 0.835);
    float n1 = ffbm(mw * 0.9);
    float n2 = ffbm(mw * 0.9 + 4.7);
    base += vec3(0.0, 0.035, 0.03) * smoothstep(0.4, 0.75, n1);        // opal aqua wash
    base += vec3(0.045, 0.02, 0.05) * smoothstep(0.45, 0.8, n2);       // opal rose wash
    base += vec3(0.07, 0.05, 0.0) * smoothstep(0.5, 0.82, ffbm(mw * 0.35 + 9.2)); // gold mist
    // flowing gold veins: warped ridge lines of fbm (wide enough to read)
    float vein1 = abs(sin((ffbm(mw * 1.35 + 2.2) * 7.0 + mw.x * 0.4) * 3.14159));
    float vein2 = abs(sin((ffbm(mw * 1.05 + 7.7) * 8.0 - mw.y * 0.35) * 3.14159));
    float goldV = pow(1.0 - vein1, 8.0) * 0.9 + pow(1.0 - vein2, 14.0) * 0.7;
    base += vec3(0.85, 0.58, 0.16) * goldV;
    // dark marbling for contrast against the gold
    base = mix(base, vec3(0.52, 0.50, 0.44), pow(1.0 - vein2, 22.0) * 0.5);
    // subtle slab seams every 2.4 m
    vec2 seam = abs(fract(mw / 2.4) - 0.5);
    base = mix(base, vec3(0.62, 0.60, 0.54), smoothstep(0.475, 0.5, max(seam.x, seam.y)) * 0.4);

    // golden sun cast from the oculus: wide warm pool + tight hot core
    vec2 dp = abs(vWorld.xz - uPoolCenter.xz) - uPoolHalf;
    float dpool = length(max(dp, vec2(0.0)));
    base += vec3(0.26, 0.18, 0.06) * exp(-dpool * 0.95) * (0.8 + 0.2 * sin(uTime * 0.9));
    base += vec3(0.32, 0.24, 0.09) * exp(-dpool * 2.4);
    base += vec3(0.05, 0.20, 0.18) * exp(-dpool * 1.5) * (0.75 + 0.25 * sin(uTime * 1.7));

    // true mirror reflection, fresnel-weighted (grazing angles go glassy)
    vec3 refl = texture2DProj(tDiffuse, vMirror).rgb;
    vec3 V = normalize(cameraPosition - vWorld);
    float fr = pow(1.0 - clamp(V.y, 0.0, 1.0), 3.0);
    vec3 col = mix(base, refl, (0.26 + 0.74 * fr) * uMirror);

    // halo-light strip streaks
    float streakN = exp(-abs(vWorld.z - 0.12) * 1.35);
    float streakE = exp(-abs(vWorld.x - 19.08) * 1.35);
    col += vec3(0.06, 0.30, 0.27) * streakN * fr;
    col += vec3(0.30, 0.20, 0.05) * streakE * fr;

    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
    #include <fog_fragment>
  }
`;

function scaleUV(geo: THREE.BufferGeometry, sx: number, sy: number) {
  const uv = geo.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) {
    uv.setXY(i, uv.getX(i) * sx, uv.getY(i) * sy);
  }
  uv.needsUpdate = true;
}

function wallPlane(
  w: number,
  tilesX: number,
  mat: THREE.Material,
  pos: [number, number, number],
  rotY: number
) {
  const g = new THREE.PlaneGeometry(w, WALL_H);
  scaleUV(g, tilesX, WALL_H / CELL);
  const m = new THREE.Mesh(g, mat);
  m.position.set(...pos);
  m.rotation.y = rotY;
  return m;
}

function neonStrip(
  len: number,
  color: THREE.Color,
  pos: [number, number, number],
  rotY: number,
  haloTex: THREE.Texture
) {
  const g = new THREE.Group();
  const strip = new THREE.Mesh(
    new THREE.BoxGeometry(len, 0.07, 0.05),
    new THREE.MeshBasicMaterial({ color })
  );
  strip.position.set(0, 0, 0.03);
  g.add(strip);
  const halo = new THREE.Mesh(
    new THREE.PlaneGeometry(len, 0.46),
    new THREE.MeshBasicMaterial({
      map: haloTex,
      color,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.55,
      side: THREE.DoubleSide,
      fog: true,
    })
  );
  halo.rotation.z = Math.PI / 2;
  halo.position.set(0, 0, 0.015);
  g.add(halo);
  g.position.set(...pos);
  g.rotation.y = rotY;
  return g;
}

function sign(
  text: string,
  w: number,
  pos: [number, number, number],
  rotY: number,
  accent?: string
) {
  const canvas = texSign(text, accent);
  const tex = trackedCanvasTexture(canvas, true);
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  const h = (w * canvas.height) / canvas.width;
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      fog: true,
      color: new THREE.Color(1.25, 1.25, 1.25),
    })
  );
  m.position.set(...pos);
  m.rotation.y = rotY;
  return m;
}

const GOLD = 0xc9962e;
const GOLD_BRIGHT = new THREE.Color(0xffd98c).multiplyScalar(2.0);
const AQUA_BRIGHT = new THREE.Color(0x3fd8c8).multiplyScalar(2.0);

export function buildLevel(renderer: THREE.WebGLRenderer): LevelRig {
  const group = new THREE.Group();
  const grid = parseMap();
  const W = grid.w * CELL; // 19.2
  const D = grid.h * CELL; // 16.8
  const cx = W / 2;
  const cz = D / 2;

  // ── textures (shared) ──
  const wallTex = trackedCanvasTexture(texWall());
  const ceilTex = trackedCanvasTexture(texCeil());
  const pedTex = trackedCanvasTexture(texPedestal());
  const beamTex = trackedCanvasTexture(texBeam(), false);
  beamTex.wrapS = THREE.ClampToEdgeWrapping;
  const glowTex = trackedCanvasTexture(texGlow(), false);
  glowTex.wrapS = THREE.ClampToEdgeWrapping;
  glowTex.wrapT = THREE.ClampToEdgeWrapping;

  const wallMat = new THREE.MeshStandardMaterial({
    map: wallTex,
    roughness: 0.38,
    metalness: 0.12,
  });
  const goldMat = new THREE.MeshStandardMaterial({
    color: GOLD,
    roughness: 0.22,
    metalness: 1.0,
    emissive: 0x2a1c05,
    emissiveIntensity: 0.6,
  });
  // ── sky dome (seen through the oculus) ──
  const skyMat = new THREE.ShaderMaterial({
    vertexShader: SKY_VERT,
    fragmentShader: SKY_FRAG,
    uniforms: {
      uZenith: { value: new THREE.Color(0x86c8ea) },
      uHorizon: { value: new THREE.Color(0xfff3da) },
      uSunDir: { value: new THREE.Vector3(0.1, 1.0, 0.05).normalize() },
      uSunCol: { value: new THREE.Color(1.0, 0.93, 0.78) },
      uTime: { value: 0 },
    },
    side: THREE.BackSide,
    depthWrite: false,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(30, 32, 18), skyMat);
  sky.position.set(cx, 1.5, cz);
  sky.renderOrder = -10;
  group.add(sky);

  // ── environment probe: bake the pearl heavens into a PMREM cubemap so ──
  // every gold surface (cornices, capitals, reliquaries, halos) reflects the
  // sky. THE budget-broken glow-up: ~1.4 MB once, infinite divinity.
  const envScene = new THREE.Scene();
  const envSky = new THREE.Mesh(new THREE.SphereGeometry(30, 24, 14), skyMat);
  envScene.add(envSky);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envRT = pmrem.fromScene(envScene, 0.07);
  pmrem.dispose();
  envSky.geometry.dispose();
  const envTexture = envRT.texture;
  // cubemap ≈ 6 faces + mips — registered so the HUD stays honest
  mem.register(envTexture, 256, 256 * 6, true);

  // ── heaven reflections: every PBR surface now drinks the sky probe ──
  wallMat.envMapIntensity = 0.4;
  goldMat.envMapIntensity = 1.35;

  // ── perimeter walls ──
  group.add(wallPlane(W, W / CELL, wallMat, [cx, WALL_H / 2, 0], 0));
  group.add(wallPlane(W, W / CELL, wallMat, [cx, WALL_H / 2, D], Math.PI));
  group.add(wallPlane(D, D / CELL, wallMat, [W, WALL_H / 2, cz], -Math.PI / 2));
  group.add(wallPlane(D, D / CELL, wallMat, [0, WALL_H / 2, cz], Math.PI / 2));

  // ── gilded cornice + base rails ──
  const trim = (len: number, pos: [number, number, number], rotY: number) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(len, 0.07, 0.07), goldMat);
    m.position.set(...pos);
    m.rotation.y = rotY;
    group.add(m);
  };
  trim(W - 0.3, [cx, WALL_H - 0.14, 0.08], 0);
  trim(W - 0.3, [cx, WALL_H - 0.14, D - 0.08], 0);
  trim(D - 0.3, [W - 0.08, WALL_H - 0.14, cz], Math.PI / 2);
  trim(D - 0.3, [0.08, WALL_H - 0.14, cz], Math.PI / 2);
  trim(W - 0.3, [cx, 0.16, 0.08], 0);
  trim(W - 0.3, [cx, 0.16, D - 0.08], 0);
  trim(D - 0.3, [W - 0.08, 0.16, cz], Math.PI / 2);
  trim(D - 0.3, [0.08, 0.16, cz], Math.PI / 2);

  // ── pool rectangle (from map art rows 4..7, cols 4..11) ──
  const poolX0 = 4 * CELL,
    poolX1 = 12 * CELL,
    poolZ0 = 4 * CELL,
    poolZ1 = 8 * CELL;
  const pool = {
    cx: (poolX0 + poolX1) / 2,
    cz: (poolZ0 + poolZ1) / 2,
    w: poolX1 - poolX0,
    d: poolZ1 - poolZ0,
  };

  // ── mirror marble floor (4 segments around the pool hole) ──
  // reflection render target — 896×448 RGBA, honestly tracked. The 4 MB club
  // is gone; the mirror got 4× the pixels so the reflections read like glass.
  const MIRROR_W = 896;
  const MIRROR_H = 448;
  const mirrorRT = new THREE.WebGLRenderTarget(MIRROR_W, MIRROR_H);
  mirrorRT.texture.minFilter = THREE.LinearFilter;
  mirrorRT.texture.magFilter = THREE.LinearFilter;
  mirrorRT.texture.generateMipmaps = false;
  mem.register(mirrorRT.texture, MIRROR_W, MIRROR_H, false);

  // shared mirror projection matrix — the floor AND the lagoon water sample
  // through this exact object (updated in place every frame)
  const texMat = new THREE.Matrix4();

  const floorMat = new THREE.ShaderMaterial({
    vertexShader: FLOOR_VERT,
    fragmentShader: FLOOR_FRAG,
    uniforms: THREE.UniformsUtils.merge([
      THREE.UniformsLib.fog,
      {
        tDiffuse: { value: null },
        uTexMat: { value: new THREE.Matrix4() },
        uTime: { value: 0 },
        uMirror: { value: 1 },
        uPoolCenter: { value: new THREE.Vector3(pool.cx, 0, pool.cz) },
        uPoolHalf: { value: new THREE.Vector2(pool.w / 2, pool.d / 2) },
      },
    ]),
    fog: true,
  });
  const fu = floorMat.uniforms as Record<string, { value: unknown }>;
  // re-bind the live render-target AFTER merge — mergeUniforms clones texture
  // values, which would sever the mirror sampling. Same for the shared matrix.
  fu.tDiffuse.value = mirrorRT.texture;
  fu.uTexMat.value = texMat;

  const floorSegs: THREE.Mesh[] = [];
  const segs: [number, number, number, number][] = [
    [cx, poolZ0 / 2, W, poolZ0],
    [cx, (poolZ1 + D) / 2, W, D - poolZ1],
    [poolX0 / 2, (poolZ0 + poolZ1) / 2, poolX0, poolZ1 - poolZ0],
    [(poolX1 + W) / 2, (poolZ0 + poolZ1) / 2, W - poolX1, poolZ1 - poolZ0],
  ];
  for (const [px, pz, pw, pd] of segs) {
    const f = new THREE.Mesh(new THREE.PlaneGeometry(pw, pd), floorMat);
    f.rotation.x = -Math.PI / 2;
    f.position.set(px, FLOOR_Y, pz);
    group.add(f);
    floorSegs.push(f);
  }

  // ── mirror camera rig (planar reflection across y = FLOOR_Y) ──
  const virtualCam = new THREE.PerspectiveCamera();
  const _camPos = new THREE.Vector3();
  const _camDir = new THREE.Vector3();
  const _camUp = new THREE.Vector3();
  const _mPos = new THREE.Vector3();
  const _mTarget = new THREE.Vector3();
  const _q = new THREE.Vector4();
  const _plane = new THREE.Plane();
  const BIAS = new THREE.Matrix4().set(
    0.5, 0, 0, 0.5,
    0, 0.5, 0, 0.5,
    0, 0, 0.5, 0.5,
    0, 0, 0, 1
  );

  function renderReflection(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    hidden: THREE.Object3D[]
  ) {
    camera.getWorldPosition(_camPos);
    camera.getWorldDirection(_camDir);
    _camUp.set(0, 1, 0).applyQuaternion(camera.getWorldQuaternion(new THREE.Quaternion()));

    // mirror camera across the y = FLOOR_Y plane
    _mPos.set(_camPos.x, 2 * FLOOR_Y - _camPos.y, _camPos.z);
    const mDir = new THREE.Vector3(_camDir.x, -_camDir.y, _camDir.z);
    const mUp = new THREE.Vector3(_camUp.x, -_camUp.y, _camUp.z);
    _mTarget.copy(_mPos).add(mDir);
    virtualCam.up.copy(mUp);
    virtualCam.position.copy(_mPos);
    virtualCam.lookAt(_mTarget);
    virtualCam.near = camera.near;
    virtualCam.far = camera.far;
    virtualCam.projectionMatrix.copy(camera.projectionMatrix);
    virtualCam.updateMatrixWorld();

    // projective sampling matrix (world → mirror-clip → [0,1]) — shared object,
    // the water shader samples the same live matrix
    texMat
      .copy(BIAS)
      .multiply(virtualCam.projectionMatrix)
      .multiply(virtualCam.matrixWorldInverse);

    // oblique near-plane clipping so nothing below the floor leaks in
    _plane.setFromNormalAndCoplanarPoint(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(0, FLOOR_Y, 0)
    );
    _plane.applyMatrix4(virtualCam.matrixWorldInverse);
    const clip = new THREE.Vector4(
      _plane.normal.x, _plane.normal.y, _plane.normal.z, _plane.constant
    );
    const pm = virtualCam.projectionMatrix;
    _q.x = (Math.sign(clip.x) + pm.elements[8]) / pm.elements[0];
    _q.y = (Math.sign(clip.y) + pm.elements[9]) / pm.elements[5];
    _q.z = -1.0;
    _q.w = (1.0 + pm.elements[10]) / pm.elements[14];
    clip.multiplyScalar(2.0 / clip.dot(_q));
    pm.elements[2] = clip.x;
    pm.elements[6] = clip.y;
    pm.elements[10] = clip.z + 1.0;
    pm.elements[14] = clip.w;
    virtualCam.projectionMatrixInverse.copy(pm).invert();

    // render the reflected world (self + caller-hidden objects removed)
    for (const f of floorSegs) f.visible = false;
    for (const h of hidden) h.visible = false;
    const prevRT = renderer.getRenderTarget();
    try {
      renderer.setRenderTarget(mirrorRT);
      renderer.render(scene, virtualCam);
    } finally {
      renderer.setRenderTarget(prevRT);
      for (const f of floorSegs) f.visible = true;
      for (const h of hidden) h.visible = true;
    }
  }

  function setMirror(on: boolean) {
    fu.uMirror.value = on ? 1 : 0;
    water.setMirror(on);
  }

  // ── pool cavity ──
  const cavityMat = new THREE.MeshStandardMaterial({
    color: 0x0c2a33,
    roughness: 0.85,
    metalness: 0.15,
  });
  const cavityH = FLOOR_Y - POOL_FLOOR_Y;
  const cw: [number, number, number, number][] = [
    [pool.cx, POOL_FLOOR_Y + cavityH / 2, poolZ0, 0],
    [pool.cx, POOL_FLOOR_Y + cavityH / 2, poolZ1, Math.PI],
    [poolX0, POOL_FLOOR_Y + cavityH / 2, pool.cz, Math.PI / 2],
    [poolX1, POOL_FLOOR_Y + cavityH / 2, pool.cz, -Math.PI / 2],
  ];
  for (const [px, py, pz, ry] of cw) {
    const wMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(ry === 0 || ry === Math.PI ? pool.w : pool.d, cavityH),
      cavityMat
    );
    wMesh.position.set(px, py, pz);
    wMesh.rotation.y = ry;
    group.add(wMesh);
  }
  const poolFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(pool.w, pool.d),
    new THREE.MeshStandardMaterial({ color: 0x083038, roughness: 1, metalness: 0 })
  );
  poolFloor.rotation.x = -Math.PI / 2;
  poolFloor.position.set(pool.cx, POOL_FLOOR_Y, pool.cz);
  group.add(poolFloor);

  // water rig (celestial lagoon — drinks from the shared planar mirror)
  const water: WaterRig = buildWater(
    pool.cx,
    pool.cz,
    pool.w - 0.06,
    pool.d - 0.06,
    WATER_Y,
    POOL_FLOOR_Y,
    mirrorRT.texture,
    texMat
  );
  group.add(water.water, water.caustics);

  // ── pool curb: gold with aqua underglow ──
  const curbMat = new THREE.MeshStandardMaterial({
    color: GOLD,
    roughness: 0.28,
    metalness: 1.0,
  });
  const glowMat = new THREE.MeshBasicMaterial({ color: AQUA_BRIGHT });
  const curbH = 0.1;
  const curbs: [number, number, number, number][] = [
    [pool.cx, FLOOR_Y + curbH / 2, poolZ0 - 0.07, pool.w + 0.28],
    [pool.cx, FLOOR_Y + curbH / 2, poolZ1 + 0.07, pool.w + 0.28],
    [poolX0 - 0.07, FLOOR_Y + curbH / 2, pool.cz, pool.d + 0.28],
    [poolX1 + 0.07, FLOOR_Y + curbH / 2, pool.cz, pool.d + 0.28],
  ];
  for (const [px, py, pz, len] of curbs) {
    const horiz = pz < pool.cz - 2 || pz > pool.cz + 2;
    const b = new THREE.Mesh(
      new THREE.BoxGeometry(horiz ? len : 0.14, curbH, horiz ? 0.14 : len),
      curbMat
    );
    b.position.set(px, py, pz);
    group.add(b);
    const gl = new THREE.Mesh(
      new THREE.BoxGeometry(horiz ? len - 0.1 : 0.05, 0.025, horiz ? 0.05 : len - 0.1),
      glowMat
    );
    const inZ = pz < cz ? 1 : -1;
    const inX = px < cx ? 1 : -1;
    gl.position.set(
      px + (horiz ? 0 : inX * 0.06),
      FLOOR_Y + 0.035,
      pz + (horiz ? inZ * 0.06 : 0)
    );
    group.add(gl);
  }

  // ── gilded coffered ceiling with open elliptical oculus ──
  const ocRx = Math.min(pool.w, pool.d) * 0.42; // ~2.0
  const ocRy = Math.min(pool.w, pool.d) * 0.34;
  const ceilShape = new THREE.Shape();
  ceilShape.moveTo(-W / 2, -D / 2);
  ceilShape.lineTo(W / 2, -D / 2);
  ceilShape.lineTo(W / 2, D / 2);
  ceilShape.lineTo(-W / 2, D / 2);
  ceilShape.closePath();
  const hole = new THREE.Path();
  hole.absellipse(
    pool.cx - cx,
    pool.cz - cz,
    ocRx,
    ocRy,
    0,
    Math.PI * 2,
    true,
    0
  );
  ceilShape.holes.push(hole);
  const ceilGeo = new THREE.ShapeGeometry(ceilShape, 48);
  ceilGeo.rotateX(Math.PI / 2); // face down
  scaleUV(ceilGeo, 1 / CELL, 1 / CELL);
  const ceil = new THREE.Mesh(
    ceilGeo,
    new THREE.MeshStandardMaterial({ map: ceilTex, roughness: 0.5, metalness: 0.35 })
  );
  ceil.position.set(cx, WALL_H, cz);
  group.add(ceil);

  // oculus gold rim (ellipse approximated by segments)
  const RIM_SEG = 40;
  for (let i = 0; i < RIM_SEG; i++) {
    const a0 = (i / RIM_SEG) * Math.PI * 2;
    const a1 = ((i + 1) / RIM_SEG) * Math.PI * 2;
    const x0 = pool.cx + Math.cos(a0) * ocRx;
    const z0 = pool.cz + Math.sin(a0) * ocRy;
    const x1 = pool.cx + Math.cos(a1) * ocRx;
    const z1 = pool.cz + Math.sin(a1) * ocRy;
    const len = Math.hypot(x1 - x0, z1 - z0) + 0.02;
    const seg = new THREE.Mesh(new THREE.BoxGeometry(len, 0.14, 0.16), goldMat);
    seg.position.set((x0 + x1) / 2, WALL_H - 0.02, (z0 + z1) / 2);
    seg.rotation.y = -Math.atan2(z1 - z0, x1 - x0);
    group.add(seg);
  }
  // sun glare disc just under the oculus (bloom feeder)
  const glare = new THREE.Mesh(
    new THREE.CircleGeometry(1, 32),
    new THREE.MeshBasicMaterial({
      map: glowTex,
      color: new THREE.Color(1.9, 1.7, 1.35),
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
    })
  );
  glare.rotation.x = Math.PI / 2; // face down
  glare.scale.set(ocRx * 0.72, ocRy * 0.72, 1);
  glare.position.set(pool.cx, WALL_H - 0.1, pool.cz);
  glare.renderOrder = 6;
  group.add(glare);

  // ── god-ray shafts: fake volumetric light cylinders ──
  // four nested cones down the oculus onto the lagoon, plus four slim
  // columns of sanctum light over the pedestal shrines
  const shafts: THREE.Mesh[] = [];
  const shaftSpecs: [number, number, number, number, number, number][] = [
    // [x, z, radius, intensity, tiltZ, tiltX] — first 4 = oculus, then pedestals
    [pool.cx, pool.cz, 0.42, 0.5, 0.02, 0.015],
    [pool.cx, pool.cz, 0.85, 0.34, -0.03, 0.02],
    [pool.cx, pool.cz, 1.35, 0.22, 0.05, -0.03],
    [pool.cx, pool.cz, 1.9, 0.12, -0.06, 0.04],
    [4.2, 3.0, 0.5, 0.15, 0.03, -0.02],
    [15.0, 3.0, 0.5, 0.15, -0.03, 0.02],
    [4.2, 13.8, 0.55, 0.12, 0.02, 0.03],
    [15.0, 13.8, 0.55, 0.12, -0.02, -0.03],
    [9.0, 1.8, 0.9, 0.11, 0.02, -0.02], // north gallery — the Forge shrines
  ];
  for (let i = 0; i < shaftSpecs.length; i++) {
    const [sx, sz, r, inten, tz, tx] = shaftSpecs[i];
    const bottom = i < 4 ? WATER_Y : FLOOR_Y; // oculus shafts fall into the lagoon
    const shaftHeight = WALL_H - bottom;
    const mat = new THREE.ShaderMaterial({
      vertexShader: SHAFT_VERT,
      fragmentShader: SHAFT_FRAG,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(1.0, 0.93, 0.78) },
        uIntensity: { value: inten },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const m = new THREE.Mesh(
      new THREE.CylinderGeometry(r, r * 0.82, shaftHeight, 24, 1, true),
      mat
    );
    m.position.set(sx, (WALL_H + bottom) / 2, sz);
    m.rotation.z = tz;
    m.rotation.x = tx;
    m.renderOrder = 7;
    group.add(m);
    shafts.push(m);
  }

  // ── pillars: marble with gilded capitals ──
  const pillarCells: [number, number][] = [
    [2, 5],
    [13, 5],
    [2, 8],
    [13, 8],
  ];
  for (const [col, row] of pillarCells) {
    grid.cells[row * grid.w + col] = 1;
    const px = col * CELL + CELL / 2;
    const pz = row * CELL + CELL / 2;
    const p = new THREE.Mesh(new THREE.BoxGeometry(1.1, WALL_H, 1.1), wallMat);
    p.position.set(px, WALL_H / 2, pz);
    group.add(p);
    // gilded capital + base
    for (const y of [WALL_H - 0.09, 0.09]) {
      const cap = new THREE.Mesh(new THREE.BoxGeometry(1.26, 0.18, 1.26), goldMat);
      cap.position.set(px, y, pz);
      group.add(cap);
    }
    // aqua light strip facing the lagoon
    const dir = Math.atan2(pool.cx - px, pool.cz - pz);
    const strip = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, WALL_H - 0.7, 0.08),
      new THREE.MeshBasicMaterial({ color: AQUA_BRIGHT })
    );
    strip.position.set(px + Math.sin(dir) * 0.58, WALL_H / 2, pz + Math.cos(dir) * 0.58);
    group.add(strip);
  }

  // ── pedestals ──
  const pedMat = new THREE.MeshStandardMaterial({
    map: pedTex,
    roughness: 0.3,
    metalness: 0.25,
    envMapIntensity: 0.5,
  });
  const capMat = new THREE.MeshStandardMaterial({
    color: 0xf5efdd,
    roughness: 0.12,
    metalness: 0.85,
    emissive: 0x40300e,
    emissiveIntensity: 0.7,
    envMapIntensity: 1.25,
  });
  const spawn = { x: 7 * CELL + CELL / 2, z: 12 * CELL + CELL / 2, yaw: 0 };
  const pedestals: PedestalInfo[] = [];
  // two passes so the FORGE SHRINES land at the END of the array: catalog
  // relics claim the core temple first, custom uploads fill the north
  // gallery + freed south pair afterwards (engine tracks occupancy).
  const pedestalPasses: [number, number][] = [
    [2, grid.h - 1], // core temple (rows 2..h-1)
    [0, 2], // north gallery forge shrines (rows 0..1)
  ];
  for (const [rowStart, rowEnd] of pedestalPasses) {
    for (let row = rowStart; row < rowEnd; row++) {
      for (let col = 0; col < grid.w; col++) {
        if (grid.cells[row * grid.w + col] !== 3) continue;
        const px = col * CELL + CELL / 2;
        const pz = row * CELL + CELL / 2;
        const ped = new THREE.Mesh(new THREE.BoxGeometry(PED_SIZE, PED_TOP - 0.02, PED_SIZE), pedMat);
        ped.position.set(px, (PED_TOP - 0.02) / 2, pz);
        group.add(ped);
        const cap = new THREE.Mesh(new THREE.BoxGeometry(PED_SIZE + 0.05, 0.025, PED_SIZE + 0.05), capMat);
        cap.position.set(px, PED_TOP - 0.012, pz);
        group.add(cap);
        const facing = Math.atan2(spawn.x - px, spawn.z - pz);
        pedestals.push({ col, row, pos: new THREE.Vector3(px, 0, pz), facing, top: PED_TOP });
      }
    }
  }

  // ── gilded reliquaries — the Doom crates, promoted to heaven ──
  // Mirror marble under them, pearl sky painted on their gold: the boxes
  // the original request dreamed of, drinking both reflections at once.
  const crateMat = new THREE.MeshPhysicalMaterial({
    color: GOLD,
    metalness: 1.0,
    roughness: 0.16,
    clearcoat: 1.0,
    clearcoatRoughness: 0.14,
    envMapIntensity: 1.6,
    emissive: 0x241804,
    emissiveIntensity: 0.45,
  });
  const crateTrimMat = new THREE.MeshPhysicalMaterial({
    color: 0x8f6a1e,
    metalness: 1.0,
    roughness: 0.3,
    envMapIntensity: 1.2,
  });
  function reliquary(x: number, z: number, s: number, rotY: number) {
    const rg = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(s, s * 0.62, s), crateMat);
    body.position.y = s * 0.31;
    rg.add(body);
    const belt = new THREE.Mesh(new THREE.BoxGeometry(s * 1.03, s * 0.07, s * 1.03), crateTrimMat);
    belt.position.y = s * 0.42;
    rg.add(belt);
    const lid = new THREE.Mesh(new THREE.BoxGeometry(s * 1.05, s * 0.18, s * 1.05), crateMat);
    lid.position.y = s * 0.62 + s * 0.09;
    rg.add(lid);
    // relic gem — a sliver of the aqua lagoon, glowing through the gold
    const gem = new THREE.Mesh(
      new THREE.BoxGeometry(s * 0.22, s * 0.15, s * 0.22),
      new THREE.MeshStandardMaterial({
        color: 0x67e8d8,
        emissive: 0x2dd4bf,
        emissiveIntensity: 2.6,
        roughness: 0.2,
        metalness: 0.1,
      })
    );
    gem.position.y = s * 0.8 + s * 0.14;
    rg.add(gem);
    rg.position.set(x, FLOOR_Y, z);
    rg.rotation.y = rotY;
    group.add(rg);
    // block the cell so pilgrims orbit, not clip
    const col = Math.floor(x / CELL);
    const row = Math.floor(z / CELL);
    if (col >= 0 && col < grid.w && row >= 0 && row < grid.h) {
      grid.cells[row * grid.w + col] = 1;
    }
  }
  reliquary(2.55, 2.55, 0.86, 0.4);
  reliquary(17.0, 8.9, 0.78, -0.7);
  reliquary(14.6, 15.3, 0.9, 0.25);
  reliquary(4.6, 15.0, 0.5, 0.9); // small offering box by the south pedestals

  // ── halo light strips ──
  group.add(neonStrip(W - 1.2, AQUA_BRIGHT, [cx, 3.35, 0.06], 0, beamTex)); // N aqua
  group.add(neonStrip(D - 1.2, AQUA_BRIGHT, [W - 0.06, 3.35, cz], Math.PI / 2, beamTex)); // E aqua
  group.add(neonStrip(D - 1.2, GOLD_BRIGHT, [0.06, 3.35, cz], -Math.PI / 2, beamTex)); // W gold
  group.add(neonStrip(6.5, GOLD_BRIGHT, [cx - 5.6, 3.1, D - 0.06], Math.PI, beamTex)); // S gold L
  group.add(neonStrip(6.5, GOLD_BRIGHT, [cx + 5.6, 3.1, D - 0.06], Math.PI, beamTex)); // S gold R

  group.add(sign("CELESTIA GALLERIA", 5.2, [cx, 2.55, 0.03], 0, "#ffd98c"));
  group.add(sign("EXIT", 1.5, [cx, 2.2, D - 0.03], Math.PI, "#9de8b8"));
  group.add(sign("OPTICS", 1.9, [3 * CELL + 0.6, 1.9, 0.03], 0, "#3fd8c8"));
  group.add(sign("GAMING", 1.9, [12 * CELL + 0.6, 1.9, 0.03], 0, "#3fd8c8"));
  group.add(sign("AUDIO", 1.9, [W - 0.03, 1.9, 7 * CELL + 1.8], -Math.PI / 2, "#3fd8c8"));
  group.add(sign("WEARABLES", 2.2, [0.03, 1.9, 7 * CELL + 0.6], Math.PI / 2, "#3fd8c8"));
  group.add(sign("AERIAL", 1.9, [10.5 * CELL, 1.9, D - 0.03], Math.PI, "#3fd8c8"));
  group.add(sign("FOOTWEAR", 1.9, [13 * CELL, 1.9, D - 0.03], Math.PI, "#3fd8c8"));
  group.add(sign("COMPUTING", 2.0, [3 * CELL + 0.6, 1.9, D - 0.03], Math.PI, "#3fd8c8"));

  // ── lights (temple of retail) ──
  const hemi = new THREE.HemisphereLight(0xfff5e0, 0x6b7a80, 0.8);
  group.add(hemi);
  const sun = new THREE.DirectionalLight(0xffeecf, 1.5);
  sun.position.set(pool.cx + 2.5, WALL_H + 5, pool.cz - 1.5);
  sun.target.position.set(pool.cx, 0, pool.cz);
  group.add(sun, sun.target);
  const oculusGlow = new THREE.PointLight(0xffe4b0, 14, 15, 2);
  oculusGlow.position.set(pool.cx, WALL_H - 0.8, pool.cz);
  group.add(oculusGlow);
  const poolLight = new THREE.PointLight(0x49e0d0, 24, 22, 2);
  poolLight.position.set(pool.cx, WATER_Y + 0.7, pool.cz);
  group.add(poolLight);
  const exitLight = new THREE.PointLight(0xffd98c, 9, 12, 2);
  exitLight.position.set(spawn.x, 2.6, spawn.z - 1.5);
  group.add(exitLight);
  const seraphLight = new THREE.PointLight(0xfff0c8, 7, 11, 2);
  seraphLight.position.set(3 * CELL + 0.6, 2.9, 9 * CELL + 0.6);
  group.add(seraphLight);

  // ── angel dust: golden motes rising through the light ──
  const DUST = 360;
  const dustGeo = new THREE.BufferGeometry();
  const dustPos = new Float32Array(DUST * 3);
  const dustSeed = new Float32Array(DUST);
  for (let i = 0; i < DUST; i++) {
    dustPos[i * 3] = Math.random() * W;
    dustPos[i * 3 + 1] = 0.4 + Math.random() * (WALL_H - 0.8);
    dustPos[i * 3 + 2] = Math.random() * D;
    dustSeed[i] = Math.random() * Math.PI * 2;
  }
  dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
  const dust = new THREE.Points(
    dustGeo,
    new THREE.PointsMaterial({
      color: new THREE.Color(0xffdf9e).multiplyScalar(1.8),
      size: 0.03,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: true,
    })
  );
  group.add(dust);

  // ── wandering light orbs (soft golden spirits) ──
  const orbs: THREE.Sprite[] = [];
  const orbSpecs: [number, number, number, number, number][] = [
    // [x, z, height, scale, speed]
    [3.5, 3.5, 2.6, 0.5, 0.11],
    [15.5, 4.2, 3.1, 0.38, 0.14],
    [16.2, 12.5, 2.2, 0.55, 0.09],
    [3.0, 12.8, 3.4, 0.42, 0.12],
    [9.6, 2.6, 3.0, 0.34, 0.16],
    [9.6, 14.2, 2.5, 0.46, 0.1],
    [6.2, 8.4, 3.6, 0.3, 0.18],
    [12.8, 3.4, 2.8, 0.36, 0.13],
    [6.9, 11.6, 3.2, 0.33, 0.15],
    [13.4, 13.8, 2.6, 0.4, 0.12],
  ];
  for (const [ox, oz, oy, sc, sp] of orbSpecs) {
    const s = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTex,
        color: new THREE.Color(0xffe4ae).multiplyScalar(1.7),
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: true,
      })
    );
    s.scale.set(sc, sc, 1);
    s.userData = { ox, oz, oy, sp, ph: Math.random() * Math.PI * 2 };
    orbs.push(s);
    group.add(s);
  }

  return {
    group,
    grid,
    pedestals,
    pool,
    spawn,
    envTexture,
    envRT,
    update(t: number, dt: number) {
      water.update(t);
      fu.uTime.value = t;
      skyMat.uniforms.uTime.value = t;
      for (let i = 0; i < shafts.length; i++) {
        const m = shafts[i];
        const u = (m.material as THREE.ShaderMaterial).uniforms;
        u.uTime.value = t;
        u.uIntensity.value = shaftSpecs[i][3] * (0.82 + 0.18 * Math.sin(t * 0.7 + i * 1.7));
      }
      // lagoon glow breathing
      poolLight.intensity = 22 + Math.sin(t * 1.7) * 4;
      oculusGlow.intensity = 13 + Math.sin(t * 0.8) * 3;
      // seraph pulse (gentle, no doom flicker in heaven)
      seraphLight.intensity = 6.5 + Math.sin(t * 0.9) * 2.5;
      // angel dust rises with a slow swirl
      const pos = dustGeo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < DUST; i++) {
        let y = pos.getY(i) + dt * 0.07;
        let x = pos.getX(i) + Math.sin(t * 0.35 + dustSeed[i]) * dt * 0.03;
        if (y > WALL_H - 0.3) y = 0.4;
        pos.setY(i, y);
        pos.setX(i, Math.max(0.2, Math.min(W - 0.2, x)));
      }
      pos.needsUpdate = true;
      // light orbs drift on lissajous paths
      for (const s of orbs) {
        const ud = s.userData as { ox: number; oz: number; oy: number; sp: number; ph: number };
        s.position.set(
          ud.ox + Math.sin(t * ud.sp + ud.ph) * 1.1,
          ud.oy + Math.sin(t * ud.sp * 0.7 + ud.ph * 2.0) * 0.35,
          ud.oz + Math.cos(t * ud.sp * 0.85 + ud.ph) * 1.1
        );
      }
    },
    renderReflection,
    setMirror,
  };
}
