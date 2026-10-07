// ─── CELESTIA GALLERIA ✦ :: shared types ────────────────────────────────────
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

/** 16 × 14 arena — '#' wall, '.' floor, '~' lagoon, 'P' pedestal, '^' spawn
 *  Rows 1 & 3 hold the FORGE SHRINES: six extra pedestals reserved for
 *  pilgrim-uploaded sprites (row 11's pair is freed by the two new catalog
 *  relics — see level.ts for the assignment order). */
export const MAP_ART = [
  "################",
  "#...P.P.P.P...#", // north gallery — custom shrines 3..6
  "#..P........P..#",
  "#...P.P.P.P...#", // poolside — catalog overflow row
  "#...~~~~~~~~...#",
  "#...~~~~~~~~...#",
  "#...~~~~~~~~...#",
  "#..P.~~~~~~~.P.#",
  "#..............#",
  "#..P.......P...#",
  "#..............#",
  "#..P........P..#", // south pair — custom shrines 1..2
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
