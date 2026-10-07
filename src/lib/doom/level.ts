import * as THREE from "three";
import { parseMap, MAP_ART, CELL, type LevelGrid, type Collider, type ZoneInfo } from "./types";
import { texWall, texCeil, texPedestal, texSign, texGlow, texBeam } from "./textures";
import { trackedCanvasTexture, mem } from "./memory";
import { buildWater, type WaterRig } from "./water";

// ─── CELESTIA GALLERIA ✦ :: v2.0 THE GRAND MALL ─────────────────────────────
// 43 × 36 meters of celestial retail: a Forge Gallery in the north, a Grand
// Atrium around the lagoon, two relic wings off the Promenade, and THE
// SANCTUM in the south — where purchased relics take flesh and become usable.
// Collision is now HONEST: walls sit on the inner faces of their cells and
// every prop gets a tight AABB. No invisible obstacles. The pilgrim may walk
// up and touch the marble.

export const WALL_H = 4.2;
export const PED_SIZE = 0.9;
export const PED_TOP = 0.96;
export const FLOOR_Y = 0;
export const WATER_Y = -0.32;
export const POOL_FLOOR_Y = -1.1;
/** slim gold plinth owned relics stand on inside the Sanctum */
export const PLINTH_H = 0.42;
/** bench seat height in the Promenade */
export const BENCH_SEAT_Y = 0.46;

export interface PedestalInfo {
  col: number;
  row: number;
  pos: THREE.Vector3;
  facing: number;
  top: number;
}

export interface BenchInfo {
  pos: THREE.Vector3;
  /** yaw the seated pilgrim faces */
  yaw: number;
  seatY: number;
}

export interface LevelRig {
  group: THREE.Group;
  grid: LevelGrid;
  pedestals: PedestalInfo[];
  colliders: Collider[];
  sanctumSlots: THREE.Vector3[];
  altar: { pos: THREE.Vector3 };
  benches: BenchInfo[];
  zones: ZoneInfo[];
  pool: { cx: number; cz: number; w: number; d: number };
  spawn: { x: number; z: number; yaw: number };
  envTexture: THREE.Texture;
  envRT: THREE.WebGLRenderTarget;
  update(t: number, dt: number): void;
  renderReflection(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    hidden: THREE.Object3D[]
  ): void;
  setMirror(on: boolean): void;
  // v2.0 living-temple controls
  setDust(k: number): void;
  setShafts(on: boolean): void;
  setMood(mood: "cinema" | "dawn" | null): void;
  sparkleBurst(x: number, z: number): void;
  riteBurst(x: number, z: number): void;
  orbBoost(seconds: number): void;
  starBoost(k: number): void;
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
  uniform float uStar;
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

    // STAR CHART wink: twinkling studs across the zenith when uStar > 0
    float starNoise = hash(floor(vec2(atan(d.z, d.x) * 36.0, d.y * 42.0)));
    float tw = smoothstep(0.992, 1.0, starNoise)
             * (0.55 + 0.45 * sin(uTime * 3.2 + starNoise * 60.0));
    col += vec3(1.0, 0.98, 0.9) * tw * uStar * smoothstep(0.06, 0.32, d.y);

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
  uniform vec2 uInner;      // inner wall face coords (x = north z, y = east x)
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

