import * as THREE from "three";
import { parseMap, CELL, type LevelGrid } from "./types";
import { texWall, texFloor, texCeil, texPedestal, texSign, texBeam } from "./textures";
import { trackedCanvasTexture } from "./memory";
import { buildWater, type WaterRig } from "./water";

// ─── SECTOR-7 GALLERIA level assembly ───────────────────────────────────────

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
  update(t: number, dt: number): void;
}

const FLOOR_VERT = /* glsl */ `
  varying vec3 vWorld;
  #include <fog_pars_vertex>
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorld = wp.xyz;
    vec4 mvPosition = viewMatrix * wp;
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`;

const FLOOR_FRAG = /* glsl */ `
  uniform sampler2D map;
  uniform float uTime;
  uniform vec3 uPoolCenter;
  uniform vec2 uPoolHalf;
  varying vec3 vWorld;
  #include <fog_pars_fragment>
  void main() {
    vec3 base = texture2D(map, vWorld.xz / ${CELL.toFixed(1)}).rgb;
    vec3 V = normalize(cameraPosition - vWorld);
    float fr = pow(1.0 - clamp(V.y, 0.0, 1.0), 3.0);
    vec3 col = base + vec3(0.045, 0.09, 0.082) * fr;

    // pool light bleed on surrounding floor
    vec2 dp = abs(vWorld.xz - uPoolCenter.xz) - uPoolHalf;
    float dpool = length(max(dp, vec2(0.0)));
    float bleed = exp(-dpool * 0.85);
    col += vec3(0.05, 0.22, 0.19) * bleed * (0.75 + 0.25 * sin(uTime * 1.7));

    // fake neon strip smears (north teal / east amber)
    float streakN = exp(-abs(vWorld.z - 0.12) * 1.35);
    float streakE = exp(-abs(vWorld.x - 19.08) * 1.35);
    col += vec3(0.10, 0.42, 0.38) * streakN * fr;
    col += vec3(0.42, 0.26, 0.06) * streakE * fr;

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
  color: number,
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
  // halo: beam texture rotated horizontal, additive
  const halo = new THREE.Mesh(
    new THREE.PlaneGeometry(len, 0.42),
    new THREE.MeshBasicMaterial({
      map: haloTex,
      color,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.5,
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
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, fog: true })
  );
  m.position.set(...pos);
  m.rotation.y = rotY;
  return m;
}

export function buildLevel(): LevelRig {
  const group = new THREE.Group();
  const grid = parseMap();
  const W = grid.w * CELL; // 19.2
  const D = grid.h * CELL; // 16.8
  const cx = W / 2;
  const cz = D / 2;

  // ── textures (shared) ──
  const wallTex = trackedCanvasTexture(texWall());
  const floorTex = trackedCanvasTexture(texFloor());
  const ceilTex = trackedCanvasTexture(texCeil());
  const pedTex = trackedCanvasTexture(texPedestal());
  const beamTex = trackedCanvasTexture(texBeam(), false);
  beamTex.wrapS = THREE.ClampToEdgeWrapping;

  const wallMat = new THREE.MeshStandardMaterial({
    map: wallTex,
    roughness: 0.82,
    metalness: 0.28,
  });

  // ── perimeter walls (inner-facing planes) ──
  group.add(wallPlane(W, W / CELL, wallMat, [cx, WALL_H / 2, 0], 0));
  group.add(wallPlane(W, W / CELL, wallMat, [cx, WALL_H / 2, D], Math.PI));
  group.add(wallPlane(D, D / CELL, wallMat, [W, WALL_H / 2, cz], -Math.PI / 2));
  group.add(wallPlane(D, D / CELL, wallMat, [0, WALL_H / 2, cz], Math.PI / 2));

  // ── ceiling ──
  const ceilGeo = new THREE.PlaneGeometry(W, D);
  scaleUV(ceilGeo, W / CELL, D / CELL);
  const ceil = new THREE.Mesh(
    ceilGeo,
    new THREE.MeshStandardMaterial({ map: ceilTex, roughness: 0.9, metalness: 0.1 })
  );
  ceil.rotation.x = Math.PI / 2;
  ceil.position.set(cx, WALL_H, cz);
  group.add(ceil);

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

  // ── glossy floor (4 segments around the pool hole) ──
  const floorMat = new THREE.ShaderMaterial({
    vertexShader: FLOOR_VERT,
    fragmentShader: FLOOR_FRAG,
    uniforms: THREE.UniformsUtils.merge([
      THREE.UniformsLib.fog,
      {
        map: { value: null },
        uTime: { value: 0 },
        uPoolCenter: { value: new THREE.Vector3(pool.cx, 0, pool.cz) },
        uPoolHalf: { value: new THREE.Vector2(pool.w / 2, pool.d / 2) },
      },
    ]),
    fog: true,
  });
  (floorMat.uniforms as Record<string, { value: unknown }>).map.value = floorTex;

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
  }

  // ── pool cavity ──
  const cavityMat = new THREE.MeshStandardMaterial({
    color: 0x0a1a18,
    roughness: 0.9,
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
    new THREE.MeshStandardMaterial({ color: 0x071412, roughness: 1, metalness: 0 })
  );
  poolFloor.rotation.x = -Math.PI / 2;
  poolFloor.position.set(pool.cx, POOL_FLOOR_Y, pool.cz);
  group.add(poolFloor);

  // water rig
  const water: WaterRig = buildWater(
    pool.cx,
    pool.cz,
    pool.w - 0.06,
    pool.d - 0.06,
    WATER_Y,
    POOL_FLOOR_Y
  );
  group.add(water.water, water.caustics);

  // ── pool curb + teal underglow ──
  const curbMat = new THREE.MeshStandardMaterial({
    color: 0x14181d,
    roughness: 0.35,
    metalness: 0.75,
  });
  const glowMat = new THREE.MeshBasicMaterial({ color: 0x2dd4bf });
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

  // ── pillars ──
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
    // teal edge strip facing the pool
    const dir = Math.atan2(pool.cx - px, pool.cz - pz);
    const strip = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, WALL_H - 0.7, 0.08),
      new THREE.MeshBasicMaterial({ color: 0x2dd4bf })
    );
    strip.position.set(px + Math.sin(dir) * 0.58, WALL_H / 2, pz + Math.cos(dir) * 0.58);
    group.add(strip);
  }

  // ── pedestals ──
  const pedMat = new THREE.MeshStandardMaterial({
    map: pedTex,
    roughness: 0.45,
    metalness: 0.6,
  });
  const capMat = new THREE.MeshStandardMaterial({
    color: 0x0b1216,
    roughness: 0.12,
    metalness: 0.9,
    emissive: 0x04201c,
    emissiveIntensity: 0.5,
  });
  const spawn = { x: 7 * CELL + CELL / 2, z: 12 * CELL + CELL / 2, yaw: 0 };
  const pedestals: PedestalInfo[] = [];
  for (let row = 0; row < grid.h; row++) {
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
      // face the entrance
      const facing = Math.atan2(spawn.x - px, spawn.z - pz);
      pedestals.push({ col, row, pos: new THREE.Vector3(px, 0, pz), facing, top: PED_TOP });
    }
  }

  // ── neon strips + signs ──
  group.add(neonStrip(W - 1.2, 0x2dd4bf, [cx, 3.35, 0.06], 0, beamTex)); // N teal
  group.add(neonStrip(D - 1.2, 0x2dd4bf, [W - 0.06, 3.35, cz], Math.PI / 2, beamTex)); // E teal
  group.add(neonStrip(D - 1.2, 0xf59e0b, [0.06, 3.35, cz], -Math.PI / 2, beamTex)); // W amber
  group.add(neonStrip(6.5, 0xf59e0b, [cx - 5.6, 3.1, D - 0.06], Math.PI, beamTex)); // S amber L
  group.add(neonStrip(6.5, 0xf59e0b, [cx + 5.6, 3.1, D - 0.06], Math.PI, beamTex)); // S amber R

  group.add(sign("SECTOR-7 GALLERIA", 5.2, [cx, 2.55, 0.03], 0, "#f59e0b"));
  group.add(sign("EXIT", 1.5, [cx, 2.2, D - 0.03], Math.PI, "#22c55e"));
  group.add(sign("OPTICS", 1.9, [3 * CELL + 0.6, 1.9, 0.03], 0));
  group.add(sign("GAMING", 1.9, [12 * CELL + 0.6, 1.9, 0.03], 0));
  group.add(sign("AUDIO", 1.9, [W - 0.03, 1.9, 7 * CELL + 1.8], -Math.PI / 2));
  group.add(sign("WEARABLES", 2.2, [0.03, 1.9, 7 * CELL + 0.6], Math.PI / 2));
  group.add(sign("AERIAL", 1.9, [11 * CELL + 0.6, 1.9, D - 0.03], Math.PI));

  // ── lights (Doom sector lighting) ──
  const hemi = new THREE.HemisphereLight(0x2a4a46, 0x0a0c10, 0.6);
  group.add(hemi);
  const key = new THREE.DirectionalLight(0x9fb8c0, 0.4);
  key.position.set(cx, WALL_H - 0.5, D);
  key.target.position.set(cx, 1, cz);
  group.add(key, key.target);
  const poolLight = new THREE.PointLight(0x2dd4bf, 26, 20, 2);
  poolLight.position.set(pool.cx, WATER_Y + 0.7, pool.cz);
  group.add(poolLight);
  const exitLight = new THREE.PointLight(0xffb454, 14, 14, 2);
  exitLight.position.set(spawn.x, 2.6, spawn.z - 1.5);
  group.add(exitLight);
  const flickerLight = new THREE.PointLight(0xf59e0b, 9, 11, 2);
  flickerLight.position.set(3 * CELL + 0.6, 2.9, 9 * CELL + 0.6);
  group.add(flickerLight);

  // ── dust motes ──
  const DUST = 140;
  const dustGeo = new THREE.BufferGeometry();
  const dustPos = new Float32Array(DUST * 3);
  for (let i = 0; i < DUST; i++) {
    dustPos[i * 3] = Math.random() * W;
    dustPos[i * 3 + 1] = 0.4 + Math.random() * (WALL_H - 0.8);
    dustPos[i * 3 + 2] = Math.random() * D;
  }
  dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
  const dust = new THREE.Points(
    dustGeo,
    new THREE.PointsMaterial({
      color: 0x53f5e5,
      size: 0.022,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: true,
    })
  );
  group.add(dust);

  // ── Doom sector flicker state ──
  let flickerT = 0;
  let flickerOn = true;

  return {
    group,
    grid,
    pedestals,
    pool,
    spawn,
    update(t: number, dt: number) {
      water.update(t);
      (floorMat.uniforms as Record<string, { value: number }>).uTime.value = t;
      // pool glow breathing
      poolLight.intensity = 24 + Math.sin(t * 1.7) * 4;
      // classic Doom light-sector flicker
      flickerT -= dt;
      if (flickerT <= 0) {
        flickerT = 0.06 + Math.random() * 0.22;
        flickerOn = Math.random() > 0.32;
        flickerLight.intensity = flickerOn ? 8 + Math.random() * 5 : 1.2;
      }
      // dust drift
      const pos = dustGeo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < DUST; i++) {
        let y = pos.getY(i) + dt * 0.06;
        if (y > WALL_H - 0.3) y = 0.4;
        pos.setY(i, y);
      }
      pos.needsUpdate = true;
    },
  };
}
