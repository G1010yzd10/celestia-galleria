import * as THREE from "three";
import type { ProductSpec } from "./types";

// ─── Procedural product models ──────────────────────────────────────────────
// Each product is a throwaway THREE.Group (front = +Z). The baker renders it
// from 9 bearings and throws the geometry away — customers only ever download
// the resulting sprite atlas. That is the whole Doom trick.

const CHARCOAL = 0x1f2328;
const DARKGRY = 0x2b3138;
const GUNMETAL = 0x454c54;
const AMBER = 0xf59e0b;
const TEAL = 0x2dd4bf;
const OFFWHITE = 0xd8d4cc;
const RED = 0xdc2626;
const GLASS = 0x0e2a2e;

function std(color: number, rough = 0.55, metal = 0.35): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal });
}

function box(
  w: number,
  h: number,
  d: number,
  mat: THREE.Material,
  x = 0,
  y = 0,
  z = 0
): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  return m;
}

function cyl(
  rTop: number,
  rBot: number,
  h: number,
  mat: THREE.Material,
  x = 0,
  y = 0,
  z = 0,
  seg = 20
): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h, seg), mat);
  m.position.set(x, y, z);
  return m;
}

/** helper: rotate a mesh to face the camera nicely in bake (no-op, front=+Z) */
export interface BuiltProduct {
  group: THREE.Group;
  dispose(): void;
}

// ── 1. VOIDCAM X9 — mirrorless camera ──
function buildCamera(): THREE.Group {
  const g = new THREE.Group();
  const body = std(CHARCOAL, 0.5, 0.3);
  const grip = std(DARKGRY, 0.8, 0.1);
  const lensGlass = new THREE.MeshStandardMaterial({
    color: GLASS,
    roughness: 0.08,
    metalness: 0.9,
  });
  const ring = std(GUNMETAL, 0.35, 0.8);

  g.add(box(0.62, 0.42, 0.26, body, 0, 0.36, 0)); // body
  g.add(box(0.16, 0.4, 0.3, grip, -0.32, 0.35, -0.02)); // grip
  g.add(box(0.2, 0.09, 0.18, std(GUNMETAL, 0.3, 0.9), 0.18, 0.6, -0.03)); // hot shoe
  g.add(cyl(0.075, 0.075, 0.1, std(AMBER, 0.3, 0.6), -0.18, 0.55, 0.06)); // shutter dial
  const lens = cyl(0.17, 0.19, 0.3, ring, 0.05, 0.36, 0.22);
  lens.rotation.x = Math.PI / 2;
  g.add(lens);
  const glass = cyl(0.13, 0.13, 0.045, lensGlass, 0.05, 0.36, 0.38);
  glass.rotation.x = Math.PI / 2;
  g.add(glass);
  const hood = cyl(0.2, 0.2, 0.05, std(0x14161a, 0.6, 0.2), 0.05, 0.36, 0.34);
  hood.rotation.x = Math.PI / 2;
  g.add(hood);
  g.add(box(0.1, 0.05, 0.02, std(TEAL, 0.2, 0.4), 0.28, 0.42, 0.14)); // teal rec light
  return g;
}

// ── 2. PLAYSLAB-4 — next-gen console slab ──
function buildConsole(): THREE.Group {
  const g = new THREE.Group();
  const slab = std(0x191d22, 0.42, 0.25);
  g.add(box(1.3, 0.09, 0.42, slab, 0, 0.28, 0)); // slab
  g.add(box(1.3, 0.03, 0.42, std(0x0c0e11, 0.7, 0.1), 0, 0.24, 0)); // shadow underside
  // angled front light strip (the iconic lean)
  const strip = box(1.26, 0.028, 0.05, new THREE.MeshStandardMaterial({
    color: AMBER,
    emissive: AMBER,
    emissiveIntensity: 1.6,
    roughness: 0.3,
  }), 0, 0.335, 0.19);
  g.add(strip);
  g.add(box(0.5, 0.05, 0.3, std(0x14171c, 0.5, 0.4), 0.33, 0.24, -0.05)); // stand base
  g.add(box(0.07, 0.22, 0.07, std(GUNMETAL, 0.4, 0.7), 0.33, 0.35, -0.05)); // stand neck
  g.add(cyl(0.055, 0.055, 0.09, std(CHARCOAL, 0.5, 0.3), -0.45, 0.345, 0.14)); // eject
  g.add(cyl(0.045, 0.045, 0.03, std(0x0a0c0f, 0.3, 0.6), -0.45, 0.345, 0.16)); // button
  return g;
}