    // halo-light strip streaks hugging the inner faces
    float streakN = exp(-abs(vWorld.z - uInner.x) * 1.35);
    float streakE = exp(-abs(vWorld.x - uInner.y) * 1.35);
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
  const W = grid.w * CELL; // 43.2
  const D = grid.h * CELL; // 36.0
  const cx = W / 2;
  const cz = D / 2;
  const colliders: Collider[] = [];

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
      uStar: { value: 0 },
    },
    side: THREE.BackSide,
    depthWrite: false,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(42, 32, 18), skyMat);
  sky.position.set(cx, 1.5, cz);
  sky.renderOrder = -10;
  group.add(sky);

  // ── environment probe: bake the pearl heavens into a PMREM cubemap so ──
  // every gold surface (cornices, capitals, reliquaries, halos, HANDS)
  // reflects the sky. THE budget-broken glow-up, now serving the whole mall.
  const envScene = new THREE.Scene();
  const envSky = new THREE.Mesh(new THREE.SphereGeometry(42, 24, 14), skyMat);
  envScene.add(envSky);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envRT = pmrem.fromScene(envScene, 0.07);
  pmrem.dispose();
  envSky.geometry.dispose();
  const envTexture = envRT.texture;
  mem.register(envTexture, 256, 256 * 6, true);

  wallMat.envMapIntensity = 0.4;
  goldMat.envMapIntensity = 1.35;

  // ══════════════════════════════════════════════════════════════════════
  // HONEST WALLS — planes sit on the INNER faces of their cells, so the
  // collision grid and the visible marble finally agree. The 1.2 m ring of
  // "hidden obstacle" between you and the wall is gone. Touch the temple.
  // ══════════════════════════════════════════════════════════════════════
  // north (faces +Z / south into the mall), spans full W to cover corners
  group.add(wallPlane(W, W / CELL, wallMat, [cx, WALL_H / 2, CELL], 0));
  group.add(wallPlane(W, W / CELL, wallMat, [cx, WALL_H / 2, D - CELL], Math.PI));
  group.add(wallPlane(D - 2 * CELL, (D - 2 * CELL) / CELL, wallMat, [W - CELL, WALL_H / 2, cz], -Math.PI / 2));
  group.add(wallPlane(D - 2 * CELL, (D - 2 * CELL) / CELL, wallMat, [CELL, WALL_H / 2, cz], Math.PI / 2));

  // ── gilded cornice + base rails on the inner faces ──
  const trim = (len: number, pos: [number, number, number], rotY: number) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(len, 0.07, 0.07), goldMat);
    m.position.set(...pos);
    m.rotation.y = rotY;
    group.add(m);
  };
  trim(W - 0.3, [cx, WALL_H - 0.14, CELL + 0.08], 0);
  trim(W - 0.3, [cx, WALL_H - 0.14, D - CELL - 0.08], 0);
  trim(D - 2.6, [W - CELL - 0.08, WALL_H - 0.14, cz], Math.PI / 2);
  trim(D - 2.6, [CELL + 0.08, WALL_H - 0.14, cz], Math.PI / 2);
  trim(W - 0.3, [cx, 0.16, CELL + 0.08], 0);
  trim(W - 0.3, [cx, 0.16, D - CELL - 0.08], 0);
  trim(D - 2.6, [W - CELL - 0.08, 0.16, cz], Math.PI / 2);
  trim(D - 2.6, [CELL + 0.08, 0.16, cz], Math.PI / 2);

  // ══════════════════════════════════════════════════════════════════════
  // INTERIOR PARTITIONS — chunky 1.2 m bulkheads extracted from the map as
  // maximal runs (longer axis wins). Each run = two textured faces + gold
  // caps + gilded jambs at every doorway end. Full-cell thickness, so the
  // blocked cells and the visible marble are the same stone.
  // ══════════════════════════════════════════════════════════════════════
  const isBorder = (c: number, r: number) =>
    c === 0 || r === 0 || c === grid.w - 1 || r === grid.h - 1;
  const isWall = (c: number, r: number) =>
    c >= 0 && r >= 0 && c < grid.w && r < grid.h && grid.cells[r * grid.w + c] === 1;

  function hRunLen(c: number, r: number) {
    let a = c, b = c;
    while (isWall(a - 1, r) && !isBorder(a - 1, r)) a--;
    while (isWall(b + 1, r) && !isBorder(b + 1, r)) b++;
    return { a, b, len: b - a + 1 };
  }
  function vRunLen(c: number, r: number) {
    let a = r, b = r;
    while (isWall(c, a - 1) && !isBorder(c, a - 1)) a--;
    while (isWall(c, b + 1) && !isBorder(c, b + 1)) b++;
    return { a, b, len: b - a + 1 };
  }

  const visited = new Uint8Array(grid.w * grid.h);
  const goldCap = (len: number, x: number, z: number, alongZ: boolean) => {
    for (const y of [WALL_H - 0.05, 0.14]) {
      const m = new THREE.Mesh(
        new THREE.BoxGeometry(alongZ ? 0.14 : len, 0.09, alongZ ? len : 0.14),
        goldMat
      );
      m.position.set(x, y, z);
      group.add(m);
    }
  };
  const jamb = (x: number, z: number) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.12, WALL_H, 0.12), goldMat);
    m.position.set(x, WALL_H / 2, z);
    group.add(m);
  };

  for (let r = 1; r < grid.h - 1; r++) {
    for (let c = 1; c < grid.w - 1; c++) {
      if (visited[r * grid.w + c] || !isWall(c, r)) continue;
      const h = hRunLen(c, r);
      const v = vRunLen(c, r);
      if (h.len >= v.len && h.len >= 1) {
        // horizontal bulkhead along row r
        const L = h.len * CELL;
        const mx = ((h.a + h.b + 1) / 2) * CELL;
        const zS = r * CELL;          // south face (faces +Z)
        const zN = (r + 1) * CELL;    // north face (faces -Z)
        group.add(wallPlane(L, L / CELL, wallMat, [mx, WALL_H / 2, zS], 0));
        group.add(wallPlane(L, L / CELL, wallMat, [mx, WALL_H / 2, zN], Math.PI));
        goldCap(L, mx, r * CELL + CELL / 2, false);
        jamb(h.a * CELL + 0.06, r * CELL + CELL / 2);
        jamb((h.b + 1) * CELL - 0.06, r * CELL + CELL / 2);
        for (let x = h.a; x <= h.b; x++) visited[r * grid.w + x] = 1;
      } else {
        // vertical bulkhead along column c
        const L = v.len * CELL;
        const mz = ((v.a + v.b + 1) / 2) * CELL;
        const xW = c * CELL;          // west face (faces -X)
        const xE = (c + 1) * CELL;    // east face (faces +X)
        group.add(wallPlane(L, L / CELL, wallMat, [xW, WALL_H / 2, mz], -Math.PI / 2));
        group.add(wallPlane(L, L / CELL, wallMat, [xE, WALL_H / 2, mz], Math.PI / 2));
        goldCap(L, c * CELL + CELL / 2, mz, true);
        jamb(c * CELL + CELL / 2, v.a * CELL + 0.06);
        jamb(c * CELL + CELL / 2, (v.b + 1) * CELL - 0.06);
        for (let y = v.a; y <= v.b; y++) visited[y * grid.w + c] = 1;
      }
    }
  }

  // ── gate lintels — arches over every doorway ──
  const Lintel = (gx: number, gz: number, w: number, d: number) => {
    const h = WALL_H - 2.9;
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
    m.position.set(gx, 2.9 + h / 2, gz);
    group.add(m);
    const bar = new THREE.Mesh(new THREE.BoxGeometry(w + 0.06, 0.09, d + 0.04), goldMat);
    bar.position.set(gx, 2.92, gz);
    group.add(bar);
  };
  // horizontal partition gates (rows 3, 14, 23): W cols 5-6 · grand 16-19 · E 29-30
  for (const gr of [3, 14, 23]) {
    Lintel(6 * CELL, gr * CELL + CELL / 2, 2 * CELL, CELL);
    Lintel(18 * CELL, gr * CELL + CELL / 2, 4 * CELL, CELL);
    Lintel(30 * CELL, gr * CELL + CELL / 2, 2 * CELL, CELL);
  }
  // wing gates (cols 12 & 23, rows 18-19)
  for (const gc of [12, 23]) {
    Lintel(gc * CELL + CELL / 2, 19 * CELL, CELL, 2 * CELL);
  }

  // ── halo light strips (inner faces) ──
  group.add(neonStrip(W - 2.4, AQUA_BRIGHT, [cx, 3.35, CELL + 0.06], 0, beamTex)); // N aqua
  group.add(neonStrip(D - 2.4, AQUA_BRIGHT, [W - CELL - 0.06, 3.35, cz], Math.PI / 2, beamTex)); // E aqua
  group.add(neonStrip(D - 2.4, GOLD_BRIGHT, [CELL + 0.06, 3.35, cz], -Math.PI / 2, beamTex)); // W gold
  group.add(neonStrip(20, GOLD_BRIGHT, [cx, 3.1, D - CELL - 0.06], Math.PI, beamTex)); // S gold

  // ── wing & zone signage ──
  group.add(sign("CELESTIA GALLERIA", 5.2, [cx, 2.6, CELL + 0.03], 0, "#ffd98c"));
  group.add(sign("THE SPRITE FORGE", 3.0, [cx, 1.7, CELL + 0.03], 0, "#9ff5ec"));
  group.add(sign("GRAND ATRIUM", 2.6, [cx, 3.45, 4 * CELL + 0.03], 0, "#ffd98c"));
  group.add(sign("THE FORGE GALLERY", 2.2, [cx, 3.45, 3 * CELL - 0.03], Math.PI, "#9ff5ec"));
  group.add(sign("GARDEN & AUDIO", 2.2, [6 * CELL, 3.45, 14 * CELL - 0.03], Math.PI, "#3fd8c8"));
  group.add(sign("THE PROMENADE", 2.4, [cx, 3.45, 14 * CELL - 0.03], Math.PI, "#ffd98c"));
  group.add(sign("VISION", 2.2, [30 * CELL, 3.45, 14 * CELL - 0.03], Math.PI, "#3fd8c8"));
  group.add(sign("TO THE SANCTUM", 2.4, [cx, 3.45, 15 * CELL + 0.03], 0, "#ffd98c"));
  group.add(sign("THE SANCTUM", 3.0, [cx, 3.45, 24 * CELL - 0.03], Math.PI, "#ffd98c"));
  group.add(sign("RITE OF ACQUISITION", 2.6, [21.6, 2.35, 30.05], 0, "#ffb46c"));
  group.add(sign("YOUR RELICS TAKE FLESH HERE", 3.4, [cx, 2.2, D - CELL - 0.03], Math.PI, "#9de8b8"));

  // ══════════════════════════════════════════════════════════════════════
  // THE CELESTIAL LAGOON — scanned from the map's '~' cells
  // ══════════════════════════════════════════════════════════════════════
  let poolX0 = Infinity, poolX1 = -Infinity, poolZ0 = Infinity, poolZ1 = -Infinity;
  let spawn = { x: cx, z: cz, yaw: 0 };
  const sanctumSlots: THREE.Vector3[] = [];
  const altarCell: { x0: number; x1: number; z0: number; z1: number } = { x0: 0, x1: 0, z0: 0, z1: 0 };
  let altarSeen = false;
  for (let r = 0; r < grid.h; r++) {
    for (let c = 0; c < grid.w; c++) {
      const v = grid.cells[r * grid.w + c];
      const wx = c * CELL, wz = r * CELL;
      if (v === 2) {
        poolX0 = Math.min(poolX0, wx); poolX1 = Math.max(poolX1, wx + CELL);
        poolZ0 = Math.min(poolZ0, wz); poolZ1 = Math.max(poolZ1, wz + CELL);
      } else if (v === 4) {
        sanctumSlots.push(new THREE.Vector3(c * CELL + CELL / 2, 0, r * CELL + CELL / 2));
      } else if (v === 5) {
        if (!altarSeen) { altarCell.x0 = wx; altarCell.z0 = wz; altarSeen = true; }
        altarCell.x1 = Math.max(altarCell.x1, wx + CELL);
        altarCell.z1 = Math.max(altarCell.z1, wz + CELL);
      } else if (MAP_ART[r][c] === "^") {
        spawn = { x: c * CELL + CELL / 2, z: r * CELL + CELL / 2, yaw: 0 };
      }
    }
  }
  const pool = {
    cx: (poolX0 + poolX1) / 2,
    cz: (poolZ0 + poolZ1) / 2,
    w: poolX1 - poolX0,
    d: poolZ1 - poolZ0,
  };

  // ── mirror marble floor (segments around the pool hole) ──
  // reflection render target — 896×448 RGBA, honestly tracked.
  const MIRROR_W = 896;
  const MIRROR_H = 448;
  const mirrorRT = new THREE.WebGLRenderTarget(MIRROR_W, MIRROR_H);
  mirrorRT.texture.minFilter = THREE.LinearFilter;
  mirrorRT.texture.magFilter = THREE.LinearFilter;
  mirrorRT.texture.generateMipmaps = false;
  mem.register(mirrorRT.texture, MIRROR_W, MIRROR_H, false);

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
        uInner: { value: new THREE.Vector2(CELL, W - CELL) },
      },
    ]),
    fog: true,
  });
  const fu = floorMat.uniforms as Record<string, { value: unknown }>;
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

    texMat
      .copy(BIAS)
      .multiply(virtualCam.projectionMatrix)
      .multiply(virtualCam.matrixWorldInverse);

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

  // ── pool cavity + water ──
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
  const ocRx = Math.min(pool.w, pool.d) * 0.42;
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
  ceilGeo.rotateX(Math.PI / 2);
  scaleUV(ceilGeo, 1 / CELL, 1 / CELL);
  const ceil = new THREE.Mesh(
    ceilGeo,
    new THREE.MeshStandardMaterial({ map: ceilTex, roughness: 0.5, metalness: 0.35 })
  );
  ceil.position.set(cx, WALL_H, cz);
  group.add(ceil);

  // oculus gold rim
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
  glare.rotation.x = Math.PI / 2;
  glare.scale.set(ocRx * 0.72, ocRy * 0.72, 1);
  glare.position.set(pool.cx, WALL_H - 0.1, pool.cz);
  glare.renderOrder = 6;
  group.add(glare);

  // ══════════════════════════════════════════════════════════════════════
  // GOD RAYS — four nested cones down the oculus + slim sanctum columns over
  // every atrium pedestal, the altar, the forge gallery and the Sanctum.
  // ══════════════════════════════════════════════════════════════════════
  const shafts: THREE.Mesh[] = [];
  const shaftBase: number[] = [];
  function addShaft(x: number, z: number, r: number, inten: number, bottom: number) {
    const h = WALL_H - bottom;
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
      new THREE.CylinderGeometry(r, r * 0.82, h, 20, 1, true),
      mat
    );
    m.position.set(x, (WALL_H + bottom) / 2, z);
    m.renderOrder = 7;
    group.add(m);
    shafts.push(m);
    shaftBase.push(inten);
  }
  // oculus cones into the lagoon
  addShaft(pool.cx, pool.cz, 0.42, 0.5, WATER_Y);
  addShaft(pool.cx, pool.cz, 0.85, 0.34, WATER_Y);
  addShaft(pool.cx, pool.cz, 1.35, 0.22, WATER_Y);
  addShaft(pool.cx, pool.cz, 1.9, 0.12, WATER_Y);

  // ── pillars: marble with gilded capitals, flanking the lagoon ──
  const pillarCells: [number, number][] = [
    [12, 6], [23, 6], [12, 11], [23, 11],
  ];
  for (const [col, row] of pillarCells) {
    grid.cells[row * grid.w + col] = 1;
    const px = col * CELL + CELL / 2;
    const pz = row * CELL + CELL / 2;
    const p = new THREE.Mesh(new THREE.BoxGeometry(1.1, WALL_H, 1.1), wallMat);
    p.position.set(px, WALL_H / 2, pz);
    group.add(p);
    for (const y of [WALL_H - 0.09, 0.09]) {
      const cap = new THREE.Mesh(new THREE.BoxGeometry(1.26, 0.18, 1.26), goldMat);
      cap.position.set(px, y, pz);
      group.add(cap);
    }
    const dir = Math.atan2(pool.cx - px, pool.cz - pz);
    const strip = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, WALL_H - 0.7, 0.08),
      new THREE.MeshBasicMaterial({ color: AQUA_BRIGHT })
    );
    strip.position.set(px + Math.sin(dir) * 0.58, WALL_H / 2, pz + Math.cos(dir) * 0.58);
    group.add(strip);
  }

  // ── pedestals (three passes: atrium → wings → forge gallery) ──
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
  const pedestals: PedestalInfo[] = [];
  const pedestalPasses: [number, number][] = [
    [4, 14],   // Grand Atrium rows
    [15, 23],  // wing rows
    [0, 4],    // Forge Gallery (custom shrines claim these LAST)
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
        // HONEST collision: 0.9 m box, not the whole 1.2 m cell
        colliders.push({
          x0: px - PED_SIZE / 2 - 0.03, x1: px + PED_SIZE / 2 + 0.03,
          z0: pz - PED_SIZE / 2 - 0.03, z1: pz + PED_SIZE / 2 + 0.03,
        });
        // sanctum light column over atrium relics only
        if (row >= 4 && row < 14) addShaft(px, pz, 0.42, 0.13, FLOOR_Y);
      }
    }
  }

  // ══════════════════════════════════════════════════════════════════════
  // THE SANCTUM — where purchased relics take flesh
  // ══════════════════════════════════════════════════════════════════════
  const altarPos = new THREE.Vector3(
    (altarCell.x0 + altarCell.x1) / 2, 0, (altarCell.z0 + altarCell.z1) / 2
  );

  // slim gold plinth discs mark the empty relic slots
  const slotMat = new THREE.MeshStandardMaterial({
    color: GOLD,
    roughness: 0.3,
    metalness: 1.0,
    emissive: 0x2a1c05,
    emissiveIntensity: 0.5,
  });
  for (const s of sanctumSlots) {
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.38, 0.045, 18), slotMat);
    disc.position.set(s.x, 0.022, s.z);
    group.add(disc);
    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(0.36, 0.008, 6, 22),
      new THREE.MeshBasicMaterial({ color: AQUA_BRIGHT, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    halo.rotation.x = Math.PI / 2;
    halo.position.set(s.x, 0.05, s.z);
    group.add(halo);
  }
  addShaft(altarPos.x, altarPos.z, 0.62, 0.3, FLOOR_Y);
  addShaft(cx, 32.4, 0.55, 0.16, FLOOR_Y); // sanctum glow over the south wall
  addShaft(6 * CELL, 2.4, 0.7, 0.14, FLOOR_Y);   // forge gallery W
  addShaft(30 * CELL, 2.4, 0.7, 0.14, FLOOR_Y);  // forge gallery E

  // ── THE ACQUISITION ALTAR — a golden altar with a floating sigil orb ──
  const altarG = new THREE.Group();
  const altarBase = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.24, 1.05), slotMat);
  altarBase.position.y = 0.12;
  altarG.add(altarBase);
  const altarMid = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.5, 0.72), pedMat);
  altarMid.position.y = 0.49;
  altarG.add(altarMid);
  const altarTop = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.08, 0.8), capMat);
  altarTop.position.y = 0.78;
  altarG.add(altarTop);
  for (const sx of [-1, 1]) {
    const wingCol = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.0, 0.14), slotMat);
    wingCol.position.set(sx * 0.95, 0.5, 0.28);
    altarG.add(wingCol);
    const wingCap = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.06, 0.2), goldMat);
    wingCap.position.set(sx * 0.95, 1.03, 0.28);
    altarG.add(wingCap);
  }
  const sigil = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.16, 1),
    new THREE.MeshStandardMaterial({
      color: 0x67e8d8,
      emissive: 0x2dd4bf,
      emissiveIntensity: 2.8,
      roughness: 0.15,
      metalness: 0.2,
    })
  );
  sigil.position.y = 1.45;
  altarG.add(sigil);
  const sigilHalo = new THREE.Mesh(
    new THREE.TorusGeometry(0.3, 0.02, 10, 30),
    new THREE.MeshStandardMaterial({ color: 0xffe4a8, metalness: 1, roughness: 0.2, emissive: 0xc98a20, emissiveIntensity: 1.8 })
  );
  sigilHalo.rotation.x = Math.PI / 2 + 0.2;
  sigilHalo.position.y = 1.45;
  altarG.add(sigilHalo);
  altarG.position.set(altarPos.x, 0, altarPos.z);
  group.add(altarG);
  colliders.push({ x0: altarCell.x0 + 0.05, x1: altarCell.x1 - 0.05, z0: altarCell.z0, z1: altarCell.z1 });

  // ── Promenade benches — always sittable, always hospitable ──
  const benches: BenchInfo[] = [];
  const benchPearl = new THREE.MeshStandardMaterial({ color: 0xe9e2d2, roughness: 0.85, metalness: 0.05 });
  const benchGold = new THREE.MeshStandardMaterial({ color: GOLD, roughness: 0.25, metalness: 1.0 });
  function bench(x: number, z: number, yaw: number) {
    const g = new THREE.Group();
    const seat = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.08, 0.5), benchPearl);
    seat.position.y = BENCH_SEAT_Y - 0.04;
    g.add(seat);
    const back = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.42, 0.07), benchPearl);
    back.position.set(0, BENCH_SEAT_Y + 0.19, -0.22);
    back.rotation.x = -0.13;
    g.add(back);
    for (const sx of [-0.8, 0.8]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.07, BENCH_SEAT_Y, 0.42), benchGold);
      leg.position.set(sx, BENCH_SEAT_Y / 2, 0);
      g.add(leg);
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.56), benchGold);
      rail.position.set(sx, BENCH_SEAT_Y + 0.06, 0.02);
      g.add(rail);
    }
    const seam = new THREE.Mesh(new THREE.BoxGeometry(1.88, 0.016, 0.016), benchGold);
    seam.position.set(0, BENCH_SEAT_Y + 0.02, 0.25);
    g.add(seam);
    g.position.set(x, 0, z);
    g.rotation.y = yaw;
    group.add(g);
    // backrest sits at local -Z when yaw faces +Z… rotate so the seat faces yaw
    benches.push({ pos: new THREE.Vector3(x, 0, z), yaw, seatY: BENCH_SEAT_Y + 0.5 });
    colliders.push({ x0: x - 0.95, x1: x + 0.95, z0: z - 0.28, z1: z + 0.28 });
  }
  bench(cx, 16 * CELL + CELL / 2, 0); // north bench, faces the atrium
  bench(cx, 21 * CELL + CELL / 2, 0); // south bench, faces the atrium

  // ── gilded reliquaries — the Doom crates, promoted to heaven ──
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
    // HONEST collision: the crate's own footprint, not the whole cell
    colliders.push({ x0: x - s * 0.55, x1: x + s * 0.55, z0: z - s * 0.55, z1: z + s * 0.55 });
  }
  reliquary(2.7, 5.9, 0.86, 0.4);    // atrium west corner
  reliquary(40.5, 5.9, 0.78, -0.7);  // atrium east corner
  reliquary(2.7, 33.2, 0.9, 0.25);   // sanctum west
  reliquary(40.5, 33.2, 0.55, 0.9);  // sanctum east

  // ── lights (temple of retail, mall edition) ──
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
  const altarLight = new THREE.PointLight(0xffd98c, 10, 12, 2);
  altarLight.position.set(altarPos.x, 2.4, altarPos.z);
  group.add(altarLight);
  const spawnLight = new THREE.PointLight(0xfff0c8, 7, 11, 2);
  spawnLight.position.set(spawn.x, 2.6, spawn.z - 0.5);
  group.add(spawnLight);
  const westLight = new THREE.PointLight(0x9ff5ec, 6, 12, 2);
  westLight.position.set(7 * CELL, 2.9, 18.5 * CELL);
  group.add(westLight);
  const eastLight = new THREE.PointLight(0xffd98c, 6, 12, 2);
  eastLight.position.set(29 * CELL, 2.9, 18.5 * CELL);
  group.add(eastLight);
  const forgeLight = new THREE.PointLight(0x9ff5ec, 7, 10, 2);
  forgeLight.position.set(cx, 2.9, 2 * CELL);
  group.add(forgeLight);

  // ── angel dust: golden motes rising through the whole mall ──
  const DUST = 520;
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
  const dustMat = new THREE.PointsMaterial({
    color: new THREE.Color(0xffdf9e).multiplyScalar(1.8),
    size: 0.03,
    transparent: true,
    opacity: 0.5,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    fog: true,
  });
  const dust = new THREE.Points(dustGeo, dustMat);
  group.add(dust);

  // ── wandering light orbs (soft golden spirits, mall-wide) ──
  const orbs: THREE.Sprite[] = [];
  const orbSpecs: [number, number, number, number, number][] = [
    // [x, z, height, scale, speed]
    [4.0, 6.5, 2.6, 0.5, 0.11],      // atrium W
    [39.0, 6.5, 3.1, 0.38, 0.14],    // atrium E
    [21.6, 6.2, 3.0, 0.34, 0.16],    // atrium N
    [21.6, 15.8, 2.6, 0.46, 0.10],   // atrium S
    [5.5, 2.4, 2.8, 0.4, 0.12],      // forge gallery
    [37.0, 2.4, 2.6, 0.36, 0.13],    // forge gallery
    [7.0, 21.0, 2.6, 0.42, 0.10],    // west wing
    [36.0, 21.0, 2.9, 0.4, 0.12],    // east wing
    [21.6, 20.4, 3.3, 0.32, 0.15],   // promenade
    [21.6, 26.4, 2.7, 0.38, 0.11],   // promenade
    [6.0, 31.8, 2.4, 0.36, 0.12],    // sanctum W
    [37.0, 31.8, 2.4, 0.36, 0.12],   // sanctum E
    [21.6, 33.0, 2.8, 0.3, 0.14],    // by the spawn
    [14.5, 10.8, 3.4, 0.3, 0.09],    // over the lagoon W
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
    s.userData = { ox, oz, oy, sp, ph: Math.random() * Math.PI * 2, base: 0.55 };
    orbs.push(s);
    group.add(s);
  }

  // ── sparkle burst pool (LUMEN FERN / bless effects) ──
  const SPARK = 64;
  const sparks: THREE.Sprite[] = [];
  for (let i = 0; i < SPARK; i++) {
    const s = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTex,
        color: new THREE.Color(0xffe4ae).multiplyScalar(1.9),
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: true,
      })
    );
    s.scale.set(0.14, 0.14, 1);
    s.visible = false;
    s.userData = { vx: 0, vy: 0, vz: 0, life: 0 };
    sparks.push(s);
    group.add(s);
  }
  function sparkleBurst(x: number, z: number) {
    for (const s of sparks) {
      const a = Math.random() * Math.PI * 2;
      const r = 0.2 + Math.random() * 0.9;
      s.position.set(x + Math.cos(a) * r, 0.15 + Math.random() * 0.4, z + Math.sin(a) * r);
      const ud = s.userData as { vx: number; vy: number; vz: number; life: number };
      ud.vx = Math.cos(a) * (0.3 + Math.random() * 0.5);
      ud.vz = Math.sin(a) * (0.3 + Math.random() * 0.5);
      ud.vy = 0.8 + Math.random() * 1.3;
      ud.life = 1;
      s.visible = true;
    }
  }

  // ── rite burst columns (checkout ceremony light) ──
  const riteCols: THREE.Mesh[] = [];
  const riteGlows: THREE.Sprite[] = [];
  for (let i = 0; i < 2; i++) {
    const col = new THREE.Mesh(
      new THREE.CylinderGeometry(0.85, 0.55, WALL_H, 22, 1, true),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(0xffe4ae).multiplyScalar(1.6),
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
        fog: false,
      })
    );
    col.position.set(-99, WALL_H / 2, -99);
    col.renderOrder = 8;
    col.visible = false;
    col.userData = { life: 0 };
    group.add(col);
    riteCols.push(col);
    const gl = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTex,
        color: new THREE.Color(0xffe4ae).multiplyScalar(2.0),
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    gl.position.set(-99, 0.3, -99);
    gl.visible = false;
    gl.userData = { life: 0 };
    group.add(gl);
    riteGlows.push(gl);
  }
  let riteIdx = 0;
  function riteBurst(x: number, z: number) {
    const col = riteCols[riteIdx % riteCols.length];
    const gl = riteGlows[riteIdx % riteGlows.length];
    riteIdx++;
    col.position.set(x, WALL_H / 2, z);
    col.visible = true;
    col.userData.life = 1;
    gl.position.set(x, 0.35, z);
    gl.visible = true;
    gl.userData.life = 1;
  }

  // ── zones (for the zone banner) ──
  const zones: ZoneInfo[] = [
    { name: "THE SANCTUM", x0: CELL, z0: 23 * CELL + CELL, x1: W - CELL, z1: D - CELL },
    { name: "GARDEN & AUDIO", x0: CELL, z0: 15 * CELL - 0.2, x1: 12 * CELL, z1: 23 * CELL + 0.2 },
    { name: "THE PROMENADE", x0: 12 * CELL + 0.2, z0: 15 * CELL - 0.2, x1: 24 * CELL - 0.2, z1: 23 * CELL + 0.2 },
    { name: "VISION", x0: 24 * CELL, z0: 15 * CELL - 0.2, x1: W - CELL, z1: 23 * CELL + 0.2 },
    { name: "THE GRAND ATRIUM", x0: CELL, z0: 3 * CELL + CELL, x1: W - CELL, z1: 14 * CELL },
    { name: "THE FORGE GALLERY", x0: CELL, z0: CELL, x1: W - CELL, z1: 3 * CELL },
  ];

  // ── mood state (cinema / dawn) ──
  let mood: "cinema" | "dawn" | null = null;
  const MOODS = {
    cinema: { hemi: 0.22, sun: 0.45, fog: 0.030, oculus: 22, warm: 0xffc98c },
    dawn: { hemi: 1.25, sun: 2.4, fog: 0.016, oculus: 20, warm: 0xffd9b0 },
    normal: { hemi: 0.8, sun: 1.5, fog: 0.014, oculus: 14, warm: 0xffe4b0 },
  } as const;
  let moodT = 0; // 0 = normal, 1 = fully in mood

  // ── boost timers ──
  let orbBoostT = 0;
  let starK = 0;
  let dustK = 1;

  return {
    group,
    grid,
    pedestals,
    colliders,
    sanctumSlots,
    altar: { pos: altarPos },
    benches,
    zones,
    pool,
    spawn,
    envTexture,
    envRT,
    update(t: number, dt: number) {
      water.update(t);
      fu.uTime.value = t;
      skyMat.uniforms.uTime.value = t;
      // star twinkle decays gently back to zero
      starK = Math.max(0, starK - dt * 0.22);
      skyMat.uniforms.uStar.value = starK;
      for (let i = 0; i < shafts.length; i++) {
        const m = shafts[i];
        const u = (m.material as THREE.ShaderMaterial).uniforms;
        u.uTime.value = t;
        u.uIntensity.value = shaftBase[i] * (0.82 + 0.18 * Math.sin(t * 0.7 + i * 1.7));
      }
      // lagoon + altar glow breathing
      poolLight.intensity = 22 + Math.sin(t * 1.7) * 4;
      oculusGlow.intensity = 13 + Math.sin(t * 0.8) * 3;
      altarLight.intensity = 9 + Math.sin(t * 1.1) * 3;
      // altar sigil: slow spin + bob
      sigil.rotation.y += dt * 0.8;
      sigil.position.y = 1.45 + Math.sin(t * 1.3) * 0.08;
      sigilHalo.rotation.z = Math.sin(t * 0.9) * 0.25;
      // angel dust rises with a slow swirl (density-scaled)
      const pos = dustGeo.attributes.position as THREE.BufferAttribute;
      const rate = 0.07 * (0.6 + 0.4 * dustK);
      for (let i = 0; i < DUST; i++) {
        let y = pos.getY(i) + dt * rate;
        let x = pos.getX(i) + Math.sin(t * 0.35 + dustSeed[i]) * dt * 0.03;
        if (y > WALL_H - 0.3) y = 0.4;
        pos.setY(i, y);
        pos.setX(i, Math.max(0.2, Math.min(W - 0.2, x)));
      }
      pos.needsUpdate = true;
      dustMat.opacity = 0.5 * Math.max(0, dustK);
      // light orbs drift on lissajous paths (+ harmony boost pulse)
      if (orbBoostT > 0) orbBoostT = Math.max(0, orbBoostT - dt);
      const ob = orbBoostT > 0 ? 1 + 0.6 * Math.sin(t * 6) : 1;
      for (const s of orbs) {
        const ud = s.userData as { ox: number; oz: number; oy: number; sp: number; ph: number; base: number };
        s.position.set(
          ud.ox + Math.sin(t * ud.sp + ud.ph) * 1.1,
          ud.oy + Math.sin(t * ud.sp * 0.7 + ud.ph * 2.0) * 0.35,
          ud.oz + Math.cos(t * ud.sp * 0.85 + ud.ph) * 1.1
        );
        const mm = s.material as THREE.SpriteMaterial;
        mm.opacity = ud.base * ob;
      }
      // sparkle pool physics
      for (const s of sparks) {
        const ud = s.userData as { vx: number; vy: number; vz: number; life: number };
        if (ud.life <= 0) continue;
        ud.life = Math.max(0, ud.life - dt * 0.45);
        ud.vy -= dt * 0.35;
        s.position.x += ud.vx * dt;
        s.position.y += ud.vy * dt;
        s.position.z += ud.vz * dt;
        const mm = s.material as THREE.SpriteMaterial;
        mm.opacity = ud.life * 0.95;
        const sc = 0.1 + (1 - ud.life) * 0.12;
        s.scale.set(sc, sc, 1);
        if (ud.life <= 0) s.visible = false;
      }
      // rite burst columns bloom then fade
      for (let i = 0; i < riteCols.length; i++) {
        const col = riteCols[i];
        const gl = riteGlows[i];
        const cu = col.userData as { life: number };
        const gu = gl.userData as { life: number };
        if (cu.life <= 0) continue;
        cu.life = Math.max(0, cu.life - dt * 0.55);
        const k = cu.life;
        (col.material as THREE.MeshBasicMaterial).opacity = k * 0.4;
        col.scale.set(1 + (1 - k) * 0.35, 1, 1 + (1 - k) * 0.35);
        gu.life = cu.life;
        (gl.material as THREE.SpriteMaterial).opacity = k * 0.9;
        const gs = 1.2 + (1 - k) * 4.5;
        gl.scale.set(gs, gs, 1);
        if (cu.life <= 0) {
          col.visible = false;
          gl.visible = false;
        }
      }
      // mood lerp (cinema / dawn / normal)
      const target = mood ? MOODS[mood] : MOODS.normal;
      moodT = Math.min(1, moodT + (mood ? dt * 1.4 : dt * 0.9));
      const inv = 1 - moodT;
      hemi.intensity = MOODS.normal.hemi * inv + target.hemi * moodT;
      sun.intensity = MOODS.normal.sun * inv + target.sun * moodT;
      oculusGlow.intensity =
        (13 + Math.sin(t * 0.8) * 3) * inv + target.oculus * moodT;
      oculusGlow.color.setHex(mood === "cinema" ? 0xffc98c : mood === "dawn" ? 0xffd9b0 : 0xffe4b0);
    },
    renderReflection,
    setMirror,
    setDust(k: number) {
      dustK = Math.max(0, Math.min(2, k));
    },
    setShafts(on: boolean) {
      for (const m of shafts) m.visible = on;
    },
    setMood(m: "cinema" | "dawn" | null) {
      mood = m;
      if (!m) moodT = Math.max(0, moodT - 0.001); // will ease back in update()
    },
    sparkleBurst,
    riteBurst,
    orbBoost(seconds: number) {
      orbBoostT = seconds;
    },
    starBoost(k: number) {
      starK = Math.max(starK, k);
    },
  };
}
