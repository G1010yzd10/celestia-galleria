// ─── CELESTIA GALLERIA ✦ :: shared types — v2.0 THE GRAND MALL ──────────────

/** what an OWNED relic does when you press USE */
export type UseVerb =
  | "photo" // VOIDCAM — raise it, look through it, shoot PNGs of the temple
  | "sit" // sofas & benches — take a load off, pilgrim
  | "sip" // HALO MUG — a blessing of swiftness
  | "wear" // CLOUDSTEP — equip for permanent speed
  | "read" // SERAPH BOOK — opens the Codex overlay
  | "light" // AURORA LAMP — a personal halo follows you
  | "cinema" // TITAN VIEW — dims the temple for movie night
  | "bloom" // LUMEN FERN — a burst of angel dust
  | "stars" // STAR CHART — the heavens twinkle back
  | "dawn" // DAWN BELL — a sunrise passes through the mall
  | "ascend" // SERAPH WINGS — a taste of flight
  | "harmony" // PRISM TOWER — the temple sings
  | "chime" // CELESTIAL CHRONOMETER — the temple reads the hour
  | "revere"; // default — hands raised, relic glows

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
  /** what pressing USE does once you OWN it (default: revere) */
  use?: UseVerb;
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
  zone: string;
  buffs: { label: string; sec: number }[];
}

/** crosshair prompt — unified across products, altar, benches, carrying */
export interface PromptInfo {
  kind: "inspect" | "use" | "altar" | "sit" | "place" | "stand";
  /** full prompt text minus the key hint, e.g. "INSPECT VOIDCAM X9" */
  verb: string;
  spec: ProductSpec | null;
}

export type QualityMode = "glory" | "balanced" | "lite";

export interface LevelGrid {
  /** 0 open · 1 wall · 2 water(blocked) · 3 pedestal · 4 sanctum slot · 5 altar */
  cells: Uint8Array;
  w: number;
  h: number;
  cell: number;
}

/** axis-aligned world collider — tight to the actual geometry */
export interface Collider {
  x0: number;
  z0: number;
  x1: number;
  z1: number;
}

export interface ZoneInfo {
  name: string;
  x0: number;
  z0: number;
  x1: number;
  z1: number;
}

export const CELL = 1.2;

/** THE GRAND MALL — 36 × 30 cells = 43.2 m × 36 m of celestial retail.
 *  '#' wall · '.' floor · '~' lagoon · 'P' pedestal · 'S' sanctum slot ·
 *  'A' acquisition altar · '^' spawn
 *
 *  Layout (north → south):
 *    rows  1– 2  THE FORGE GALLERY — ten shrines for pilgrim sprites
 *    rows  4–13  THE GRAND ATRIUM — 12 relic pedestals around the lagoon
 *    rows 15–22  three courts: GARDEN & AUDIO · THE PROMENADE · VISION
 *    rows 24–28  THE SANCTUM — owned relics + the ACQUISITION ALTAR + spawn
 */
export const MAP_ART = [
  "####################################",
  "#..................................#",
  "#...P..P..P..P..P..P..P..P..P..P...#", // forge shrines (10)
  "#......#########....#########......#", // partition · 3 gates
  "#..................................#",
  "#....P...P...P........P...P...P....#", // atrium north row (6)
  "#..................................#",
  "#.............~~~~~~~~.............#", // the celestial lagoon
  "#.............~~~~~~~~.............#",
  "#.............~~~~~~~~.............#",
  "#.............~~~~~~~~.............#",
  "#..................................#",
  "#....P...P...P........P...P...P....#", // atrium south row (6)
  "#..................................#",
  "#......#########....#########......#", // partition · 3 gates
  "#...........#..........#...........#", // wing walls
  "#...........#..........#...........#",
  "#..P......P..#..........#..P......P..#", // wing relic rows (2+2)
  "#..................................#", // wing gate rows
  "#..................................#",
  "#..P......P..#..........#..P......P..#", // wing relic rows (2+2)
  "#...........#..........#...........#",
  "#...........#..........#...........#",
  "#......#########....#########......#", // partition · 3 gates
  "#................AA................#", // THE ACQUISITION ALTAR
  "#..................................#",
  "#..S..S..S..S...S..S...S..S..S..S..#", // sanctum plinths (10)
  "#..................................#",
  "#................^.................#", // spawn — facing the altar
  "####################################",
];

export function parseMap(): LevelGrid {
  const h = MAP_ART.length;
  const w = MAP_ART[0].length;
  const cells = new Uint8Array(w * h);
  for (let z = 0; z < h; z++) {
    const row = MAP_ART[z];
    for (let x = 0; x < w; x++) {
      const c = row[x] ?? ".";
      cells[z * w + x] =
        c === "#" ? 1 : c === "~" ? 2 : c === "P" ? 3 : c === "S" ? 4 : c === "A" ? 5 : 0;
    }
  }
  return { cells, w, h, cell: CELL };
}