// ── 3. AURA-CANS — over-ear headphones ──
function buildHeadphones(): THREE.Group {
  const g = new THREE.Group();
  const shell = std(CHARCOAL, 0.5, 0.2);
  const pad = std(0x11141a, 0.9, 0.05);
  const metal = std(GUNMETAL, 0.35, 0.85);
  // band: half torus
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.035, 10, 24, Math.PI), metal);
  band.position.set(0, 0.62, 0);
  g.add(band);
  // cups
  for (const side of [-1, 1]) {
    const cup = cyl(0.17, 0.19, 0.14, shell, side * 0.31, 0.34, 0);
    cup.rotation.z = Math.PI / 2;
    g.add(cup);
    const cap = cyl(0.17, 0.17, 0.03, metal, side * 0.39, 0.34, 0);
    cap.rotation.z = Math.PI / 2;
    g.add(cap);
    const earpad = cyl(0.15, 0.15, 0.06, pad, side * 0.24, 0.34, 0);
    earpad.rotation.z = Math.PI / 2;
    g.add(earpad);
    // teal LED ring on cap
    const led = new THREE.Mesh(
      new THREE.TorusGeometry(0.1, 0.012, 8, 20),
      new THREE.MeshStandardMaterial({ color: TEAL, emissive: TEAL, emissiveIntensity: 1.4 })
    );
    led.position.set(side * 0.41, 0.34, 0);
    led.rotation.y = Math.PI / 2;
    g.add(led);
    // yoke
    g.add(box(0.028, 0.18, 0.05, metal, side * 0.31, 0.5, 0));
  }
  return g;
}

// ── 4. CHRONO-7 — smartwatch ──
function buildWatch(): THREE.Group {
  const g = new THREE.Group();
  const caseMat = std(0x2a2f36, 0.3, 0.9);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.07, 28), caseMat);
  body.rotation.x = Math.PI / 2;
  body.position.set(0, 0.38, 0);
  g.add(body);
  const screen = new THREE.Mesh(
    new THREE.CylinderGeometry(0.185, 0.185, 0.075, 28),
    new THREE.MeshStandardMaterial({
      color: 0x061418,
      emissive: 0x0f766e,
      emissiveIntensity: 0.55,
      roughness: 0.15,
      metalness: 0.6,
    })
  );
  screen.rotation.x = Math.PI / 2;
  screen.position.set(0, 0.38, 0.02);
  g.add(screen);
  // crown
  g.add(cyl(0.03, 0.03, 0.05, std(AMBER, 0.3, 0.9), 0.225, 0.38, 0.0).rotateZ(Math.PI / 2));
  // band straps
  const bandMat = std(0x15181d, 0.85, 0.05);
  const b1 = box(0.16, 0.34, 0.045, bandMat, 0, 0.7, -0.01);
  b1.rotation.x = -0.18;
  g.add(b1);
  const b2 = box(0.16, 0.34, 0.045, bandMat, 0, 0.06, -0.01);
  b2.rotation.x = 0.18;
  g.add(b2);
  // face glow dot
  g.add(box(0.05, 0.01, 0.01, new THREE.MeshStandardMaterial({ color: RED, emissive: RED, emissiveIntensity: 2 }), 0, 0.42, 0.055));
  return g;
}

