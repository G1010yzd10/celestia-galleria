// ─── DOOM MART :: shared types ──────────────────────────────────────────────
export interface ProductSpec {
  id: string;
  name: string;
  category: string;
  price: number;
  credits: number;
  blurb: string;
  specs: string[];
  /** world footprint width / height in meters (sprite plane size) */
  spriteW: number;
  spriteH: number;
  /** accent used for glow ring / hologram */
  accent: number;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  qty: number;
}

export interface EngineStats {
  fps: number;
  vramMB: number;
  drawCalls: number;
  sprites: number;
  px: number;
  pz: number;
  yaw: number;
}

export type QualityMode = "ultra" | "lite";

export interface LevelGrid {
  /** cell = 1 blocked, 0 open, 2 water(blocked), 3 pedestal(blocked) */
  cells: Uint8Array;
  w: number;
  h: number;
  cell: number;
}

export const CELL = 1.2;

/** 16 × 14 arena — '#' wall, '.' floor, '~' nukage pool, 'P' pedestal */
export const MAP_ART = [
  "################",
  "#..............#",
  "#..P........P..#",
  "#..............#",
  "#...~~~~~~~~...#",
  "#...~~~~~~~~...#",
  "#...~~~~~~~~...#",
  "#..P.~~~~~~~.P.#",
  "#..............#",
  "#..P.......P...#",
  "#..............#",
  "#..............#",
  "#......^.......#", // ^ = spawn
  "################",
];

export function parseMap(): LevelGrid {
  const h = MAP_ART.length;
  const w = MAP_ART[0].length;
  const cells = new Uint8Array(w * h);
  for (let z = 0; z < h; z++) {
    for (let x = 0; x < w; x++) {
      const c = MAP_ART[z][x];
      cells[z * w + x] = c === "#" ? 1 : c === "~" ? 2 : c === "P" ? 3 : 0;
    }
  }
  return { cells, w, h, cell: CELL };
}