// ── 5. SCOUT-1 — camera drone ──
function buildDrone(): THREE.Group {
  const g = new THREE.Group();
  const frame = std(CHARCOAL, 0.45, 0.5);
  const arm = std(0x22262c, 0.5, 0.4);
  const rot = new THREE.Mesh(
    new THREE.TorusGeometry(0.16, 0.022, 8, 22),
    std(0x101316, 0.6, 0.2)
  );
  const hub = box(0.3, 0.11, 0.3, frame, 0, 0.4, 0);
  g.add(hub);
  g.add(box(0.2, 0.06, 0.2, std(0x191d22, 0.4, 0.3), 0, 0.47, 0.02)); // top shell
  g.add(box(0.12, 0.07, 0.1, new THREE.MeshStandardMaterial({ color: RED, emissive: RED, emissiveIntensity: 1.6, roughness: 0.3 }), 0, 0.47, 0.11)); // front sensor
  // gimbal camera
  const gim = cyl(0.06, 0.06, 0.1, std(0x0c0e11, 0.4, 0.6), 0, 0.24, 0.14);
  g.add(gim);
  g.add(box(0.05, 0.05, 0.03, new THREE.MeshStandardMaterial({ color: GLASS, roughness: 0.1, metalness: 0.9 }), 0, 0.24, 0.2));
  // 4 arms + rotor rings
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) {
    const a = box(0.34, 0.045, 0.07, arm, sx * 0.2, 0.4, sz * 0.2);
    a.rotation.y = sx * sz > 0 ? -0.72 : 0.72;
    g.add(a);
    const r = rot.clone();
    r.position.set(sx * 0.33, 0.43, sz * 0.33);
    r.rotation.x = Math.PI / 2;
    g.add(r);
    g.add(cyl(0.05, 0.05, 0.09, std(GUNMETAL, 0.4, 0.8), sx * 0.33, 0.42, sz * 0.33));
  }
  return g;
}

// ── 6. THUMP TOWER — smart speaker ──
function buildSpeaker(): THREE.Group {
  const g = new THREE.Group();
  const mesh = std(0x171b20, 0.85, 0.1);
  const body = cyl(0.24, 0.28, 0.86, mesh, 0, 0.43, 0, 26);
  g.add(body);
  const top = cyl(0.24, 0.24, 0.03, std(0x0d0f13, 0.5, 0.4), 0, 0.87, 0, 26);
  g.add(top);
  // teal control ring on top
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.14, 0.014, 8, 26),
    new THREE.MeshStandardMaterial({ color: TEAL, emissive: TEAL, emissiveIntensity: 1.5 })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.set(0, 0.89, 0);
  g.add(ring);
  // amber base glow
  const base = new THREE.Mesh(
    new THREE.TorusGeometry(0.2, 0.016, 8, 26),
    new THREE.MeshStandardMaterial({ color: AMBER, emissive: AMBER, emissiveIntensity: 1.2 })
  );
  base.rotation.x = Math.PI / 2;
  base.position.set(0, 0.05, 0);
  g.add(base);
  // subtle horizontal weave lines (grille illusion)
  for (let i = 0; i < 7; i++) {
    const t = cyl(0.2805 + i * 0.0004, 0.2805 + i * 0.0004, 0.012, std(0x101316, 0.9, 0.05), 0, 0.18 + i * 0.09, 0, 26);
    g.add(t);
  }
  return g;
}

// ─── 7. CLOUDSTEP OG — celestial runner ──
function buildSneaker(): THREE.Group {
  const g = new THREE.Group();
  const soleMat = std(OFFWHITE, 0.55, 0.05);
  const upperMat = std(0xf2ece0, 0.5, 0.1);
  // moon-foam sole slab
  g.add(box(0.98, 0.09, 0.4, soleMat, 0, 0.05, 0));
  // toe cap rising into the sole
  const toe = box(0.34, 0.16, 0.38, soleMat, 0.33, 0.13, 0);
  toe.rotation.z = -0.22;
  g.add(toe);
  // pearl upper
  g.add(box(0.62, 0.2, 0.36, upperMat, -0.08, 0.2, 0));
  // heel collar
  g.add(box(0.18, 0.26, 0.34, std(0x1f2328, 0.7, 0.1), -0.42, 0.25, 0));
  // gold lightning stripe
  const stripe = box(0.36, 0.05, 0.37, std(AMBER, 0.3, 0.85), 0.02, 0.17, 0);
  stripe.rotation.z = 0.38;
  g.add(stripe);
  // laces
  for (let i = 0; i < 4; i++) {
    g.add(box(0.05, 0.022, 0.31, std(0xe7e0d0, 0.6, 0), -0.05 + i * 0.13, 0.3 - i * 0.012, 0));
  }
  // teal sigil on the heel
  g.add(box(0.08, 0.08, 0.02, std(TEAL, 0.3, 0.5), -0.37, 0.17, 0.18));
  return g;
}

// ─── 8. SERAPH BOOK 16 — halo-grade laptop ──
function buildLaptop(): THREE.Group {
  const g = new THREE.Group();
  const alu = std(0xd9d6cf, 0.32, 0.78);
  // base
  g.add(box(1.1, 0.045, 0.78, alu, 0, 0.023, 0));
  // keyboard plate + key rows (bake-only detail, thrown away after)
  g.add(box(0.95, 0.012, 0.58, std(0x2b3038, 0.5, 0.3), -0.02, 0.05, 0.02));
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 6; c++) {
      g.add(box(0.115, 0.008, 0.085, std(0x3a4048, 0.6, 0.2), -0.37 + c * 0.148, 0.06, -0.2 + r * 0.115));
    }
  }
  // gold hinge bar
  g.add(box(1.02, 0.03, 0.05, std(AMBER, 0.3, 0.9), 0, 0.055, -0.37));
  // screen slab, opened ~105°
  const screen = box(1.1, 0.72, 0.035, alu, 0, 0.37, -0.375);
  screen.rotation.x = -0.24;
  g.add(screen);
  // emissive display facing the pilgrim
  const disp = box(1.02, 0.64, 0.012,
    new THREE.MeshStandardMaterial({
      color: 0x0b1416,
      emissive: 0x0f766e,
      emissiveIntensity: 0.9,
      roughness: 0.18,
      metalness: 0.55,
    }), 0, 0.372, -0.352);
  disp.rotation.x = -0.24;
  g.add(disp);
  // gold sun-dot logo on the lid's back (shows in the rear angles)
  const logo = cyl(0.05, 0.05, 0.012, std(AMBER, 0.25, 0.95), 0, 0.37, -0.4);
  logo.rotation.x = -0.24 + Math.PI / 2;
  g.add(logo);
  return g;
}

// ─── 9. HALO MUG — the tiny relic (size-control showcase) ───
function buildMug(): THREE.Group {
  const g = new THREE.Group();
  const ceramic = std(0xf5efdd, 0.35, 0.1); // pearl glaze
  const gold = std(AMBER, 0.22, 0.95);
  // body (r 0.07 × h 0.15)
  g.add(cyl(0.07, 0.062, 0.15, ceramic, 0, 0.075, 0, 26));
  // gold rim + foot ring
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.068, 0.005, 8, 24), gold);
  rim.rotation.x = Math.PI / 2;
  rim.position.set(0, 0.148, 0);
  g.add(rim);
  const foot = new THREE.Mesh(new THREE.TorusGeometry(0.058, 0.004, 8, 24), gold);
  foot.rotation.x = Math.PI / 2;
  foot.position.set(0, 0.006, 0);
  g.add(foot);
  // coffee — dark pool with a soft sheen
  g.add(cyl(0.062, 0.062, 0.006, new THREE.MeshStandardMaterial({
    color: 0x14100c,
    roughness: 0.18,
    metalness: 0.35,
  }), 0, 0.138, 0, 24));
  // handle — a small golden wishbone
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.036, 0.008, 8, 22), gold);
  handle.position.set(0.088, 0.085, 0);
  handle.rotation.y = Math.PI / 2;
  g.add(handle);
  // teal sigil on the front
  g.add(box(0.03, 0.03, 0.004, new THREE.MeshStandardMaterial({
    color: TEAL,
    emissive: TEAL,
    emissiveIntensity: 0.9,
    roughness: 0.3,
  }), 0, 0.085, 0.068));
  return g;
}

// ─── 10. NEBULA SOFA — the grand relic (size-control showcase) ───
function buildSofa(): THREE.Group {
  const g = new THREE.Group();
  const velvet = std(0xf2ecdf, 0.92, 0.02); // pearl nebula velvet
  const velvet2 = std(0xe9e2d2, 0.95, 0.02);
  const gold = std(AMBER, 0.25, 0.9);
  // plush base
  g.add(box(2.1, 0.26, 0.9, velvet, 0, 0.2, 0));
  // seat cushions
  g.add(box(0.95, 0.13, 0.78, velvet2, -0.5, 0.36, 0.03));
  g.add(box(0.95, 0.13, 0.78, velvet2, 0.5, 0.36, 0.03));
  // backrest + back cushions
  g.add(box(2.1, 0.52, 0.2, velvet, 0, 0.55, -0.35));
  g.add(box(0.95, 0.4, 0.14, velvet2, -0.5, 0.6, -0.27));
  g.add(box(0.95, 0.4, 0.14, velvet2, 0.5, 0.6, -0.27));
  // rolled arms
  const armL = cyl(0.13, 0.13, 0.86, velvet, -1.02, 0.36, 0, 18);
  armL.rotation.x = Math.PI / 2;
  g.add(armL);
  const armR = cyl(0.13, 0.13, 0.86, velvet, 1.02, 0.36, 0, 18);
  armR.rotation.x = Math.PI / 2;
  g.add(armR);
  // gilded feet
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) {
    g.add(cyl(0.035, 0.05, 0.08, gold, sx * 0.95, 0.045, sz * 0.36, 12));
  }
  // gold seam piping across the front base
  g.add(box(2.0, 0.02, 0.02, gold, 0, 0.3, 0.45));
  // teal sigil pillows
  for (const sx of [-1, 1]) {
    const pillow = box(0.34, 0.3, 0.12, std(0x0f766e, 0.8, 0.1), sx * 0.62, 0.62, -0.18);
    pillow.rotation.x = -0.18;
    pillow.rotation.z = sx * 0.1;
    g.add(pillow);
  }
  return g;
}

export const PRODUCT_BUILDERS: Record<string, () => THREE.Group> = {
  voidcam: buildCamera,
  playslab: buildConsole,
  auracans: buildHeadphones,
  chrono: buildWatch,
  scout: buildDrone,
  thump: buildSpeaker,
  cloudstep: buildSneaker,
  seraphbook: buildLaptop,
  halomug: buildMug,
  nebulasofa: buildSofa,
};

// ─── Catalog ───────────────────────────────────────────────────────────────
export const CATALOG: ProductSpec[] = [
  {
    id: "voidcam",
    name: "VOIDCAM X9",
    category: "OPTICS",
    price: 1299,
    credits: 1299,
    blurb:
      "Full-frame mirrorless predator. 61MP sensor, 8-stop stabilization and a f/0.95 prime lens that drinks light in the dark. Built like a bunker, shoots like a railgun.",
    specs: ["61MP FULL-FRAME SENSOR", "8K/30 RAW VIDEO", "8-STOP IBIS", "F/0.95 PRIME KIT", "DUAL CFexpress SLOTS", "WEATHER-SEALED TITANIUM"],
    spriteW: 0.95,
    spriteH: 0.78,
    accent: 0x2dd4bf,
  },
  {
    id: "playslab",
    name: "PLAYSLAB-4",
    category: "GAMING",
    price: 549,
    credits: 549,
    blurb:
      "Liquid-cooled 12TFLOP console slab with an amber pulse strip. 4K/120 ray-traced frames, 2TB NVMe warpspeed storage, and a standby mode so deep it borders on cryo-sleep.",
    specs: ["12 TFLOPS RDNA GPU", "4K/120HZ RAY-TRACING", "2TB NVME SSD", "LIQUID METAL COOLING", "HAPTIC CONTROLLER", "8K UPSCALING ENGINE"],
    spriteW: 1.35,
    spriteH: 0.6,
    accent: 0xf59e0b,
  },
  {
    id: "auracans",
    name: "AURA-CANS 900",
    category: "AUDIO",
    price: 399,
    credits: 399,
    blurb:
      "Planar-magnetic over-ears with adaptive noise cancellation that erases the world. Machined aluminium yokes, memory-foam cryo-pads and 80 hours of untethered silence.",
    specs: ["PLANAR MAGNETIC DRIVERS", "-42DB ADAPTIVE ANC", "80H BATTERY LIFE", "LDAC HI-RES WIRELESS", "MACHINED ALU YOKES", "SPATIAL HEAD TRACKING"],
    spriteW: 0.92,
    spriteH: 1.0,
    accent: 0x2dd4bf,
  },
  {
    id: "chrono",
    name: "CHRONO-7 TITAN",
    category: "WEARABLES",
    price: 799,
    credits: 799,
    blurb:
      "Grade-5 titanium smartwatch with sapphire crystal, 30-day battery and a sensor array that reads your blood like a med-bay. ECG, SpO2, HRV, sleep stages — the full telemetry package.",
    specs: ["GRADE-5 TITANIUM CASE", "SAPPHIRE CRYSTAL", "30-DAY BATTERY", "ECG + SPO2 + HRV", "200M WATER RESIST", "DUAL-BAND GNSS"],
    spriteW: 0.62,
    spriteH: 1.0,
    accent: 0xf59e0b,
  },
  {
    id: "scout",
    name: "SCOUT-1 DRONE",
    category: "AERIAL",
    price: 1099,
    credits: 1099,
    blurb:
      "48MP folding drone with 8K HDR gimbal, 46 minutes of flight time and omnidirectional obstacle sensing. Follows you through canyons like a trained hunting hawk.",
    specs: ["48MP 8K HDR GIMBAL", "46MIN FLIGHT TIME", "15KM OCC LINK", "OMNIDIRECTIONAL SENSING", "42MPH SPORT MODE", "FOLDABLE TITANIUM ARMS"],
    spriteW: 0.95,
    spriteH: 0.7,
    accent: 0xdc2626,
  },
  {
    id: "thump",
    name: "THUMP TOWER XL",
    category: "AUDIO",
    price: 299,
    credits: 299,
    blurb:
      "360° room-shaking smart speaker with a down-firing 6.5\" woofer and teal command ring. Auto-tunes itself to your room's acoustics in 12 seconds flat. The neighbors will file reports.",
    specs: ["360° WAVEGUIDE ARRAY", "6.5\" DOWNFIRE WOOFER", "130W RMS CLASS-D", "ROOM AUTO-CALIBRATION", "MULTI-ROOM MESH", "TEAL COMMAND RING"],
    spriteW: 0.72,
    spriteH: 1.1,
    accent: 0x2dd4bf,
  },
  {
    id: "cloudstep",
    name: "CLOUDSTEP OG",
    category: "FOOTWEAR",
    price: 249,
    credits: 249,
    blurb:
      "Cloud-composite runner on a moon-foam midsole that returns 78% of every stride. Pearl-knit upper, gold lightning stripe, and a teal sigil stitched into the heel. Walks like a hymn.",
    specs: ["CLOUD-COMPOSITE MIDSOLE", "78% ENERGY RETURN", "PEARL-KNIT UPPER", "TITANIUM LACE LOCKS", "228G PER SHOE", "AQUA-GRIP OUTSOLE"],
    spriteW: 1.05,
    spriteH: 0.62,
    accent: 0xf59e0b,
  },
  {
    id: "seraphbook",
    name: "SERAPH BOOK 16",
    category: "COMPUTING",
    price: 2199,
    credits: 2199,
    blurb:
      "16-core halo-silicon laptop with a 120Hz mini-LED panel that peaks at 1600 nits. Cold-forged aluminium unibody, gold hinge, and a fan that never preaches above 18 dB.",
    specs: ["16-CORE HALO SILICON", "16\" 120HZ MINI-LED", "1600-NIT PEAK HDR", "64GB UNIFIED MEMORY", "8TB NVME RAID", "18DB WHISPER COOLING"],
    spriteW: 1.25,
    spriteH: 0.85,
    accent: 0x2dd4bf,
  },
  {
    id: "halomug",
    name: "HALO MUG",
    category: "TABLEWARE",
    price: 39,
    credits: 39,
    blurb:
      "A pearl-glazed chalice for morning pilgrimages. Kiln-fired ceramic with a gilded rim, a wishbone handle, and a teal sigil that glows faintly when the coffee is divine. The smallest relic in the temple — proof that size is a dial, not a destiny.",
    specs: ["PEARL KILN GLAZE", "22-CARAT GILDED RIM", "WISHBONE GOLD HANDLE", "350ML CAPACITY", "DISHWASHER-SAFE FAITH", "WORLD SIZE: 0.23M"],
    spriteW: 0.23,
    spriteH: 0.17,
    accent: 0x2dd4bf,
  },
  {
    id: "nebulasofa",
    name: "NEBULA SOFA",
    category: "FURNITURE",
    price: 1499,
    credits: 1499,
    blurb:
      "A 2.2-meter cloud of pearl velvet on gilded feet. Deep nebula cushions, rolled arms, and teal sigil pillows stitched for long sermons. The temple's largest relic — walk up close and feel the scale dial roar.",
    specs: ["2.2M PEARL VELVET BODY", "DEEP NEBULA CUSHIONS", "GILDED BRASS FEET", "ROLLED CLOUD ARMS", "TEAL SIGIL PILLOWS", "WORLD SIZE: 2.20M"],
    spriteW: 2.2,
    spriteH: 0.82,
    accent: 0xf59e0b,
  },
];
